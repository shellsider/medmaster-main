# #!/usr/bin/env python
# import sys
# sys.stdout.reconfigure(encoding='utf-8')
# import os
# from pdf2image import convert_from_path
# from pytesseract import image_to_string
# import google.generativeai as genai
# from dotenv import load_dotenv
# from deep_translator import GoogleTranslator

# # Load environment variables
# load_dotenv()
# API_KEY = os.getenv("API_KEY")
# if not API_KEY:
#     print("API_KEY not found. Please set it in the .env file.", file=sys.stderr)
#     sys.exit(1)
# genai.configure(api_key=API_KEY)

# def extract_text_from_pdf(pdf_path):
#     try:
#         images = convert_from_path(pdf_path)
#         extracted_text = ""
#         for i, image in enumerate(images):
#             extracted_text += f"\n--- Page {i + 1} ---\n"
#             extracted_text += image_to_string(image)
#         return extracted_text
#     except Exception as e:
#         return f"Error extracting text from PDF: {e}"

# def generate_inference(prompt):
#     try:
#         model = genai.GenerativeModel("gemini-1.5-flash")
#         response = model.generate_content(prompt)
#         return response.text
#     except Exception as e:
#         return f"Error generating inference: {e}"

# def translate_to_hindi(text):
#     try:
#         return GoogleTranslator(source="en", target="hi").translate(text)
#     except Exception as e:
#         return f"Error translating text: {e}"

# if __name__ == "__main__":
#     if len(sys.argv) < 2:
#         print("No PDF file path provided", file=sys.stderr)
#         sys.exit(1)
#     pdf_path = sys.argv[1]
#     language = sys.argv[2] if len(sys.argv) > 2 else "en"

#     extracted_text = extract_text_from_pdf(pdf_path)
    
#     prompt = extracted_text + """
    
# Provide inferences and plausible remedies based on the data.
# - List the type of test.
# - Do not include the doctor's name; just provide concise, data point-wise information.
# - Indicate if the person is healthy, moderately healthy, or unhealthy.
# - Summarize key values in a tabular format and mark those out of the normal range.
# - Include three segments: 'Inferences', 'Plausible Remedies', and 'Disclaimer'.
# """
#     result = generate_inference(prompt)
#     if language.lower() == "hi":
#         result = translate_to_hindi(result)
#     print(result)




#!/usr/bin/env python
import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
from pdf2image import convert_from_path
from pytesseract import image_to_string
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")
if not API_KEY:
    print("API_KEY not found. Please set it in the .env file.", file=sys.stderr)
    sys.exit(1)
genai.configure(api_key=API_KEY)

def extract_text_from_pdf(pdf_path):
    try:
        images = convert_from_path(pdf_path)
        extracted_text = ""
        for i, image in enumerate(images):
            extracted_text += f"\n--- Page {i + 1} ---\n"
            extracted_text += image_to_string(image)
        return extracted_text
    except Exception as e:
        return f"Error extracting text from PDF: {e}"

def generate_inference(prompt):
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating inference: {e}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("No PDF file path provided", file=sys.stderr)
        sys.exit(1)
    pdf_path = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "en"

    extracted_text = extract_text_from_pdf(pdf_path)
    
    # Prepare prompt based on selected language
    if language == "en":
        prompt = extracted_text + """
        
Please provide inferences based on the data:
- Include the type of test
- Do not include the doctor's name; just concise information.
- Is the person healthy, moderately healthy, or unhealthy?
- Provide plausible remedies.
- Keep the inefrences inaccordance to age, remember that what values may be optimal for the youngsters, may not be for the older generation, so keep the ineferences in accordance to them
- Keep it concise, data point-wise, and summarized.
- Include values in a tabular format if exist.
- Indicate whether each value is in the normal range in the tabular display in the same table as the values.
- **Bold** the parameters that are not normal and not those that are normal.
- Add a disclaimer at the end.
- DO and i mean DO include the three sub headings that are 'Inferences', 'Plausible Remedies' and 'Disclaimer'.. They are very important so do include them
- Do not include table under Inference, make it a separate sub-heading
- The generated Text must include 5 segments in the following order with the 5 headings,'Name of Test' 'Table', 'Inferences', 'Plausible Remedies', 'Disclaimer'
"""
    else:
        prompt = extracted_text + """
कृपया डेटा के आधार पर निष्कर्ष प्रदान करें:

-परीक्षण के प्रकार को शामिल करें
-डॉक्टर का नाम शामिल न करें; केवल संक्षिप्त जानकारी दें।
- क्या व्यक्ति स्वस्थ, मध्यम रूप से स्वस्थ, या अस्वस्थ है?
- संभव उपचार प्रदान करें।
- इसे संक्षिप्त, डेटा बिंदु-वार, और सारांशित रखें।
- यदि मान मौजूद हैं तो उन्हें तालिका प्रारूप में शामिल करें।
- तालिका में ही प्रत्येक मान के सामान्य सीमा में होने का संकेत दें।
- उम्र के अनुसार अनुमान रखें, याद रखें कि जो मूल्य युवाओं के लिए इष्टतम हो सकते हैं, वे पुरानी पीढ़ी के लिए नहीं हो सकते हैं, इसलिए अनुमान उनके अनुसार रखें
- **उन मानकों को बोल्ड करें जो सामान्य नहीं हैं और जो सामान्य हैं उन्हें नहीं।**
-अंत में एक अस्वीकरण जोड़ें।
-हां, और मेरा मतलब है हां, तीन उपशीर्षक 'निष्कर्ष', 'संभावित उपचार' और 'अस्वीकरण' शामिल करें। ये बहुत महत्वपूर्ण हैं 
- तालिका को अनुमान के अंतर्गत शामिल न करें, इसे एक अलग उप-शीर्षक बनाएं
- उत्पन्न पाठ में 5 शीर्षकों के साथ निम्नलिखित क्रम में 5 खंड शामिल होने चाहिए, 'परीक्षण का नाम' 'तालिका', 'निष्कर्ष', 'संभावित उपचार', 'अस्वीकरण'
"""

    result = generate_inference(prompt)
    print(result)