#!/usr/bin/env python
import os
import sys
import io
import json
import base64
import requests
from PIL import Image
import fitz  # PyMuPDF
from dotenv import load_dotenv
from deep_translator import GoogleTranslator
from gtts import gTTS
import tempfile

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("GEMINI_API_KEY not found in environment.", file=sys.stderr)
    sys.exit(1)
API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"

def load_xray(file_path):
    ext = os.path.splitext(file_path)[-1].lower()
    if ext in [".png", ".jpg", ".jpeg"]:
        return Image.open(file_path)
    elif ext == ".pdf":
        with open(file_path, "rb") as f:
            pdf_doc = fitz.open(stream=f.read(), filetype="pdf")
        pix = pdf_doc[0].get_pixmap()
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        return img
    else:
        raise ValueError("Unsupported file format. Please upload PNG, JPEG, or PDF files.")

def image_to_base64(image):
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    return base64.b64encode(img_byte_arr.getvalue()).decode("utf-8")

def get_gemini_inference(image):
    image_data = image_to_base64(image)
    headers = {"Content-Type": "application/json"}
    
    prompt = ("Analyze the following X-ray image and provide a concise summary (50 to 80 words). "
              "This is not a medical diagnosis.")
    
    data = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": "image/png",
                            "data": image_data
                        }
                    }
                ]
            }
        ]
    }
    response = requests.post(f"{API_URL}?key={API_KEY}", headers=headers, json=data)
    response_json = response.json()
    # Debug print (remove or comment out in production)
    # print("Full API Response:", json.dumps(response_json, indent=2))
    return response_json

def extract_useful_info(response_json):
    try:
        if "candidates" in response_json and response_json["candidates"]:
            full_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
            summary = " ".join(full_text.split()[:70])  # Limit to first 70 words
            disclaimer = "\n\nDisclaimer: This is an AI-generated summary and not a medical diagnosis. Consult a radiologist."
            return summary + disclaimer
        else:
            return "No inference found in API response."
    except (KeyError, IndexError):
        return "Error extracting inference."

def translate_to_hindi(text):
    try:
        return GoogleTranslator(source="en", target="hi").translate(text)
    except Exception as e:
        return f"Error translating text: {str(e)}"

def text_to_speech(text, lang):
    tts = gTTS(text=text, lang=lang)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
        tts.save(temp_audio.name)
        return temp_audio.name

if __name__ == "__main__":
    # Expect file path as first argument and language ("en" or "hi") as second (default "en")
    if len(sys.argv) < 2:
        print("No file path provided.", file=sys.stderr)
        sys.exit(1)
    file_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "en"

    try:
        xray_image = load_xray(file_path)
    except Exception as e:
        print("Error loading image:", str(e), file=sys.stderr)
        sys.exit(1)
    
    inference_json = get_gemini_inference(xray_image)
    if "error" in inference_json:
        print("API Error:", inference_json["error"]["message"], file=sys.stderr)
        sys.exit(1)
    useful_info = extract_useful_info(inference_json)
    
    if language == "hi":
        useful_info = translate_to_hindi(useful_info)
        audio_lang = "hi"
    else:
        audio_lang = "en"
    
    # Generate TTS audio and convert it to Base64 for transport
    audio_file = text_to_speech(useful_info, audio_lang)
    try:
        with open(audio_file, "rb") as af:
            audio_bytes = af.read()
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
    except Exception as e:
        print("Error reading audio file:", e, file=sys.stderr)
        sys.exit(1)
    finally:
        try:
            os.unlink(audio_file)
        except Exception:
            pass

    result = {
        "inference": useful_info,
        "audio": audio_base64
    }
    print(json.dumps(result))
