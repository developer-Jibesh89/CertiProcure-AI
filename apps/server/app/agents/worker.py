from agents.auditor import tender_app
from core.database import results_db

async def run_graph_audit(job_id, initial_state):
    final_output = tender_app.invoke(initial_state)
    results_db[job_id] = {
        "status": "completed", 
        "reports": [r.dict() for r in final_output["reports"]]
    }
