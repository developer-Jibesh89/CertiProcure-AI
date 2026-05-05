from typing import Dict, List

from pydantic import BaseModel


class TenderRequest(BaseModel):
    tender_text: str
    bidders: List[Dict[str, str]]
