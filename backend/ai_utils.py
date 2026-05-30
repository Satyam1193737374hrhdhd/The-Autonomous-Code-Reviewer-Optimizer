"""Utility functions for AI‑powered code optimization.

Supports both OpenAI and Anthropic (Claude) APIs. The caller can simply
await ``optimize_code`` and receive the optimized source string.
"""
import os
from typing import Dict

# Optional imports – defer until needed so the package works even if one SDK is missing
_openai_client = None
_anthropic_client = None

def _load_openai():
    global _openai_client
    if _openai_client is None:
        try:
            import openai
            _openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        except Exception as e:
            raise RuntimeError("OpenAI SDK not available or API key missing") from e
    return _openai_client

def _load_anthropic():
    global _anthropic_client
    if _anthropic_client is None:
        try:
            import anthropic
            _anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        except Exception as e:
            raise RuntimeError("Anthropic SDK not available or API key missing") from e
    return _anthropic_client

def optimize_code(code: str, language: str = "python") -> Dict:
    """Ask the available LLM to rewrite *code*.

    Returns a dict with ``engine`` (``"openai"`` or ``"anthropic"``) and
    ``optimized`` containing the new source.
    """
    # Prefer Claude if its key is set, otherwise fall back to OpenAI
    if os.getenv("ANTHROPIC_API_KEY"):
        client = _load_anthropic()
        # Anthropic's ``messages`` endpoint works like ChatGPT but with a different payload
        response = client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=2000,
            temperature=0.0,
            system="You are a code‑optimization expert. Return only the revised code, no explanations.",
            messages=[
                {"role": "user", "content": f"Optimize this {language} code and keep the same functionality:\n```{language}\n{code}\n```"}
            ]
        )
        optimized = response.content[0].text if response.content else ""
        return {"engine": "anthropic", "optimized": optimized.strip()}

    # Fallback to OpenAI
    client = _load_openai()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.0,
        messages=[
            {"role": "system", "content": "You are a code‑optimization assistant. Return only the revised code, no extra commentary."},
            {"role": "user", "content": f"Optimize the following {language} code while preserving behavior:\n```{language}\n{code}\n```"}
        ]
    )
    optimized = response.choices[0].message.content
    return {"engine": "openai", "optimized": optimized.strip()}
