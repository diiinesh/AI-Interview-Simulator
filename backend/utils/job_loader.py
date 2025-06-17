import base64
import io
import httpx
from bs4 import BeautifulSoup
from PyPDF2 import PdfReader

async def load_job_from_url(url: str) -> str:
    """Fetch and extract text from the given URL."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/114.0.0.0 Safari/537.36"
        )
    }

    async with httpx.AsyncClient(timeout=30, headers=headers) as client:
        r = await client.get(url)
        r.raise_for_status()
        html = r.text
        print("=== HTML PREVIEW ===")
        print(html[:1000])  # print only first 1000 chars
        print("====================")
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    print("=== EXTRACTED TEXT ===")
    print(text[:500])  # again, short preview
    print("======================")
    return text

async def load_job_from_pdf(base64_content: str) -> str:
    """Decode base64 PDF content and extract its text."""
    print("[DEBUG] Decoding base64 PDF content...")
    try:
        data = base64.b64decode(base64_content)
        reader = PdfReader(io.BytesIO(data))
        pages_text = []

        print(f"[DEBUG] PDF has {len(reader.pages)} pages.")
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            print(f"[DEBUG] Page {i + 1} text preview:\n{text}")
            pages_text.append(text)

        full_text = "\n".join(pages_text)
        print(f"[DEBUG] Total extracted text length: {len(full_text)} characters.")
        return full_text

    except Exception as e:
        print(f"[ERROR] Failed to decode or read PDF: {e}")
        raise

