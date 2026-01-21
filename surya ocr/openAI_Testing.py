import streamlit as st
from openai import OpenAI
import base64
import os
from dotenv import load_dotenv

# --------------------------------------------------
# 1. Load Environment Variables
# --------------------------------------------------
load_dotenv(override=True)
api_key = os.getenv("OPENAI_API_KEY")

# --------------------------------------------------
# 2. Streamlit Page Config
# --------------------------------------------------
st.set_page_config(page_title="GPT-4o OCR App", layout="centered")
st.title("🤖 GPT-4o AI Vision OCR")
st.markdown("Upload an image and extract text using GPT-4o-mini.")

# --------------------------------------------------
# 3. API Key Check
# --------------------------------------------------
if not api_key:
    st.error("OPENAI_API_KEY not found in .env file")
    st.stop()

st.success(f"API Key Loaded (ends with ...{api_key[-4:]})")

# --------------------------------------------------
# 4. OpenAI Client
# --------------------------------------------------
client = OpenAI(api_key=api_key)

# --------------------------------------------------
# 5. Helper
# --------------------------------------------------
def encode_image(uploaded_file):
    return base64.b64encode(uploaded_file.getvalue()).decode("utf-8")

# --------------------------------------------------
# 6. Upload Image
# --------------------------------------------------
uploaded_file = st.file_uploader(
    "Upload an image",
    type=["png", "jpg", "jpeg"]
)

if uploaded_file:
    st.image(uploaded_file, caption="Uploaded Image", use_container_width=True)

    if st.button("🔍 Extract Text"):
        base64_image = encode_image(uploaded_file)

        with st.spinner("Running OCR..."):
            try:
                response = client.responses.create(
                    model="gpt-4o-mini",
                    input=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "input_text",
                                    "text": "Extract all text from this image exactly as it appears. Preserve formatting."
                                },
                                {
                                    "type": "input_image",
                                    "image_url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            ]
                        }
                    ],
                    max_output_tokens=1000
                )

                extracted_text = response.output_text

                st.subheader("📄 Extracted Text")
                st.text_area("OCR Output", extracted_text, height=300)

                st.download_button(
                    "⬇️ Download Text",
                    extracted_text,
                    file_name="ocr_output.txt",
                    mime="text/plain"
                )

                st.success("OCR completed successfully!")

            except Exception as e:
                st.error(f"❌ Error: {e}")
