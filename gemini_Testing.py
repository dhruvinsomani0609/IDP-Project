import streamlit as st
from google import genai
from PIL import Image, ImageDraw
import os
import json
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv(override=True)

# 2. Page Setup
st.set_page_config(page_title="Gemini Visual OCR", layout="wide")
st.title("⚡ Gemini Visual OCR (JSON + Bounding Boxes)")
st.markdown("Extracts structured JSON **AND** visualizes text locations using Gemini 2.0 Flash.")

# 3. Initialize Client
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    st.error("🔑 API Key not found! Please check your .env file.")
    st.stop()

try:
    client = genai.Client(api_key=api_key)
except Exception as e:
    st.error(f"Failed to initialize client: {e}")
    st.stop()

# --- HELPER FUNCTION: DRAW BOXES ---
def draw_boxes_on_image(image, json_response):
    """
    Parses the JSON to find 'box_2d' coordinates and draws red rectangles.
    Gemini usually returns coordinates in [ymin, xmin, ymax, xmax] format 
    on a scale of 0 to 1000.
    """
    draw = ImageDraw.Draw(image)
    width, height = image.size
    
    # Check if 'layout' key exists in the response
    layout_items = json_response.get("layout", [])
    
    for item in layout_items:
        box = item.get("box_2d") # Expecting [ymin, xmin, ymax, xmax]
        if box and len(box) == 4:
            # Normalize 0-1000 coordinates to actual pixel dimensions
            ymin, xmin, ymax, xmax = box

            # Ensure correct order
            ymin, ymax = min(ymin, ymax), max(ymin, ymax)
            xmin, xmax = min(xmin, xmax), max(xmin, xmax)

            x1 = (xmin / 1000) * width
            y1 = (ymin / 1000) * height
            x2 = (xmax / 1000) * width
            y2 = (ymax / 1000) * height

            # Draw Red Rectangle (Outline)
            draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
            
    return image

# --- UPDATED PROMPT ---
# We ask for TWO things: 
# 1. 'structured_data': The clean JSON you wanted originally.
# 2. 'layout': A list of text blocks with their coordinates [ymin, xmin, ymax, xmax] (0-1000 scale).
SYSTEM_PROMPT = """
You are a Visual Document Understanding engine. 
Perform two tasks simultaneously:

TASK 1: Extract structured data (JSON)
Analyze the document and extract key fields into a hierarchical JSON structure under the key "structured_data". 
(e.g., Invoice Number, Date, Line Items, Addresses).

TASK 2: Generate Bounding Boxes (Layout)
Identify the visual location of text blocks in the image. Return a list under the key "layout".
For each item in "layout", provide:
- "text": The text content.
- "box_2d": A list of 4 integers [ymin, xmin, ymax, xmax] representing the bounding box on a scale of 0 to 1000.

OUTPUT FORMAT:
Return ONLY valid JSON with this structure:
{
  "structured_data": { 
      // Your extracted hierarchical data here
  },
  "layout": [
      { "text": "Invoice", "box_2d": [10, 10, 50, 200] },
      { "text": "Total $500", "box_2d": [800, 500, 850, 600] }
  ]
}
"""

# 4. File Uploader
uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "png", "jpeg", "webp"])

if uploaded_file:
    # Load Image
    image = Image.open(uploaded_file).convert("RGB") # Convert to RGB to ensure drawing works
    
    # Create two columns
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Original Image")
        st.image(image, use_container_width=True)

    if st.button("Extract & Visualize"):
        with st.spinner("Processing with Gemini..."):
            try:
                # 5. Call Gemini
                response = client.models.generate_content(
                    model="gemini-flash-latest", 
                    contents=[SYSTEM_PROMPT, image],
                    config={'response_mime_type': 'application/json'}
                )
                
                if response.text:
                    data = json.loads(response.text)
                    
                    # 6. Draw Boxes
                    annotated_image = image.copy()
                    final_image = draw_boxes_on_image(annotated_image, data)
                    
                    # 7. Display Results
                    with col2:
                        st.subheader("Visualized Output")
                        st.image(final_image, caption="Gemini Detected Regions", use_container_width=True)

                    st.divider()
                    st.subheader("Extracted JSON Data")
                    
                    # Show the clean data (we hide the 'layout' key to keep it clean for the user)
                    clean_display = data.get("structured_data", {})
                    st.json(clean_display)
                    
                    # Download full response
                    st.download_button("Download Full JSON", response.text, file_name="ocr_result.json")
                    
                else:
                    st.warning("No response generated.")

            except Exception as e:
                st.error(f"Error: {e}")