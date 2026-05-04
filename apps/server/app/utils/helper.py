
import io

from fastapi import UploadFile
import pdfplumber


def extract_text_from_file(upload_file: UploadFile) -> str:
    # Read the file content into memory
    file_content = upload_file.file.read()
    
    # Use pdfplumber to extract text from the PDF content
    text = ""
    with pdfplumber.open(io.BytesIO(file_content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text 

                