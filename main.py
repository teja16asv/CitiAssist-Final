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
You are CitiAssist, a helpful Smart City guide. 
Your scope is STRICTLY restricted to the following topics:
1. Hospitals & Healthcare
2. Public Transport (Metro, Buses, Trains)
3. Police & Safety
4. Utilities (Electricity, Water, Waste Management, Municipal Services)

Rules:
- If a user asks about anything OUTSIDE these 4 categories, explicitly state "Data not available" and that it is out of scope.
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
