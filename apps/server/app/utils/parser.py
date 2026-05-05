from fastapi import UploadFile
from app.agents.parser_graph import parser_graph

# 5. The Public Interface (Used by main.py)
async def extract_text_from_file(upload_file: UploadFile) -> str:
    """Entry point for FastAPI to trigger the Parser Graph"""
    content_bytes = await upload_file.read()
    filename = upload_file.filename
    ext = filename.split(".")[-1]

    # Invoke the specialized graph
    result = parser_graph.invoke({
        "file_bytes": content_bytes,
        "file_name": filename,
        "extension": ext,
        "content": "",
        "status": ""
    })
    
    return result["content"]
                