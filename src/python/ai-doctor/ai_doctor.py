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
API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent"

# Define the system prompt
system_prompt = """You have to act as a professional doctor, i know you are not but this is for learning purpose. 
What's in this image? Do you find anything wrong with it medically? 
If you make a differential, suggest some remedies for them. Do not add any numbers or special characters in 
your response. Your response should be in one long paragraph. Also always answer as if you are answering to a real person.
Do not say 'In the image I see' but say 'With what I see, I think you have ....'
Don't respond as an AI model in markdown, your answer should mimic that of an actual doctor not an AI bot, 
also provide home remedies for it, give three points exactly and dont excede them
Keep your answer concise (max 2 sentences). No preamble, start your answer right away please"""

def load_xray(file_path):
    """Load an image from file_path. If PDF, extract the first page."""
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
    """Convert a PIL image to a base64-encoded PNG string."""
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    return base64.b64encode(img_byte_arr.getvalue()).decode("utf-8")

def get_gemini_inference(image):
    """Call Gemini API with the system prompt and the image (in Base64)."""
    image_data = image_to_base64(image)
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": system_prompt},
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
    try:
        response = requests.post(f"{API_URL}?key={API_KEY}", headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error during API request: {e}", file=sys.stderr)
        return {"error": str(e)}

def extract_useful_info(response_json):
    """Extract a concise inference and append a disclaimer."""
    try:
        if "candidates" in response_json and response_json["candidates"]:
            full_text = response_json["candidates"][0]["content"]["parts"][0]["text"]
            summary = " ".join(full_text.split()[:70])  # Limit to first 70 words
            disclaimer = "\n\nDisclaimer: This is an AI-generated summary and not a medical diagnosis. Consult a radiologist."
            return summary + disclaimer
        else:
            return "No inference found in API response."
    except (KeyError, IndexError) as e:
        return f"Error extracting inference: {e}"

def translate_to_hindi(text):
    """Translate English text to Hindi."""
    try:
        return GoogleTranslator(source="en", target="hi").translate(text)
    except Exception as e:
        return f"Error translating text: {str(e)}"

def text_to_speech(text, lang):
    """Generate TTS audio from text using gTTS and return the path of the saved mp3 file."""
    tts = gTTS(text=text, lang=lang)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
        tts.save(temp_audio.name)
        return temp_audio.name

if __name__ == "__main__":
    # Expect at least two arguments: file path and language code ("en" or "hi")
    if len(sys.argv) < 2:
        print("No file path provided.", file=sys.stderr)
        sys.exit(1)
    file_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "en"
    
    try:
        xray_image = load_xray(file_path)
    except Exception as e:
        print(f"Error loading image: {e}", file=sys.stderr)
        sys.exit(1)
    
    inference_json = get_gemini_inference(xray_image)
    if "error" in inference_json:
        print(f"API Error: {inference_json['error']}", file=sys.stderr)
        sys.exit(1)
    useful_info = extract_useful_info(inference_json)
    if language == "hi":
        useful_info = translate_to_hindi(useful_info)
        audio_lang = "hi"
    else:
        audio_lang = "en"
    # Generate TTS audio file and then read its content as Base64
    audio_file = text_to_speech(useful_info, audio_lang)
    try:
        with open(audio_file, "rb") as af:
            audio_bytes = af.read()
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
    except Exception as e:
        print(f"Error reading audio file: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        # Clean up the temporary audio file
        try:
            os.unlink(audio_file)
        except Exception:
            pass

    # Prepare a JSON result with inference text and audio content
    result = {
        "inference": useful_info,
        "audio": audio_base64
    }
    print(json.dumps(result))
