import re
from typing import List, Dict, Any

class ChunkingService:
    """
    Splits text into semantic, overlapping chunks with metadata (token count, page estimate).
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str, page_number: int = 1) -> List[Dict[str, Any]]:
        clean_text = text.strip()
        if not clean_text:
            return []

        # Split on paragraph boundaries first, then sentences if necessary
        paragraphs = re.split(r'\n\s*\n', clean_text)
        chunks: List[Dict[str, Any]] = []
        current_chunk = ""
        chunk_idx = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            if len(current_chunk) + len(para) <= self.chunk_size:
                current_chunk += ("\n\n" if current_chunk else "") + para
            else:
                if current_chunk:
                    token_count = max(1, len(current_chunk.split()))
                    chunks.append({
                        "chunk_index": chunk_idx,
                        "content": current_chunk,
                        "page_number": page_number,
                        "token_count": token_count
                    })
                    chunk_idx += 1

                    # Retain overlap from end of current chunk
                    words = current_chunk.split()
                    overlap_words = words[-max(1, self.chunk_overlap // 5):]
                    current_chunk = " ".join(overlap_words) + "\n\n" + para
                else:
                    # Single oversized paragraph - split by sentences
                    sentences = re.split(r'(?<=[.!?])\s+', para)
                    for sent in sentences:
                        if len(current_chunk) + len(sent) <= self.chunk_size:
                            current_chunk += (" " if current_chunk else "") + sent
                        else:
                            if current_chunk:
                                token_count = max(1, len(current_chunk.split()))
                                chunks.append({
                                    "chunk_index": chunk_idx,
                                    "content": current_chunk,
                                    "page_number": page_number,
                                    "token_count": token_count
                                })
                                chunk_idx += 1
                            current_chunk = sent

        if current_chunk.strip():
            token_count = max(1, len(current_chunk.split()))
            chunks.append({
                "chunk_index": chunk_idx,
                "content": current_chunk,
                "page_number": page_number,
                "token_count": token_count
            })

        return chunks
