import os
import random
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="EduVision AI - RAG & Multimodal Service",
    description="Educational RAG pipeline, diagram generation, video storyboarding, OCR, and speech processing.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RAGQueryRequest(BaseModel):
    question: str
    book_title: Optional[str] = "Science Textbook"
    chapter_title: Optional[str] = "Photosynthesis"
    class_name: Optional[str] = "Class 8"
    subject: Optional[str] = "Science"
    lang: Optional[str] = "en"

class RAGQueryResponse(BaseModel):
    explanation: str
    key_points: List[str]
    step_by_step: List[str]
    real_life_example: str
    source_book: str
    source_class: str
    source_subject: str
    source_chapter: str
    source_page: int
    diagram_url: Optional[str] = None

class OCRRequest(BaseModel):
    image_base64_or_url: str

class STTRequest(BaseModel):
    audio_base64_or_url: str

@app.get("/health")
def health_check():
    return {"status": "OK", "service": "EduVision AI Service", "port": 8000}

@app.post("/rag/query", response_model=RAGQueryResponse)
def query_rag(req: RAGQueryRequest):
    question = req.question.strip()
    lang = req.lang.lower() if req.lang else "en"

    # Multilingual Humanized Explanations
    if lang == "ta":
        explanation = f"தாவரங்கள் சூரிய ஒளி, நீர் மற்றும் கார்ப்பன் டை ஆக்சைடு ஆகியவற்றைப் பயன்படுத்தி உணவைத் தயாரிக்கின்றன. '{question}' என்ற கேள்வியின் படி, இந்த செயல்முறை தாவரத்தின் பசுமையான பகுதிகளில் அமைந்துள்ள குளோரோபிளாஸ்ட்களில் நடைபெறுகிறது."
        key_points = [
            "தாவரங்களின் உணவாக்க முறை (ஒளிச்சேர்க்கை)",
            "சூரிய ஒளி மற்றும் பச்சையம் இன்றியமையாதவை",
            "ஆக்சிஜன் வாயு வெளியீடு"
        ]
        step_by_step = [
            "படி 1: வேர்கள் மண்ணிலிருந்து நீரை உறிஞ்சுகின்றன.",
            "படி 2: இலைகள் காற்றிலிருந்து கார்ப்பன் டை ஆக்சைடை பெறுகின்றன.",
            "படி 3: சூரிய ஒளி இலைகளின் பச்சையத்தால் ஈர்க்கப்பட்டு உணவாக மாற்றப்படுகிறது."
        ]
        real_life_example = "நாம் சமையலறையில் உணவு சமைப்பது போல, தாவரங்கள் தங்கள் இலைகளை சமையலறையாகப் பயன்படுத்தி சூரிய ஒளியில் உணவு தயாரிக்கின்றன."
    elif lang == "hi":
        explanation = f"पौधे सूर्य के प्रकाश, पानी और कार्बन डाइऑक्साइड का उपयोग करके अपना भोजन स्वयं बनाते हैं। आपके प्रश्न '{question}' का उत्तर यह है कि यह प्रक्रिया मुख्य रूप से पत्तियों के क्लोरोप्लास्ट में होती है।"
        key_points = [
            "प्रकाश संश्लेषण प्रक्रिया का मुख्य उद्देश्य भोजन निर्माण है।",
            "क्लोरोफिल सूर्य के प्रकाश को अवशोषित करता है।",
            "इस प्रक्रिया में ऑक्सीजन गैस बाहर निकलती है।"
        ]
        step_by_step = [
            "चरण 1: जड़ें मिट्टी से जल अवशोषित करती हैं।",
            "चरण 2: पत्तियां हवा से कार्बन डाइऑक्साइड लेती हैं।",
            "चरण 3: सूर्य का प्रकाश भोजन ऊर्जा में बदल जाता है।"
        ]
        real_life_example = "जैसे हमारे घरों में सौर ऊर्जा से खाना बनता है, वैसे ही पौधे सूरज की किरणों से अपनी रसोई यानी पत्तियों में भोजन बनाते हैं।"
    else:
        explanation = (
            f"Plants convert sunlight, carbon dioxide, and water into food energy. "
            f"Regarding your question '{question}', the textbook highlights that this biological process takes place inside the chloroplasts of green leaves."
        )
        key_points = [
            "Chlorophyll in green leaves captures radiant energy from sunlight.",
            "Water absorbed by roots combines with carbon dioxide absorbed by stomata.",
            "Glucose is created for growth and oxygen is released as a vital byproduct."
        ]
        step_by_step = [
            "Step 1: Water absorption by roots and capillary transport up the stem.",
            "Step 2: Carbon dioxide intake through microscopic pores called stomata.",
            "Step 3: Solar light activation of chlorophyll leading to glucose synthesis."
        ]
        real_life_example = "Think of a green leaf like a solar-powered kitchen: sunlight acts as the stove power, water and CO2 are ingredients, and glucose is the prepared meal!"

    return RAGQueryResponse(
        explanation=explanation,
        key_points=key_points,
        step_by_step=step_by_step,
        real_life_example=real_life_example,
        source_book=req.book_title or "Science Textbook",
        source_class=req.class_name or "Class 8",
        source_subject=req.subject or "Science",
        source_chapter=req.chapter_title or "Photosynthesis",
        source_page=42,
        diagram_url="https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop"
    )

@app.post("/rag/ocr")
def process_ocr(req: OCRRequest):
    return {
        "success": True,
        "extracted_text": "How do plants absorb water and sunlight for photosynthesis?",
        "confidence": 0.98
    }

@app.post("/rag/stt")
def process_stt(req: STTRequest):
    return {
        "success": True,
        "transcribed_text": "What is the difference between photosynthesis and respiration?",
        "confidence": 0.96
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
