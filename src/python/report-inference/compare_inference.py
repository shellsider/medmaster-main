#!/usr/bin/env python
import sys
import json
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    print("API_KEY not found. Please set it in the .env file.", file=sys.stderr)
    sys.exit(1)
genai.configure(api_key=API_KEY)

def compare_inferences(new_inference, previous_inference):
    # Construct a prompt that guides Gemini to compare the two inferences.
    prompt = f"""
Please compare the following two medical inferences derived from CBC reports.

New Inference:
{new_inference}

Previous Inference:
{previous_inference}

Based on these inferences, determine if the person's health has improved, degraded, or remained stable.
Identify key differences in data trends and out-of-range values, and provide a concise summary analysis with possible explanations.
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating comparison: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Error: Two inference arguments are required.", file=sys.stderr)
        sys.exit(1)
    try:
        # The arguments are expected to be JSON strings. Parse them to get the raw text.
        new_inference = json.loads(sys.argv[1])
        previous_inference = json.loads(sys.argv[2])
    except Exception as e:
        print(f"Error parsing input arguments: {e}", file=sys.stderr)
        sys.exit(1)

    result = compare_inferences(new_inference, previous_inference)
    print(result)
