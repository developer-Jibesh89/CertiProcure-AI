import io
import os
from typing import TypedDict, Literal

# Specialized Libraries
import pdfplumber
from docx import Document
import easyocr
from langgraph.graph import StateGraph, END

# 1. Define the State
class ParserState(TypedDict):
    file_bytes: bytes
    file_name: str
    extension: str
    content: str
    status: str

# 2. Define the Nodes
def pdf_worker(state: ParserState):
    """Uses pdfplumber to extract text from memory (io.BytesIO)"""
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(state["file_bytes"])) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        return {"content": text, "status": "success"}
    except Exception as e:
        return {"content": f"PDF Error: {str(e)}", "status": "failed"}

def docx_worker(state: ParserState):
    """Processes DOCX files using python-docx"""
    try:
        doc = Document(io.BytesIO(state["file_bytes"]))
        text = "\n".join([para.text for para in doc.paragraphs])
        return {"content": text, "status": "success"}
    except Exception as e:
        return {"content": f"DOCX Error: {str(e)}", "status": "failed"}

def ocr_worker(state: ParserState):
    """Handles Image OCR (Requires temporary file as EasyOCR usually reads paths)"""
    temp_path = f"temp_{state['file_name']}"
    try:
        with open(temp_path, "wb") as f:
            f.write(state["file_bytes"])
        
        reader = easyocr.Reader(['en'])
        result = reader.readtext(temp_path, detail=0)
        return {"content": " ".join(result), "status": "success"}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

# 3. Router Logic
def extension_router(state: ParserState) -> Literal["pdf", "docx", "image"]:
    ext = state["extension"].lower()
    if ext == "pdf": return "pdf"
    if ext in ["docx", "doc"]: return "docx"
    if ext in ["jpg", "jpeg", "png"]: return "image"
    raise ValueError("Unsupported file format")

# 4. Build the Graph
builder = StateGraph(ParserState)

builder.add_node("pdf_node", pdf_worker)
builder.add_node("docx_node", docx_worker)
builder.add_node("ocr_node", ocr_worker)

builder.set_conditional_entry_point(
    extension_router,
    {
        "pdf": "pdf_node",
        "docx": "docx_node",
        "image": "ocr_node"
    }
)

builder.add_edge("pdf_node", END)
builder.add_edge("docx_node", END)
builder.add_edge("ocr_node", END)

parser_graph = builder.compile()
