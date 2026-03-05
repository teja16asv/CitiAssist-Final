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
6. Tourism, Landmarks, and City Culture (Professional city information)

Rules:
- If a user asks about anything OUTSIDE these 6 categories (e.g. general programming, math, pop culture, recipes, or general chit-chat), explicitly state "Data not available. My scope is strictly restricted to Civic and City Services for Hyderabad."
- DETECT the language of the user's query and RESPOND IN THE SAME LANGUAGE.
- **FORMATTING**: Use Markdown. **Bold** names/headers. Lists for readability.

### TRANSIT & ROUTING RULES (A to B Queries)
If the user asks how to get from one place to another (e.g. "How to go from X to Y" or "Route to Z"):
1. Provide a **Cost-Optimized, Multi-Modal Route**: Suggest the best mix of TSRTC Buses, Hyderabad Metro, and MMTS.
2. Structure the response strictly as:
   - **Overview**: Total Estimated Time and best modes of transport.
   - **Step-by-Step Breakdown**: Clear numbered steps (e.g., "1. Take bus 218 from X to Y. 2. Board the Red Line Metro at Y.").
   - **Estimated Cost**: State the total estimated price in INR.
3. EXCEPTION: Do **NOT** provide external links to TSRTC or Metro websites for routing queries. Give the user all the information directly in the chat text so they don't have to leave the app.

### STANDARD LINKING RULE (For Non-Routing Queries)
- If discussing general hospitals, police stations, or government portals, you MUST provide a clickable link.
- **Locations**: `[Apollo Hospital](https://www.google.com/maps/search/?api=1&query=Apollo+Hospital)`
- **Services**: `[Meeseva Portal](https://ts.meeseva.gov.in/)`

### LOCATION/GPS HANDLING
- If the user provides "Current Location: [Lat], [Long]", USE these coordinates to identify the area (e.g., Gachibowli, Jubilee Hills).
- Provide results *specifically* near that determined location. Do NOT ask for their location again.

Keep answers concise, helpful, and polite.
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

        print(f"DEBUG: Received message: {user_message}")

        # Debug: Print received message
        print(f"DEBUG: Received message: {user_message}")

        # Smart Location Handling: Extract coordinates and force context
        import re
        # matches "(Current Location: 17.44, 78.34)" OR "near 17.44, 78.34"
        coord_match = re.search(r'(?:Current Location:|near)\s*([\d.-]+),\s*([\d.-]+)', user_message, re.IGNORECASE)
        
        final_prompt = user_message
        if coord_match:
            lat, long = coord_match.groups()
            print(f"DEBUG: Detected Coordinates - Lat: {lat}, Long: {long}")
            
            # Create a strong context prefix
            location_context = (
                f"SYSTEM QUERY CONTEXT: The user is currently located at Latitude {lat}, Longitude {long}. "
                f"You MUST provide results specifically near these coordinates. "
                f"Do not ask for location again. Assume this is the user's precise location.\n\n"
            )
            final_prompt = location_context + user_message

        # Generate content
        response = model.generate_content(final_prompt)
        
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
        
        RETURN A JSON OBJECT ONLY. NO MARKDOWN FORMATTING.
        The JSON key 'response' should be in Markdown format for display.
        
        Result Format:
        {
            "recipient_email": "Official email of the relevant authority in Hyderabad (e.g., commissioner@ghmc.gov.in for GHMC, or Cyberabad Traffic Police email, etc.)",
            "subject": "Formal subject line for the complaint - citing [Location]",
            "body": "Formal complaint letter body. YOU MUST INCLUDE the exact text '[Location]' so the user can fill it in. Example: 'I observed a pothole at [Location]...'",
            "response": "A polite summary to the user explaining the issue and that a draft is ready (Markdown supported)"
        }
        
        If no civic issue is detected:
        {
            "recipient_email": "",
            "subject": "",
            "body": "",
            "response": "No civic issue detected in this image."
        }
        """

        response = model.generate_content([prompt, image], generation_config={"response_mime_type": "application/json"})
        
        import json
        try:
            # Clean up potential markdown code blocks if the model ignores the instruction (though mime_type helps)
            text_response = response.text.replace('```json', '').replace('```', '').strip()
            response_json = json.loads(text_response)
        except json.JSONDecodeError:
            print("Failed to decode JSON from model")
            response_json = {
                "recipient_email": "",
                "subject": "Civic Issue Report", 
                "body": response.text,
                "response": response.text
            }

        return jsonify(response_json)

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

# Global dictionary to temporarily hold form images in memory for the wizard session
# In production, this should be Redis or an S3 bucket
form_sessions = {}
import uuid

@app.route('/api/start-form-fill', methods=['POST'])
def start_form_fill():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
            
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        image_bytes = file.read()
        from PIL import Image
        import io
        image = Image.open(io.BytesIO(image_bytes))
        
        # Save session
        session_id = str(uuid.uuid4())
        form_sessions[session_id] = image
        
        prompt = """
        You are an expert document analysis AI working for the government of Telangana, dedicated to accessibility.
        Look at this image of a blank document or form. 
        Identify every visual BLANK LINE or BLANK BOX where a citizen is expected to write their information.
        
        CRITICAL ACCESSIBILITY INSTRUCTION:
        Forms often use complex bureaucratic or legal terms (e.g., "Domicile", "Remittance", "Kin", "Spouse", "NOC"). 
        You MUST simplify these tough fields so common, everyday people can easily understand them. Translate complex legalese into plain language.
        
        RETURN ONLY A VERY STRICT JSON ARRAY OF OBJECTS. Do not include markdown formatting or backticks.
        Each object must contain EXACTLY:
        1. "field_name": A short programmatic name (e.g. "applicant_name").
        2. "question": A friendly, conversational question asking the citizen for this data in VERY SIMPLE terms (e.g. Instead of "What is your domicile?", ask "What city or town do you permanently live in?").
        3. "box_2d": An array of four integers [ymin, xmin, ymax, xmax] representing the bounding box of the BLANK AREA. 
           These coordinates MUST be normalized to a 1000x1000 scale. For example, [200, 100, 250, 400].
           
        Example Output:
        [
          {"field_name": "first_name", "question": "What is your first name?", "box_2d": [150, 200, 180, 500]}
        ]
        """
        
        # Using flash as it proved sufficient and faster in testing
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content([image, prompt])
        
        import json
        clean_json = response.text.strip().removeprefix("```json").removesuffix("```").strip()
        fields_data = json.loads(clean_json)
        
        return jsonify({
            'session_id': session_id,
            'fields': fields_data
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/fill-form', methods=['POST'])
def fill_form():
    try:
        data = request.json
        session_id = data.get('session_id')
        answers = data.get('answers', {}) # Dict of {field_name: {"answer": "value", "box_2d": [...]}}
        
        if session_id not in form_sessions:
            return jsonify({'error': 'Session expired or invalid'}), 400
            
        image = form_sessions[session_id].copy()
        
        from PIL import ImageDraw, ImageFont
        import base64
        import io
        draw = ImageDraw.Draw(image)
        
        width, height = image.size
        
        # Try to load a standard font
        try:
            # You might need to adjust the font size depending on the image resolution
            font = ImageFont.truetype("arial.ttf", 24)
        except IOError:
            font = ImageFont.load_default()

        # Iterate over the answers and draw them
        for field_name, field_data in answers.items():
            text_value = str(field_data.get('answer', ''))
            box_normalized = field_data.get('box_2d', [0, 0, 0, 0])
            if len(box_normalized) == 4 and text_value:
                ymin, xmin, ymax, xmax = box_normalized
                
                # Convert from 1000x1000 normalized scale back to actual image pixels
                actual_x = int((xmin / 1000.0) * width)
                
                # We want to place the text slightly above the bottom line (ymax)
                # or aligned exactly with ymin. Let's align it with ymin + a tiny buffer
                actual_y = int((ymin / 1000.0) * height)
                
                # Draw the text in black
                draw.text((actual_x + 5, actual_y + 2), text_value, fill=(0, 0, 150), font=font) # Dark blue ink
                
        # Convert the modified PIL image to a base64 string
        buffered = io.BytesIO()
        # Ensure image is in a saveable mode
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        image.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            'filled_image_base64': f"data:image/jpeg;base64,{img_str}"
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Render provides PORT env var. Default to 5000 for local dev.
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
