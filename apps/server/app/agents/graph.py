import time
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
# Import CriteriaList wrapper from state
from app.agents.state import AgentState, CriteriaList, BidderReport
from app.blockchain.client import BlockchainAuditor
from app.core.config import settings

# Initialize LLM with settings
llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    google_api_key=settings.GOOGLE_API_KEY,
    temperature=0
)

auditor = BlockchainAuditor()

def extract_tender_node(state: AgentState):
    """
    Parses the tender text and extracts structured criteria.
    Uses CriteriaList wrapper to avoid GenericAlias errors.
    """
    # Fix: Use the Pydantic wrapper class instead of List[Criterion]
    structured_llm = llm.with_structured_output(CriteriaList)
    
    prompt = f"Extract all eligibility criteria (Technical, Financial, Compliance) from: {state['tender_text']}"
    
    result = structured_llm.invoke(prompt)
    
    # Return the list extracted from the wrapper object
    return {"criteria": result.criteria}

def evaluate_bidder_node(state: AgentState):
    """
    Evaluates a specific bidder against the extracted criteria.
    Includes rate-limiting for Gemini Free Tier and blockchain hashing.
    """
    idx = state["index"]
    bidder = state["bidders"][idx]
    
    # Rate limit for Gemini Free Tier (15 RPM)
    if idx > 0: 
        time.sleep(4) 
    
    # BidderReport is a direct Pydantic class, so it works fine here
    evaluator = llm.with_structured_output(BidderReport)
    
    prompt = f"""
    You are an expert procurement auditor.
    Tender Rules: {state['criteria']}
    Bidder Documents: {bidder['content']}
    
    Evaluate the bidder '{bidder['name']}' against each rule.
    Be strict. If evidence is missing, mark as 'Needs Manual Review'.
    """
    
    report = evaluator.invoke(prompt)
    
    # Generate Blockchain Hash for Auditability
    tx_hash = auditor.secure_report(report.dict())
    report.blockchain_hash = tx_hash
    
    return {"reports": [report], "index": idx + 1}

def router(state: AgentState):
    """Determines if there are more bidders to process."""
    if state["index"] < len(state["bidders"]):
        return "evaluate"
    return END

# --- Graph Definition ---

builder = StateGraph(AgentState)

builder.add_node("extract", extract_tender_node)
builder.add_node("evaluate", evaluate_bidder_node)

builder.set_entry_point("extract")
builder.add_edge("extract", "evaluate")

builder.add_conditional_edges(
    "evaluate", 
    router, 
    {
        "evaluate": "evaluate", 
        END: END
    }
)

tender_app = builder.compile()