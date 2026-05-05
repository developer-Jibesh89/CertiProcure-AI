# CertiProcure AI: Trusted Decision Support System

**CertiProcure AI** is an automated procurement verification engine designed to transition government auditing from manual, error-prone processes to an immutable, AI-driven verification workflow[cite: 1]. Developed for the **Bharat Hackathon**, it leverages a decoupled multi-agent framework and blockchain anchoring to ensure absolute trust and transparency in tender evaluations[cite: 1].

---

## Requiements

- Download Genache from [here](https://archive.trufflesuite.com/ganache/)

## Key Features

*   **Agentic AI Reasoning:** Powered by **LangGraph** and **Gemini 3 Flash**, the system extracts mandatory clauses from complex tender PDFs and maps them against bidder evidence with transparent "Reasoning Paths"[cite: 1].
*   **Immutable Blockchain Anchoring:** Every AI-generated verdict is SHA-256 hashed and anchored to a **Ganache** (EVM-compatible) private blockchain, preventing post-evaluation tampering[cite: 1].
*   **Decoupled Architecture:** Utilizes **Redis** for context caching and **AWS S3** for secure document handling via pre-signed URLs, reducing redundant processing by up to 90%[cite: 1].
*   **Adaptive Multimodal Parsing:** Specialized nodes handle "dirty data," including scanned PDFs and handwritten stamps, using native multimodal capabilities[cite: 1].
*   **Human-in-the-Loop (HITL):** A dedicated officer dashboard allows for manual overrides on complex cases, ensuring human accountability[cite: 1].

---

## Tech Stack

*   **Frontend:** React.ts, Tailwind CSS, Lucide Icons
*   **AI/Backend:** FastAPI, LangGraph, LangChain, Google Gemini 3 Flash
*   **Blockchain:** Ganache, Web3.py
*   **Infrastructure:** Redis (Context Cache), AWS S3 (Secure Storage)

---

## Installation & Setup

### Frontend Setup
```bash
cd apps/frontend # Move to the directory
pnpm install     # Install libraries
pnpm dev         # Start the application
```

### Backend Setup
```bash
cd apps/server                  # Move to the directory
python3 -m venv venv            # Create a virtual env
source venv/scripts/activate    # Activate the virtual Env (Windows: source venv/Scripts/activate)
pip install -r requirements.txt # Install required libraries
uvicorn app.main:app --reload   # Start the server
```

---