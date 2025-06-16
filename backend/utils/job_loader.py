import base64
import io
import httpx
from bs4 import BeautifulSoup
from PyPDF2 import PdfReader

async def load_job_from_url(url: str) -> str:
    """Fetch and extract text from the given URL."""
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(url)
        r.raise_for_status()
        html = r.text
    soup = BeautifulSoup(html, "html.parser")
    text = soup.get_text(separator=" ", strip=True)
    return text

async def load_job_from_pdf(base64_content: str) -> str:
    """Decode base64 PDF content and extract its text."""
    data = base64.b64decode(base64_content)
    reader = PdfReader(io.BytesIO(data))
    pages_text = []
    for page in reader.pages:
        pages_text.append(page.extract_text() or "")
    return "\n".join(pages_text)

