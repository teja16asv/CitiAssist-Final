import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import time

# Load environment variables
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    print("Error: GEMINI_API_KEY not found in .env file")
    exit(1)

genai.configure(api_key=API_KEY)

# 1. THE GOLDEN DATASET
# A set of (Input, Ideal Output) pairs that defines "correct" behavior.
GOLDEN_DATASET = [
    {
        "question": "What is the emergency number for police in Hyderabad?",
        "ideal_answer": "The emergency number for police in Hyderabad is 100."
    },
    {
        "question": "Can I report a pothole using this app?",
        "ideal_answer": "Yes, you can report a pothole using the Snap & Solve feature by uploading a photo."
    },
    {
        "question": "Who won the cricket world cup in 2011?",
        "ideal_answer": "Data not available. My scope is restricted to civic services in Hyderabad."
    }
]

from main import SYSTEM_INSTRUCTION

# 2. THE SYSTEM UNDER TEST (Your App's Logic)
def get_citiassist_response(user_query):
    """
    Simulates calling your main application logic.
    In a real test, you might hit your running local API: requests.post('http://localhost:5000/api/chat', ...)
    """
    # Using the REAL production system instruction for accurate testing
    model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=SYSTEM_INSTRUCTION)
    response = model.generate_content(user_query)
    return response.text

# 3. THE EVALUATOR (LLM-as-a-Judge)
def evaluate_response(question, ideal, actual):
    """
    Asks an LLM to judge if the 'actual' answer conveys the same meaning as the 'ideal' answer.
    Returns: Score (0.0 to 1.0) and Reasoning.
    """
    judge_model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    You are an AI evaluator. Compare the ACTUAL ANSWER with the IDEAL ANSWER for the given QUESTION.
    
    QUESTION: {question}
    IDEAL ANSWER: {ideal}
    ACTUAL ANSWER: {actual}
    
    Task:
    1. Determine if the ACTUAL ANSWER is semantically correct based on the IDEAL ANSWER.
    2. Ignore minor wording differences. Focus on the key facts.
    3. If the IDEAL ANSWER says "Data not available" (out of scope), the ACTUAL ANSWER must also refuse to answer.
    
    Output JSON ONLY:
    {{
        "score": (1.0 for precise match, 0.5 for partial, 0.0 for wrong),
        "reasoning": "Brief explanation"
    }}
    """
    
    try:
        result = judge_model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(result.text)
    except Exception as e:
        return {"score": 0.0, "reasoning": f"Evaluation failed: {str(e)}"}

# 4. RUN THE METRIC CALCULATION
def calculate_accuracy():
    print(f"Running Accuracy Test on {len(GOLDEN_DATASET)} items...\n")
    
    total_score = 0
    results = []

    for item in GOLDEN_DATASET:
        print(f"Testing: '{item['question']}'")
        
        # Get actual response
        start_time = time.time()
        actual_response = get_citiassist_response(item['question'])
        latency = time.time() - start_time
        
        # Evaluate
        eval_result = evaluate_response(item['question'], item['ideal_answer'], actual_response)
        
        score = eval_result['score']
        total_score += score
        
        print(f"  -> Actual: {actual_response.strip()[:50]}...")
        print(f"  -> Score: {score} ({eval_result['reasoning']})")
        print(f"  -> Latency: {latency:.2f}s\n")
        
        results.append({
            "q": item['question'],
            "score": score,
            "latency": latency
        })

    # Final Metric
    avg_accuracy = (total_score / len(GOLDEN_DATASET)) * 100
    avg_latency = sum(r['latency'] for r in results) / len(results)
    
    print("-" * 30)
    print(f"FINAL METRICS:")
    print(f"Average Accuracy: {avg_accuracy:.1f}%")
    print(f"Average Latency:  {avg_latency:.2f}s")
    print("-" * 30)

if __name__ == "__main__":
    calculate_accuracy()
