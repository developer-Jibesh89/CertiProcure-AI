from fastapi import (
    FastAPI, 
    BackgroundTasks,
    File, 
    UploadFile
)
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from utils.parser import extract_text_from_file
from blockchain.client import BlockchainAuditor
from core.database import (
    results_db,
    run_agent
)

from core.schemas import TenderRequest
from agents.worker import run_graph_audit

app = FastAPI(title="CRPF AI Tender Auditor")

# Initialize the Ganache client
blockchain = BlockchainAuditor()

origins = [
    "http://localhost:3000", # Standard React port
    "http://localhost:5173", # Vite React port
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Allow your React app
    allow_credentials=True,
    allow_methods=["*"],               # Allow POST, GET, OPTIONS, etc.
    allow_headers=["*"],               # Allow all headers (Content-Type, etc.)
)



# In-memory store for demo purposes
@app.post("/evaluate")
async def start_evaluation(request: TenderRequest, background_tasks: BackgroundTasks):
    job_id = f"job_{len(results_db) + 1}"
    results_db[job_id] = {"status": "processing", "data": None}
    
    # Run the agent in the background
    background_tasks.add_task(run_agent, job_id, request, blockchain)
    
    return {"job_id": job_id, "message": "Evaluation started"}


@app.post("/evaluate-files")
async def evaluate_files(
    background_tasks: BackgroundTasks,
    tender_file: UploadFile = File(...),
    bidder_files: List[UploadFile] = File(...)
):
    # 1. Parse the Tender Document
    tender_text = extract_text_from_file(tender_file)
    
    # 2. Parse all Bidder Documents
    parsed_bidders = []
    for b_file in bidder_files:
        bidder_text = extract_text_from_file(b_file)
        parsed_bidders.append({
            "name": b_file.filename,
            "content": bidder_text
        })
    
    # 3. Create a Job ID
    job_id = f"job_{len(results_db) + 1}"
    results_db[job_id] = {"status": "processing", "data": None}
    
    # 4. Hand off to the same LangGraph logic
    # We create a mock request object to match the previous logic
    class MockRequest:
        def __init__(self, t, b):
            self.tender_text = t
            self.bidders = b
            
    request = MockRequest(tender_text, parsed_bidders)
    background_tasks.add_task(run_agent, job_id, request)
    
    return {"job_id": job_id, "message": f"Processing {len(bidder_files)} files..."}



@app.get("/status/{job_id}")
async def get_status(job_id: str):
    return results_db.get(job_id, {"status": "not_found"})