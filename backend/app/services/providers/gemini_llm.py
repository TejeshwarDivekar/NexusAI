import os
import json
import re
import asyncio
from typing import List, Dict, Any, Optional
import httpx

from app.config import settings
from app.core.logging import logger
from app.services.providers.base import LLMProvider


class RealLLMProvider(LLMProvider):
    """
    Production LLM Provider supporting Google Gemini and OpenAI REST APIs.
    Uses shared HTTP client for connection pooling.
    Includes retry logic, multiple model fallbacks, and proper timeout handling.
    """

    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        openai_api_key: Optional[str] = None,
    ):
        self.gemini_key = (
            gemini_api_key
            or settings.GOOGLE_API_KEY
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
        )
        self.openai_key = openai_api_key or settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        self._client: Optional[httpx.AsyncClient] = None
        self.gemini_models = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-2.5-pro"]

    def _get_client(self) -> httpx.AsyncClient:
        """Returns a reusable async HTTP client with proper timeouts."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(45.0, connect=10.0),
                follow_redirects=True,
            )
        return self._client

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None, max_retries: int = 2) -> str:
        # 1. Try Google Gemini API if configured
        if self.gemini_key:
            for model_name in self.gemini_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}"
                contents = []
                if system_prompt:
                    contents.append({"role": "user", "parts": [{"text": f"System Instructions:\n{system_prompt}"}]})
                    contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly adhere to these instructions and cite only the provided sources."}]})
                contents.append({"role": "user", "parts": [{"text": prompt}]})

                for attempt in range(max_retries + 1):
                    try:
                        client = self._get_client()
                        resp = await client.post(url, json={"contents": contents})
                        
                        if resp.status_code == 200:
                            data = resp.json()
                            candidates = data.get("candidates", [])
                            if candidates and "content" in candidates[0]:
                                parts = candidates[0]["content"].get("parts", [])
                                if parts and "text" in parts[0]:
                                    return parts[0]["text"].strip()
                        elif resp.status_code == 404:
                            logger.info(f"Gemini model {model_name} not available (404), trying fallback...")
                            break  # Try next model
                        elif resp.status_code == 429:
                            wait_time = min(2 ** attempt * 2, 10)
                            logger.warning(f"Gemini API ({model_name}) rate limited. Retrying in {wait_time}s...")
                            await asyncio.sleep(wait_time)
                            continue
                        elif resp.status_code >= 500:
                            logger.warning(f"Gemini API ({model_name}) server error {resp.status_code}. Retrying...")
                            await asyncio.sleep(1)
                            continue
                        else:
                            logger.warning(f"Gemini API ({model_name}) status {resp.status_code}: {resp.text[:200]}")
                            break
                    except httpx.TimeoutException:
                        logger.warning(f"Gemini API timeout for model {model_name}")
                        if attempt < max_retries:
                            await asyncio.sleep(1)
                            continue
                    except Exception as e:
                        logger.warning(f"Gemini API call error: {e}")
                        break

        # 2. Try OpenAI API if configured
        if self.openai_key:
            try:
                url = "https://api.openai.com/v1/chat/completions"
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                client = self._get_client()
                resp = await client.post(
                    url,
                    headers={"Authorization": f"Bearer {self.openai_key}"},
                    json={"model": "gpt-4o-mini", "messages": messages, "temperature": 0.2}
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"].strip()
                else:
                    logger.warning(f"OpenAI API returned status {resp.status_code}")
            except Exception as e:
                logger.warning("No LLM API keys configured or all providers failed")
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


GeminiLLMProvider = RealLLMProvider

