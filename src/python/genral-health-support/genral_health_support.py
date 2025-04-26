#!/usr/bin/env python
import sys
import os
import json
import re
import tempfile
import base64
from dotenv import load_dotenv
from deep_translator import GoogleTranslator
from gtts import gTTS
import google.generativeai as genai

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    print("GEMINI_API_KEY not found.", file=sys.stderr)
    sys.exit(1)

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

def text_to_speech(text, lang):
    # Remove asterisks and URLs from text
    text = re.sub(r'\*+', '', text)
    text = re.sub(r'http\S+', '', text)
    tts = gTTS(text=text, lang=lang)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
        tts.save(temp_audio.name)
        return temp_audio.name

def main():
    # Expect at least one argument: symptoms text; optionally a second for language ("en" or "hi")
    if len(sys.argv) < 2:
        print("No symptoms provided.", file=sys.stderr)
        sys.exit(1)
    symptoms = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "en"
    
    prompt = (
        f"I have {symptoms}. Suggest common over-the-counter medicines and home remedies. "
        f"Provide working and accessible links to purchase the medicines from Indian e-pharmacy websites like 1mg or PharmEasy. "
        f"This is a workable link: https://www.1mg.com/generics/paracetamol-210459,https://www.1mg.com/generics/ibuprofen-210020, "
        f"for cold suggest montair lc:https://www.1mg.com/drugs/montair-lc-tablet-565306?wpsrc=Bing+Organic+Search. "
        f"Ensure the links are up-to-date and add a disclaimer at the end."
    )
    
    response = model.generate_content(prompt)
    recommendation = response.text
    if language.lower() == "hi":
        recommendation = GoogleTranslator(source="en", target="hi").translate(recommendation)
        tts_lang = "hi"
    else:
        tts_lang = "en"
    
    audio_file = text_to_speech(recommendation, tts_lang)
    try:
        with open(audio_file, "rb") as af:
            audio_bytes = af.read()
        audio_base64 = base64.b64encode(audio_bytes).decode("utf-8")
    except Exception as e:
        print(f"Error reading audio file: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        try:
            os.unlink(audio_file)
        except Exception:
            pass
    
    result = {
        "recommendation": recommendation,
        "audio": audio_base64
    }
    print(json.dumps(result))
    
if __name__ == "__main__":
    main()
