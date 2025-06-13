"""Strict technical interviewer using ReAct. Important:
* Use `prefix=` so we **keep** the ReAct format section.
* Remove duplicate agent initializations (only one AgentExecutor instance).
"""

from langchain.agents import initialize_agent, AgentType
from backend.services.llm_groq import llm
from backend.tools.self_critique import SelfCritiqueTool # for rewriting prompts
# from langchain_community.tools import DuckDuckGoSearchRun

SYSTEM_PROMPT = """
    You are **Mark**, a rigorous, no-nonsense technical interviewer.
    Your job each turn:

    1. Evaluate the candidate’s last answer against these criteria:
    • relevance      • depth     • professionalism
    2. If the answer is **weak or incomplete**, briefly say why
    and ask a probing follow-up question.
    3. If the answer is **adequate**, acknowledge and move to the next topic.
    4. Never rewrite the candidate’s words; always speak as the interviewer.
    Format:
    Interviewer: <your single concise sentence or two>
"""

GREETINGS = {"hi", "hello", "hey", "good morning"}

TOOLS = []

agent = initialize_agent(
    tools=TOOLS,
    llm=llm,
    agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION ,
    verbose=True,                 # show thoughts/actions in backend log
    prefix=SYSTEM_PROMPT,        # keep ReAct formatting after persona
    max_iterations=5,            # plenty of steps before giving up
    max_execution_time=120,       # 2‑minute wall time
    handle_parsing_errors=True,
    early_stopping_method="generate",  # stop after first response
    return_intermediate_steps=True  # return all steps for debugging
)

async def ask_interviewer(user_text: str) -> str:
    if user_text.lower().strip() in GREETINGS:
        return "Interviewer: Good morning. Let’s begin. Describe your most relevant experience."  # needs to be dynamic
    
    ai_msg = await agent.ainvoke({"input": user_text})
    
    # If it's a dict (most LangChain agents), get the "output" key
    if isinstance(ai_msg, dict):
        return ai_msg.get("output", str(ai_msg))
    
    # If it's an AIMessage, get the content
    return getattr(ai_msg, 'content', str(ai_msg))
