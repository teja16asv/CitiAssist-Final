import google.generativeai as genai
import os

# --- INSTRUCTIONS ---
# 1. PASTE YOUR NEW API KEY DIRECTLY BELOW inside the quotes.
# 2. SAVE this file.
# 3. Run: python test_key_direct.py
# --------------------

TEST_API_KEY = ""

# If you prefer to stick with .env, we can try to load it, but direct pasting is safer for debugging.
if TEST_API_KEY == "":
    from dotenv import load_dotenv
    load_dotenv()
    TEST_API_KEY = os.getenv("GEMINI_API_KEY")

print(f"Testing Key: {TEST_API_KEY[:5]}...{TEST_API_KEY[-5:] if TEST_API_KEY else ''}")

# specific model to test
MODEL_NAME = "gemini-2.5-flash" 

try:
    genai.configure(api_key=TEST_API_KEY)
    
    # print("Listing available models...")
    # for m in genai.list_models():
    #     if 'generateContent' in m.supported_generation_methods:
    #         print(f"- {m.name}")

    model = genai.GenerativeModel(MODEL_NAME)
    print(f"Attempting to generate using model: {MODEL_NAME}...")
    response = model.generate_content("Hello, this is a test.")
    print("\nSUCCESS! The API key and Model are working.")
    print("Response:", response.text)
except Exception as e:
    print("\nFAILURE.")
    print("Error details:", e)
