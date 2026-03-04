import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

# Load explicitly from .env to ensure the key is present
load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY not found in .env")
    exit(1)

genai.configure(api_key=API_KEY)
# Using gemini-2.5-pro for better spatial understanding of forms, 
# although flash might also work. Pro is generally better for OCR/Layout.
model = genai.GenerativeModel('gemini-2.5-pro')

prompt = """
You are an expert document analysis AI.
Look at this image of a blank form. I need to digitally fill this form out.
Your task is to identify every visual BLANK LINE or BLANK BOX where a user is expected to write their information.

You must reply ONLY with a valid JSON array of objects. Do not include markdown formatting like ```json.
Each object represents one field to be filled, and must contain:
1. "field_name": A short programmatic name for the field (e.g. "applicant_name", "date_of_birth").
2. "question": A friendly, conversational question asking the user for this data (e.g. "What is your full name?").
3. "box_2d": An array of four integers [ymin, xmin, ymax, xmax] representing the bounding box of the BLANK AREA where the text should be printed. These coordinates MUST be normalized to a 1000x1000 scale. For example, [200, 100, 250, 400].

Example Output:
[
  {
    "field_name": "first_name",
    "question": "What is your first name?",
    "box_2d": [150, 200, 180, 500]
  }
]
"""

def test_extraction(image_path):
    print(f"Testing extraction on: {image_path}")
    if not os.path.exists(image_path):
        print("File not found.")
        return

    try:
        sample_file = genai.upload_file(path=image_path, display_name="Sample Form")
        print(f"Uploaded file: {sample_file.uri}")

        response = model.generate_content([sample_file, prompt])
        print("\n--- RAW RESPONSE ---")
        print(response.text)
        print("--------------------\n")
        
        # Try parsing
        try:
            data = json.loads(response.text.strip().removeprefix("```json").removesuffix("```"))
            print(f"Successfully parsed {len(data)} fields!")
            for field in data:
                print(f"- {field['field_name']}: {field['box_2d']}")
        except Exception as e:
            print(f"JSON Parsing failed: {e}")

    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    print("Test script ready. Provide an image path to test.")
