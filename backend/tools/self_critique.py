from langchain.tools import BaseTool
from backend.services.llm_groq import llm

class SelfCritiqueTool(BaseTool):
    name: str = "SelfCritiqueTool"
    description: str = (
        "Checks if a draft interviewer reply matches the strict, professional persona. "
        "If not, rewrites it to fit the tone. Input should be the draft text; output is the revised text."  # noqa: E501
    )
    
    def _run(self, draft: str) -> str:
        """Run the tool with the given draft reply."""
        prompt = (
            "Du bist ein strenger technischer Interviewer. "
            "Prüfe, ob die folgende Entwurfsantwort zu deiner Persona passt:\n\n"
            f"{draft}\n\n"
            "Wenn sie nicht passt, schreibe sie strenger und professioneller um. "
            "Wenn sie passt, gib sie unverändert zurück."
        )
        
        response = llm.invoke(prompt)
        
        # If it's a dict (most LangChain agents), get the "output" key
        if isinstance(response, dict):
            return response.get("output", str(response))
        
        # If it's an AIMessage, get the content
        return getattr(response, 'content', str(response))