# ClauseCheck

**ClauseCheck** is a web-based contract analyzer that helps users understand legal documents by breaking them into individual clauses, summarizing each clause in plain English, and assigning a "danger score" that flags potentially risky or unfair language.

---

## 🧠 What It Does

- **Upload Support**: Accepts contracts via PDF, image (OCR), or pasted text.
- **Clause Extraction**: Automatically splits legal documents into discrete clauses using formatting patterns and fallback heuristics.
- **AI-Powered Summaries**: Uses OpenAI's GPT model to simplify legalese into understandable summaries.
- **Danger Scoring**: Assigns a risk score (0–100) to each clause based on potential unfairness or scams.
- **User-Friendly UI**: Clean, responsive interface with expandable clause cards and color-coded risk indicators.

---

## ⚙️ Tech Stack

- **Frontend**: React.js with TypeScript, styled for modularity and scalability.
- **Build Tool**: Vite for fast development and optimized production builds.
- **PDF Parsing**: `pdf-parse` (or similar) for extracting text from PDFs.
- **OCR**: `tesseract.js` for extracting text from images.
- **Backend API**: OpenAI API (`/v1/chat/completions`) for clause analysis and scoring.
- **State Management & Fetching**: `react-query` or `swr` for managing API requests and state.
- **Environment Management**: `.env` file for sensitive API keys (excluded from version control).
