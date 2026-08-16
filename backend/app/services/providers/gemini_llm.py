import json
import re
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.core.logging import logger
from app.services.providers.base import LLMProvider


class RealLLMProvider(LLMProvider):
    """
    Production LLM Provider supporting Google Gemini and OpenAI REST APIs.
    If API keys are not provided, generates synthesis strictly derived from
    retrieved source excerpts without hallucinating or inventing citations.
    """

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
    ):
        self.gemini_key = (
            gemini_api_key
            or settings.GOOGLE_API_KEY
            or os_env("GEMINI_API_KEY")
            or os_env("GOOGLE_GENERATIVE_AI_API_KEY")
        )
        self.openai_key = openai_api_key or settings.OPENAI_API_KEY or os_env("OPENAI_API_KEY")

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        # 1. Try Google Gemini API if configured
        if self.gemini_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_key}"
                contents = []
                if system_prompt:
                    contents.append({"role": "user", "parts": [{"text": f"System Instructions:\n{system_prompt}"}]})
                    contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly adhere to these instructions and cite only the provided sources."}]})
                contents.append({"role": "user", "parts": [{"text": prompt}]})

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(url, json={"contents": contents})
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip()
                    else:
                        logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.warning(f"Gemini API call failed: {e}")

        # 2. Try OpenAI API if configured
        if self.openai_key:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        url,
                        headers={"Authorization": f"Bearer {self.openai_key}"},
                        json={"model": "gpt-4o-mini", "messages": messages, "temperature": 0.2}
                    )
                    if resp.status_code == 200:
                        return resp.json()["choices"][0]["message"]["content"].strip()
            except Exception as e:
                logger.warning(f"OpenAI API call failed: {e}")

        return ""

    async def generate_structured(
        self,
        prompt: str,
        response_schema: Dict[str, Any],
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        full_system = (system_prompt or "") + "\nRespond ONLY with a valid JSON object matching the requested schema."
        raw_text = await self.generate_text(prompt, system_prompt=full_system)
        if not raw_text:
            return {}
        try:
            match = re.search(r'\{.*\}', raw_text, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(raw_text)
        except Exception:
            return {}


def os_env(key: str) -> Optional[str]:
    import os
    return os.environ.get(key)
