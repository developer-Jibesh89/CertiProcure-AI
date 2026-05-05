from agents.auditor import tender_app

# app/core/database.py
results_db = {}

async def run_agent(job_id: str, request_data, blockchain):
    """
    Background worker that runs the LangGraph flow and 
    anchors results to the blockchain.
    """
    try:
        # Initial State: 1 Tender text mapped to N Bidders
        initial_state = {
            "tender_text": request_data.tender_text,
            "bidders": request_data.bidders,
            "criteria": [],
            "reports": [],
            "index": 0
        }

        # Run the compiled LangGraph workflow
        # Note: The 'evaluate' node inside tender_app calls blockchain.record_on_chain
        final_state = tender_app.invoke(initial_state)

        # After all bidders are processed, secure the final Job Summary
        final_tx = blockchain.record_on_chain(
            bidder_id=job_id,
            data_to_hash={"final_reports": [r.dict() for r in final_state["reports"]]},
            event_type="JOB_COMPLETION"
        )

        # Update the local DB for the Frontend to poll
        results_db[job_id] = {
            "status": "completed",
            "data": final_state["reports"],
            "master_audit_hash": final_tx
        }

    except Exception as e:
        print(f"Audit Job {job_id} failed: {str(e)}")
        results_db[job_id] = {"status": "failed", "error": str(e)}
