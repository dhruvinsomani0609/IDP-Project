import streamlit as st
from openai import OpenAI
import base64
import os
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv(override=True)
api_key = os.getenv("OPENROUTER_API_KEY")

# 2. Page Setup
st.set_page_config(page_title="OpenRouter Free OCR", layout="centered")
st.title("🔓 OpenRouter Free OCR")

# 3. Model Selection (Crucial Step)
# Devstral (your choice) is text-only, so we default to Llama 3.2 Vision (Free)
# You can change this string to any other free VISION model on OpenRouter.
MODEL_ID = "qwen/qwen-2.5-vl-7b-instruct:free"

st.info(f"Using Model: `{MODEL_ID}`")

# 4. Check Key
if not api_key:
    st.error("🔑 OpenRouter API Key not found! Please check your .env file.")
    st.stop()

# 5. Initialize Client (Pointing to OpenRouter)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)


# 6. Helper to Encode Image
def encode_image(uploaded_file):
    return base64.b64encode(uploaded_file.getvalue()).decode("utf-8")


# 7. UI and Logic
uploaded_file = st.file_uploader(
    "Choose an image...", type=["jpg", "png", "jpeg", "webp"]
)

if uploaded_file:
    st.image(uploaded_file, caption="Uploaded Image", use_container_width=True)

    if st.button("Extract Text"):
        base64_image = encode_image(uploaded_file)

        with st.spinner(f"Reading image with {MODEL_ID}..."):
            try:
                response = client.chat.completions.create(
                    model=MODEL_ID,
                    extra_headers={
                        "HTTP-Referer": "http://localhost:8501",  # Required by OpenRouter
                        "X-Title": "Streamlit OCR App",
                    },
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": """
Role: You are an advanced Document Structure & OCR Analysis Engine. Your goal is to extract all text from the provided image and restructure it into a strictly hierarchical JSON format that mirrors the visual layout and logical relationships of the document.

Core Instructions:
1. Analyze Layout: Before extracting, identify the document's structure. Recognize main headers, sub-headers, sections, tables, and key-value pairs.
2. Create Hierarchy:
    - Headers become parent keys.
    - Sub-headers become nested child keys.
    - Body text under a header becomes a string value or a list of strings if it is a bulleted list.
    - Tables must be converted into an array of objects, where column headers are keys.
    - Forms (Label: Value) must be converted into direct "Label": "Value" key-pairs.
3. Clean Output:
    - Return ONLY valid, parseable JSON.
    - Do not include markdown formatting (like ```json).
    - Do not include intro/outro text.
    - Standardize dates to YYYY-MM-DD and currency to 1234.56 format where possible.

JSON Structure Rules:
- If a section has no title, use a generic key like "section_1", "header_info", or "footer_info".
- Group related fields (e.g., an address block) into a single object: {"address": {"street": "...", "city": "..."}}.
- Handle checkboxes: If checked, return true; if unchecked, return false or null.

Example Input to Output Logic:
Input (Visual):
INVOICE Date: Jan 01, 2024 Bill To: John Doe 123 Main St Items:
Widget A - $10
Widget B - $20

Required Output (JSON):
{
  "document_type": "invoice",
  "meta_data": {
    "date": "2024-01-01"
  },
  "sections": {
    "bill_to": {
      "name": "John Doe",
      "address": "123 Main St"
    },
    "line_items": [
      { "item_id": 1, "description": "Widget A", "price": 10.00 },
      { "item_id": 2, "description": "Widget B", "price": 20.00 }
    ]
  }
}
Task: Analyze the provided image and generate the hierarchical JSON now.
""",
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{base64_image}"
                                    },
                                },
                            ],
                        }
                    ],
                )

                # Display Output
                if response.choices:
                    extracted_text = response.choices[0].message.content
                    st.subheader("Extracted Text")
                    st.write(extracted_text)
                    st.download_button("Download Text", extracted_text)
                else:
                    st.error("Model returned no content.")

            except Exception as e:
                st.error(f"Error: {e}")
