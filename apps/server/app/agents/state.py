from typing import Annotated, List, TypedDict, Dict
import operator
from pydantic import BaseModel, Field

class Criterion(BaseModel):
    key: str
    description: str
    is_mandatory: bool

class Evidence(BaseModel):
    criterion_key: str
    verdict: str # Eligible, Ineligible, Review
    extracted_value: str
    justification: str
    source_context: str

class BidderReport(BaseModel):
    bidder_name: str
    results: List[Evidence]
    overall_status: str
    blockchain_hash: str = ""

class AgentState(TypedDict):
    tender_text: str
    bidders: List[Dict[str, str]]
    criteria: List[Criterion]
    reports: Annotated[List[BidderReport], operator.add]
    index: int

class Criterion(BaseModel):
    key: str
    description: str
    is_mandatory: bool

# This is the "Wrapper" Gemini needs
class CriteriaList(BaseModel):
    criteria: List[Criterion] = Field(description="List of extracted tender criteria")
