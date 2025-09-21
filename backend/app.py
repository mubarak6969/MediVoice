import os
import re
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load dataset file from same folder as this file
DATA_FILE = os.path.join(os.path.dirname(__file__), "health_data.json")
with open(DATA_FILE, "r", encoding="utf-8") as f:
    health_data = json.load(f)

app = FastAPI(title="MediVoice Backend")

# Allow frontend access (development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SymptomsRequest(BaseModel):
    symptoms: str

def normalize_text(s: str) -> str:
    """Lowercase, remove punctuation, collapse whitespace."""
    s = s.lower()
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def simple_clean_transcript(text: str) -> str:
    """Remove common filler phrases to help matching."""
    text = normalize_text(text)
    # remove typical leading phrases
    text = re.sub(r"\b(i have|i've got|i have got|i am having|i'm having|i've been|i have been|i feel|i'm|i am|there is|there's|my|please|kind of|kinda)\b", " ", text)
    # remove connecting words that can confuse matching
    text = re.sub(r"\b(pain in|pain on|in my|on my|since|for|and|with|but|also)\b", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

@app.get("/")
async def root():
    return {"message": "MediVoice backend is running. Use POST /analyze"}

@app.post("/analyze")
async def analyze(payload: SymptomsRequest):
    user_input = simple_clean_transcript(payload.symptoms or "")
    if not user_input:
        return {
            "success": False,
            "message": "No symptoms provided.",
            "conditions": [],
            "medicines": [],
            "organic_remedies": [],
            "food_suggestions": [],
            "doctor_suggestion": "Provide a symptom like 'fever' or 'stomach pain'."
        }

    matches = []

    # 1) Exact phrase match (best)
    for entry in health_data:
        entry_sym = normalize_text(entry.get("symptom", ""))
        if entry_sym and entry_sym in user_input:
            matches.append(entry)

    # 2) Full-word match for multi-word symptoms (e.g., "stomach pain" both words present)
    if not matches:
        user_tokens = set(user_input.split())
        for entry in health_data:
            entry_sym = normalize_text(entry.get("symptom", ""))
            if not entry_sym:
                continue
            words = entry_sym.split()
            if len(words) > 1 and all(w in user_tokens for w in words):
                matches.append(entry)

    # 3) Single-word symptom match
    if not matches:
        user_tokens = set(user_input.split())
        for entry in health_data:
            entry_sym = normalize_text(entry.get("symptom", ""))
            if not entry_sym:
                continue
            words = entry_sym.split()
            if len(words) == 1 and words[0] in user_tokens:
                matches.append(entry)

    # 4) Loose/fuzzy fallback: at least 60% of words match
    if not matches:
        user_tokens = set(user_input.split())
        for entry in health_data:
            entry_sym = normalize_text(entry.get("symptom", ""))
            if not entry_sym:
                continue
            words = entry_sym.split()
            if not words:
                continue
            common = sum(1 for w in words if w in user_tokens)
            if common / len(words) >= 0.6:
                matches.append(entry)

    if not matches:
        return {
            "success": False,
            "message": f"No match found for '{payload.symptoms}'. Try simpler/common words (e.g. 'fever', 'cough', 'stomach pain').",
            "conditions": [],
            "medicines": [],
            "organic_remedies": [],
            "food_suggestions": [],
            "doctor_suggestion": "When in doubt, consult a healthcare professional."
        }

    # Aggregate and deduplicate results
    def dedupe(seq):
        seen = set()
        out = []
        for item in seq:
            if item not in seen:
                seen.add(item)
                out.append(item)
        return out

    conditions = []
    medicines = []
    organic = []
    foods = []
    doctor_recs = []

    for e in matches:
        conditions.extend(e.get("conditions", []) or [])
        medicines.extend(e.get("medicines", []) or [])
        organic.extend(e.get("organic_remedies", []) or [])
        foods.extend(e.get("food_suggestions", []) or [])
        ds = e.get("doctor_suggestion") or e.get("doctor")  # accept either key
        if ds:
            doctor_recs.append(ds)

    return {
        "success": True,
        "conditions": dedupe(conditions),
        "medicines": dedupe(medicines),
        "organic_remedies": dedupe(organic),
        "food_suggestions": dedupe(foods),
        "doctor_suggestion": "; ".join(dedupe(doctor_recs)) if doctor_recs else "Consult a healthcare professional if symptoms worsen."
    }
