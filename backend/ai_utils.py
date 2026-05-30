import os
import json
from typing import Dict
import google.generativeai as genai

# Configure the Gemini SDK using the environment variable on Vercel
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

def optimize_code(code: str, language: str = "python") -> Dict:
    """
    Sends the code snippet to Gemini to analyze performance, 
    security vulnerabilities, and structural improvements.
    """
    if not api_key:
        return {"engine": "none", "error": "Gemini API key missing in environment variables."}

    # Construct a strict prompt requesting a clean JSON output matching your frontend structure
    prompt = f"""
    Analyze the following {language} code snippet. 
    Provide optimizations, identify structural issues, and note security risks.
    
    You MUST respond with a valid, raw JSON object exactly following this schema:
    {{
        "optimized": "The fully optimized and clean rewrite of the code string",
        "issues": ["List of distinct problems found"],
        "suggestions": ["List of actionable cleanup/refactoring advice"],
        "security_risks": ["List of security vulnerabilities found, or empty if none"],
        "engine": "gemini-1.5-flash"
    }}

    Code to analyze:
    {code}
    """

   try:
        # Pass the clean model string name directly
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        # Clean up code blocks if the model wraps the JSON response in ```json ... ```
        text_response = response.text.strip()
        if text_response.startswith("```json"):
            text_response = text_response.split("```json")[1].split("```")[0].strip()
        elif text_response.startswith("```"):
            text_response = text_response.split("```")[1].split("```")[0].strip()

        # Parse and return the direct dictionary structure
        data = json.loads(text_response)
        return data

    except Exception as e:
        return {
            "engine": "none",
            "error": f"Gemini API execution failed: {str(e)}"
        }
