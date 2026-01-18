import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GENAI_API_KEY:
    print("Warning: GEMINI_API_KEY not found in environment variables.")
else:
    print(f"Draft loaded API Key starting with: {GENAI_API_KEY[:5]}...  (Length: {len(GENAI_API_KEY)})")


genai.configure(api_key=GENAI_API_KEY)

# System Instruction
SYSTEM_INSTRUCTION = """
You are CitiAssist, a helpful Smart City guide for the city of Hyderabad only.
Your scope is STRICTLY restricted to the following topics:
1. Hospitals & Healthcare
2. Public Transport (Metro, Buses, Trains)
3. Police & Safety
4. Utilities (Electricity, Water, Waste Management, Municipal Services)
5. Government Services & Documentation (Aadhar, PAN, Voter ID, Driving License, Passport, etc.)

Rules:
- If a user asks about anything OUTSIDE these 5 categories, explicitly state "Data not available" and that it is out of scope.
- DETECT the language of the user's query and RESPOND IN THE SAME LANGUAGE.
- **FORMATTING**: Use Markdown. **Bold** names/headers. Lists for readability.
- **MANDATORY LINKING RULE**: 
  - You MUST providing a clickable link for every single location or service mentioned.
  - **Locations**: Use this Google Maps format: `[Location Name](https://www.google.com/maps/search/?api=1&query=Location+Name)`
  - **Services**: Use the official URL: `[Service Name](https://official-portal-url.com)`
  - **EXAMPLES**:
     - WRONG: **Apollo Hospital** is located in Jubilee Hills.
     - CORRECT: [Apollo Hospital](https://www.google.com/maps/search/?api=1&query=Apollo+Hospital) is located in Jubilee Hills.
     - WRONG: Apply on Meeseva portal.
     - CORRECT: Apply on [Meeseva Portal](https://ts.meeseva.gov.in/).
- Do NOT output raw asterisks for locations without making them links.
- Keep answers concise, helpful, and polite.
"""

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    system_instruction=SYSTEM_INSTRUCTION
)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({'error': 'Message is required'}), 400

        # Generate content
        response = model.generate_content(user_message)
        
        # Check if response has content (might be blocked by safety settings)
        if response.parts:
            reply_text = response.text
        else:
            # Handle safety block or empty response
            print("Response blocked or empty:", response.prompt_feedback)
            reply_text = "I apologize, but I cannot answer that query due to safety or policy restrictions. Please try rephrasing."

        return jsonify({
            'response': reply_text
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"FULL ERROR: {e}")
        return jsonify({'error': 'An error occurred', 'details': str(e)}), 500

@app.route('/api/report-issue', methods=['POST'])
def report_issue():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Read image
        from PIL import Image
        import io
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))

        prompt = """
        Analyze this image for civic issues (e.g., potholes, garbage, broken streetlights, traffic violations, parking issues). 
        1. Identify the specific issue.
        2. Draft a polite but formal complaint letter to the Municipal Commissioner describing the issue. 
        3. Include placeholders for [Location] and [Date] if they cannot be inferred.
        4. Output the response in Markdown format.
        If no civic issue is detected, simply state that no issue was found.
        """

        response = model.generate_content([prompt, image])
        
        reply_text = response.text if response.parts else "Could not generate report due to safety settings."

        return jsonify({'response': reply_text})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Image processing failed', 'details': str(e)}), 500

@app.route('/api/analyze-document', methods=['POST'])
def analyze_document():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Read image
        from PIL import Image
        import io
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes))

        prompt = """
        Analyze this government form or official document. 
        1. Identify exactly what this document is.
        2. Provide a comprehensive, step-by-step guide on how to fill it out.
        3. Explain any complex legal terms or requirements in simple, easy-to-understand language.
        4. If it contains instructions, summarize them clearly.
        5. Output the response in Markdown format.
        6. If this does not look like a form or official document, please state that.
        """

        response = model.generate_content([prompt, image])
        
        reply_text = response.text if response.parts else "Could not analyze document due to safety settings."

        return jsonify({'response': reply_text})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Document analysis failed', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
