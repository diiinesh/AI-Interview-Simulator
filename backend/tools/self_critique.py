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
            "You are a strict technical interviewer. "
            "Check if the following draft reply matches your persona:\n\n"
            f"{draft}\n\n"
            "If it does not match, rewrite it to be more strict and professional. "
            "If it does match, return it unchanged."
        )
        
        response = llm.invoke(prompt)
        
        # If it's a dict (most LangChain agents), get the "output" key
        if isinstance(response, dict):
            return response.get("output", str(response))
        
        # If it's an AIMessage, get the content
        return getattr(response, 'content', str(response))