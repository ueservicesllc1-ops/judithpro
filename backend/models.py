from enum import Enum
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class SeparationType(str, Enum):
    TWO_STEMS = "2stems"
    FOUR_STEMS = "4stems"
    FIVE_STEMS = "5stems"

class ProcessingTask(BaseModel):
    model_config = {"extra": "allow"}  # Permitir campos adicionales
    
    id: str
    original_filename: str
    file_path: str
    separation_type: str
    status: TaskStatus
    progress: int = 0
    stems: Optional[Dict[str, str]] = None
    error: Optional[str] = None
    created_at: datetime = datetime.now()
    completed_at: Optional[datetime] = None
    chords: Optional[List[Dict]] = None
    key: Optional[Dict] = None
    bpm: Optional[int] = None
    duration: Optional[float] = None
    timeSignature: Optional[str] = None
    keyInfo: Optional[Dict] = None

class AudioAnalysis(BaseModel):
    duration: float
    sample_rate: int
    tempo: float
    spectral_centroid: float
    spectral_rolloff: float
    key: Optional[str] = None
    bpm: Optional[float] = None

class StemInfo(BaseModel):
    name: str
    file_path: str
    duration: float
    size: int
    format: str

class ProcessingResult(BaseModel):
    task_id: str
    status: TaskStatus
    stems: List[StemInfo]
    analysis: Optional[AudioAnalysis] = None
    processing_time: float
    quality_score: Optional[float] = None
