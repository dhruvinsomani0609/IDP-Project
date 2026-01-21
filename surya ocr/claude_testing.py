import streamlit as st
import base64
import os
import json
from openai import OpenAI  # Use OpenAI client for Groq (More reliable for Vision)
from PIL import Image, ImageDraw
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv(override=True)

# 2. Page Setup
st.set_page_config(page_title="Groq OCR + Visuals", layout="wide")
st.title("⚡ Groq Vision: Extraction + Grounding")
st.markdown("Attempting to extract JSON **AND** coordinates using **Llama 3.2 90B** on Groq.")

# 3. Initialize Client
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    st.error("🔑 GROQ_API_KEY not found!")
    st.stop()

# Connect to Groq via OpenAI SDK
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=api_key
)

# --- HELPER: DRAW BOXES ---
def draw_boxes_on_image(image, json_response):
    """
    Draws red boxes based on [ymin, xmin, ymax, xmax] (0-1000 scale)
    """
    draw = ImageDraw.Draw(image)
    width, height = image.size
    
    # Llama sometimes puts layout in 'layout' or just returns a list
    # We will look for the 'layout' key
    layout_items = json_response.get("layout", [])
    
    for item in layout_items:
        box = item.get("box_2d") 
        if box and len(box) == 4:
            # Groq/Llama usually follows [ymin, xmin, ymax, xmax] like Gemini
            ymin, xmin, ymax, xmax = box
            
            x1 = (xmin / 1000) * width
            y1 = (ymin / 1000) * height
            x2 = (xmax / 1000) * width
            y2 = (ymax / 1000) * height
            
            draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
            
    return image

# --- HELPER: ENCODE IMAGE ---
def encode_image(uploaded_file):
    return base64.b64encode(uploaded_file.getvalue()).decode('utf-8')

# --- THE PROMPT ---
# We must be EXTREMELY specific with Llama 3.2 to get coordinates
SYSTEM_PROMPT = """
You are a Visual Extraction Engine. Perform two tasks:

1. "structured_data": Extract all text into hierarchical JSON.
2. "layout": Detect the visual bounding boxes of main text blocks.
   - Format: "box_2d": [ymin, xmin, ymax, xmax] on a scale of 0 to 1000.
   - Example: [0, 0, 1000, 1000] is the whole image.

Output ONLY valid JSON.
{
  "structured_data": { ... },
  "layout": [
      { "text": "Header", "box_2d": [10, 10, 50, 100] }
  ]
}
"""

# 4. UI Logic
uploaded_file = st.file_uploader("Upload an Image", type=["jpg", "png", "jpeg", "webp"])

if uploaded_file:
    # Load PIL Image for drawing
    image = Image.open(uploaded_file).convert("RGB")
    
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Original")
        st.image(image, use_container_width=True)
    
    if st.button("Extract & Visualise", type="primary"):
        with st.spinner("Groq is processing..."):
            try:
                base64_image = encode_image(uploaded_file)
                
                response = client.chat.completions.create(
                    model="meta-llama/llama-4-maverick-17b-128e-instruct", # The 90B model is smarter at coordinates
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": SYSTEM_PROMPT},
                                {
                                    "type": "image_url", 
                                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                                }
                            ]
                        }
                    ],
                    temperature=0,
                    response_format={"type": "json_object"} # Forces JSON mode
                )

                content = response.choices[0].message.content
                
                # Parse JSON
                data = json.loads(content)
                
                # Draw Boxes
                annotated_image = image.copy()
                final_image = draw_boxes_on_image(annotated_image, data)
                
                # Display
                with col2:
                    st.subheader("Visualized Output")
                    st.image(final_image, caption="Llama 3.2 Detected Regions", use_container_width=True)
                
                st.divider()
                st.subheader("Extracted JSON")
                st.json(data.get("structured_data", {}))
                st.download_button("Download JSON", content, file_name="groq_ocr.json")

            except json.JSONDecodeError:
                st.error("Groq returned invalid JSON. Try again.")
                st.code(content)
            except Exception as e:
                st.error(f"Error: {e}")
