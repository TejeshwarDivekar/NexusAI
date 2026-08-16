from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class SearchProvider(ABC):
    @abstractmethod
    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Perform search and return standardized list of source dictionaries."""
        pass

class LLMProvider(ABC):
    @abstractmethod
    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate unstructured text from a prompt."""
        pass

    @abstractmethod
    async def generate_structured(self, prompt: str, response_schema: Dict[str, Any], system_prompt: Optional[str] = None) -> Dict[str, Any]:
        """Generate structured JSON conforming to the given schema."""
        pass

class EmbeddingProvider(ABC):
    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        """Generate a dense embedding vector for a single text."""
        pass

    @abstractmethod
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate dense embedding vectors for a batch of texts."""
        pass
