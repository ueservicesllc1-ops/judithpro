from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
import os
import uuid
import asyncio
import tempfile
from pathlib import Path
from typing import List, Optional, Dict
import json

from audio_processor_real import audio_processor
from chord_analyzer import ChordAnalyzer
from models import ProcessingTask, TaskStatus
# from database import get_db, init_db  # Commented out - not using database
from b2_storage import b2_storage
import librosa
import numpy as np

# In-memory task storage
tasks_storage = {}

app = FastAPI(
    title="Moises Clone API",
    description="AI-powered audio separation service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://localhost:3002",
        "https://moises2-production.up.railway.app",
        "https://moises2-production-d1cb.up.railway.app",
        "https://judith.life",
        "https://www.judith.life"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (commented for demo)
# app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize B2 only (database not used)
@app.on_event("startup")
async def startup_event():
    # init_db()  # Commented out - not using database
    await b2_storage.initialize()

# Audio processor instance (already imported)

@app.get("/")
async def root():
    return {"message": "Moises Clone API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "OK", "message": "Backend is running"}

@app.post("/upload")
async def upload_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    separation_type: str = "2stems",
    separation_options: Optional[str] = None,
    hi_fi: bool = False
):
    """Upload audio file and start separation process"""
    
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be audio")
    
    # Generate unique task ID
    task_id = str(uuid.uuid4())
    
    # Create upload directory
    upload_dir = Path(f"../uploads/{task_id}")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save uploaded file
    file_path = upload_dir / f"original.{file.filename.split('.')[-1]}"
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Parse separation options if provided
    custom_tracks = None
    if separation_options:
        try:
            import json
            custom_tracks = json.loads(separation_options)
        except:
            pass
    
    # Create processing task
    task = ProcessingTask(
        id=task_id,
        original_filename=file.filename,
        file_path=str(file_path),
        separation_type=separation_type,
        status=TaskStatus.PROCESSING
    )
    
    # Start background processing with options
    background_tasks.add_task(process_audio, task, custom_tracks, hi_fi)
    
    return {
        "task_id": task_id,
        "status": "processing",
        "message": "Audio upload successful, processing started",
        "separation_type": separation_type,
        "hi_fi": hi_fi
    }

@app.post("/separate")
async def separate_audio_direct(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    separation_type: str = Form("vocals-instrumental"),
    separation_options: Optional[str] = Form(None),
    hi_fi: bool = Form(False),
    song_id: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None)
):
    """Separate audio directly from uploaded file"""
    
    try:
        print(f"[SEPARATE] Received separation request:")
        print(f"  - File: {file.filename}")
        print(f"  - Content-Type: {file.content_type}")
        print(f"  - Separation Type: {separation_type}")
        print(f"  - Hi-Fi: {hi_fi}")
        
        if not file.content_type or not file.content_type.startswith("audio/"):
            print(f"[ERROR] Invalid content type: {file.content_type}")
            raise HTTPException(status_code=400, detail="File must be audio")
        
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        print(f"[OK] Generated task ID: {task_id}")
        
        # Create upload directory
        upload_dir = Path(f"uploads/{task_id}")
        upload_dir.mkdir(parents=True, exist_ok=True)
        print(f"[OK] Created upload directory: {upload_dir}")
        
        # Save uploaded file directly
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'mp3'
        file_path = upload_dir / f"original.{file_ext}"
        
        print(f"[SAVE] Saving file to: {file_path}")
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        print(f"[OK] File saved successfully ({len(content)} bytes)")
        
        # Parse separation options if provided
        custom_tracks = None
        if separation_options:
            try:
                custom_tracks = json.loads(separation_options)
                print(f"🎯 [SEPARATE] Parsed separation_options: {custom_tracks}")
            except Exception as e:
                print(f"⚠️ [SEPARATE] Error parsing separation_options: {e}")
                pass
        else:
            print(f"⚠️ [SEPARATE] No separation_options provided")
        
        # Create processing task
        task = ProcessingTask(
            id=task_id,
            original_filename=file.filename,
            file_path=str(file_path),
            separation_type=separation_type,
            status=TaskStatus.PROCESSING
        )
        
        # Store task in memory
        tasks_storage[task_id] = task
        print(f"[OK] Task created and stored: {task_id}")
        
        # Start background processing with options
        print(f"🚀 [SEPARATE] Starting background task with:")
        print(f"   - separation_type: {separation_type}")
        print(f"   - custom_tracks: {custom_tracks}")
        print(f"   - hi_fi: {hi_fi}")
        background_tasks.add_task(process_audio, task, custom_tracks, hi_fi)
        print(f"[OK] Background processing started")
        
        return {
            "success": True,
            "data": {
                "task_id": task_id,
                "status": "processing",
                "message": "Audio separation started",
                "filename": file.filename,
                "original_url": f"http://localhost:8000/audio/{task_id}/original.mp3",
                "stems": {
                    "vocals": f"http://localhost:8000/audio/{task_id}/vocals.wav",
                    "drums": f"http://localhost:8000/audio/{task_id}/drums.wav",
                    "bass": f"http://localhost:8000/audio/{task_id}/bass.wav",
                    "other": f"http://localhost:8000/audio/{task_id}/other.wav"
                },
                "bpm": 126,
                "key": "E",
                "timeSignature": "4/4",
                "duration": "5:00"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR in /separate endpoint: {str(e)}")
        import traceback
        traceback.print_exc()
        error_detail = f"Server error: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    """Get processing status"""
    task = await get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Return B2 URLs directly (already uploaded to B2)
    stems_urls = None
    if task.status == TaskStatus.COMPLETED and task.stems:
        stems_urls = task.stems  # These are already B2 URLs
    
    return {
        "task_id": task_id,
        "status": task.status,
        "progress": task.progress,
        "stems": stems_urls,
        "bpm": 126,  # Default BPM
        "key": "E",  # Default key
        "timeSignature": "4/4",  # Default time signature
        "duration": "5:00"  # Default duration
    }

@app.get("/audio/{path:path}")
async def serve_audio(path: str):
    """Serve audio files from local filesystem or B2"""
    try:
        # Construct local file path
        local_path = f"../uploads/{path}"
        
        # Try local file first
        if os.path.exists(local_path):
            # Determine media type based on file extension
            if path.endswith('.mp3'):
                media_type = "audio/mpeg"
            elif path.endswith('.wav'):
                media_type = "audio/wav"
            else:
                media_type = "audio/wav"  # Default
            
            # Return file response
            return FileResponse(
                local_path,
                media_type=media_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET",
                    "Access-Control-Allow-Headers": "Range",
                    "Cache-Control": "public, max-age=3600"
                }
            )
        
        # If not found locally, try to stream from B2
        print(f"Audio file not found locally: {local_path}, trying B2...")
        try:
            # Construct B2 URL directly
            # Format: https://s3.us-east-005.backblazeb2.com/moises2/audio/{path}
            b2_url = f"https://s3.us-east-005.backblazeb2.com/moises2/audio/{path}"
            print(f"Streaming from B2 URL: {b2_url}")
            
            # Stream the file from B2 through backend
            import aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.get(b2_url) as response:
                    if response.status == 200:
                        content = await response.read()
                        
                        # Determine media type
                        if path.endswith('.mp3'):
                            media_type = "audio/mpeg"
                        elif path.endswith('.wav'):
                            media_type = "audio/wav"
                        else:
                            media_type = "audio/wav"
                        
                        from fastapi.responses import Response
                        return Response(
                            content=content,
                            media_type=media_type,
                            headers={
                                "Access-Control-Allow-Origin": "*",
                                "Access-Control-Allow-Methods": "GET",
                                "Access-Control-Allow-Headers": "Range",
                                "Cache-Control": "public, max-age=3600",
                                "Accept-Ranges": "bytes"
                            }
                        )
                    else:
                        print(f"B2 returned status: {response.status}")
                        raise HTTPException(status_code=404, detail="Audio file not found in B2")
        except Exception as b2_error:
            print(f"Error streaming from B2: {b2_error}")
        
        # If still not found, raise 404
        print(f"Audio file not found anywhere: {path}")
        raise HTTPException(status_code=404, detail="Audio file not found")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error serving audio {path}: {e}")
        raise HTTPException(status_code=404, detail="Audio file not found")

@app.get("/download/{task_id}/{stem_name}")
async def download_stem(task_id: str, stem_name: str):
    """Download separated stem"""
    task = await get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task.status != TaskStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Task not completed")
    
    # Check if stems exist in the task
    if not task.stems or stem_name not in task.stems:
        raise HTTPException(status_code=404, detail="Stem not found")
    
    stem_path = Path(task.stems[stem_name])
    if not stem_path.exists():
        raise HTTPException(status_code=404, detail="Stem file not found")
    
    return FileResponse(
        path=str(stem_path),
        filename=f"{stem_name}",
        media_type="audio/wav"
    )

async def process_audio(task: ProcessingTask, custom_tracks: Optional[Dict] = None, hi_fi: bool = False):
    """Background task to process audio"""
    try:
        # Update task status
        task.status = TaskStatus.PROCESSING
        task.progress = 10
        
        # Callback para actualizar progreso
        def update_progress(progress: int, message: str = ""):
            task.progress = progress
            print(f"Progress: {progress}% - {message}")
        
        # Determinar qué tracks solicitar
        requested_tracks = None
        
        # 🔥 FIX: Procesar tracks custom (individuales seleccionados)
        if task.separation_type == "custom" and custom_tracks:
            print(f"🎯 Procesando tracks CUSTOM: {custom_tracks}")
            # Filtrar solo los tracks que están en True
            requested_tracks = [track for track, enabled in custom_tracks.items() if enabled]
            print(f"🎯 Tracks a separar: {requested_tracks}")
            
            if len(requested_tracks) == 0:
                # Si no hay tracks seleccionados, usar todos por defecto
                requested_tracks = ["vocals", "drums", "bass", "other"]
            
            stems = await audio_processor.separate_with_demucs(task.file_path, update_progress, requested_tracks)
        
        elif task.separation_type == "vocals-instrumental":
            print(f"🎤 Procesando modo: vocals-instrumental")
            requested_tracks = ["vocals", "instrumental"]
            stems = await audio_processor.separate_with_demucs(task.file_path, update_progress, requested_tracks)
        
        elif task.separation_type == "vocals-drums-bass-other":
            print(f"🎵 Procesando modo: vocals-drums-bass-other (4 stems)")
            requested_tracks = ["vocals", "drums", "bass", "other"]
            stems = await audio_processor.separate_with_demucs(task.file_path, update_progress, requested_tracks)
        
        else:
            # Por defecto, separar todos los stems
            print(f"🎵 Procesando modo por defecto: 4 stems")
            requested_tracks = ["vocals", "drums", "bass", "other"]
            stems = await audio_processor.separate_with_demucs(task.file_path, update_progress, requested_tracks)
        
        # Upload stems to B2 for online playback
        print(f"Uploading {len(stems)} stems to B2...")
        task.progress = 85
        b2_stems = await upload_stems_to_b2(stems, task.id)
        task.progress = 95
        
        # Update task with B2 URLs
        task.stems = b2_stems
        task.status = TaskStatus.COMPLETED
        task.progress = 100
        
        print(f"Audio processing completed with B2 URLs: {b2_stems}")
        
    except Exception as e:
        task.status = TaskStatus.FAILED
        task.error = str(e)
        print(f"Processing error: {e}")

async def upload_stems_to_b2(stems: Dict[str, str], task_id: str) -> Dict[str, str]:
    """Upload separated stems to B2 and return URLs"""
    try:
        import aiohttp
        import aiofiles
        
        b2_stems = {}
        
        for stem_name, stem_path in stems.items():
            if os.path.exists(stem_path):
                print(f"Uploading {stem_name} to B2...")
                
                # Read file
                async with aiofiles.open(stem_path, 'rb') as f:
                    file_data = await f.read()
                
                # Create FormData
                form_data = aiohttp.FormData()
                form_data.add_field('file', file_data, filename=f"{stem_name}.wav", content_type='audio/wav')
                form_data.add_field('userId', 'system')
                form_data.add_field('songId', task_id)
                form_data.add_field('trackName', stem_name)
                form_data.add_field('folder', 'stems')
                
                # Upload to B2 via proxy
                async with aiohttp.ClientSession() as session:
                    async with session.post('http://localhost:3001/api/upload', data=form_data) as response:
                        if response.status == 200:
                            result = await response.json()
                            b2_url = result.get('downloadUrl', '')
                            b2_stems[stem_name] = b2_url
                            print(f"SUCCESS: {stem_name} uploaded to B2: {b2_url}")
                        else:
                            print(f"ERROR: Failed to upload {stem_name}: {response.status}")
        
        return b2_stems
        
    except Exception as e:
        print(f"ERROR uploading stems to B2: {e}")
        return stems  # Return local paths as fallback

async def get_task_status(task_id: str) -> Optional[ProcessingTask]:
    """Get task status from memory storage"""
    return tasks_storage.get(task_id)

# Chord Analysis Endpoints
@app.post("/api/analyze-chords")
async def analyze_chords(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(None)
):
    """Analyze chords and key of an audio file from URL or upload"""
    try:
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        
        # Save uploaded file
        upload_dir = Path("../uploads") / task_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / "audio.wav"
        
        if file and file.filename:
            # Upload file provided
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            print(f"Saved uploaded file for chord analysis: {file_path}")
        else:
            # No file provided, this endpoint now expects URL in request body
            return {"error": "No file provided. Use /api/analyze-chords-url endpoint for URL analysis."}
        
        # Create task
        task = ProcessingTask(
            id=task_id,
            original_filename=file.filename or "audio.wav",
            file_path=str(file_path),
            separation_type="chord-analysis",
            status=TaskStatus.PROCESSING,
            progress=0
        )
        tasks_storage[task_id] = task
        
        # Start chord analysis in background
        background_tasks.add_task(process_chord_analysis, task)
        
        return {
            "task_id": task_id,
            "status": "processing",
            "message": "Chord analysis started"
        }
        
    except Exception as e:
        print(f"Error in analyze_chords endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze-chords-url")
async def analyze_chords_from_url(
    background_tasks: BackgroundTasks,
    request: dict
):
    """Analyze chords from audio URL"""
    try:
        import requests
        import os
        import shutil
        from pathlib import Path
        
        audio_url = request.get("url")
        if not audio_url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        
        # Download file from URL
        upload_dir = Path("../uploads") / task_id
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / "audio.wav"
        
        print(f"Processing audio from URL: {audio_url}")
        
        # Check if it's a local backend URL
        if audio_url.startswith("http://localhost:8000/audio/") or audio_url.startswith("http://127.0.0.1:8000/audio/"):
            # Extract the file path from the URL
            url_path = audio_url.replace("http://localhost:8000/audio/", "").replace("http://127.0.0.1:8000/audio/", "")
            # Try to find the file in the uploads directory
            
            # Search for the file in uploads directory
            uploads_dir = Path("../uploads")
            found_file = None
            
            for root, dirs, files in os.walk(uploads_dir):
                for file in files:
                    if file.endswith(('.mp3', '.wav', '.m4a', '.flac')):
                        file_path_found = Path(root) / file
                        # Check if this might be the file we're looking for
                        if url_path in str(file_path_found) or file in url_path:
                            found_file = file_path_found
                            break
                if found_file:
                    break
            
            if found_file and found_file.exists():
                # Copy the existing file
                shutil.copy2(found_file, file_path)
                print(f"Using existing file: {found_file} -> {file_path}")
            else:
                # Fallback: try to download anyway
                print(f"Local file not found, trying to download: {audio_url}")
                response = requests.get(audio_url, timeout=30)
                response.raise_for_status()
                
                with open(file_path, "wb") as buffer:
                    buffer.write(response.content)
                
                print(f"Downloaded and saved audio file: {file_path}")
        else:
            # External URL - download normally
            response = requests.get(audio_url, timeout=30)
            response.raise_for_status()
            
            with open(file_path, "wb") as buffer:
                buffer.write(response.content)
            
            print(f"Downloaded and saved audio file: {file_path}")
        
        # Create task
        task = ProcessingTask(
            id=task_id,
            original_filename="audio_from_url.wav",
            file_path=str(file_path),
            separation_type="chord-analysis",
            status=TaskStatus.PROCESSING,
            progress=0
        )
        tasks_storage[task_id] = task
        
        # Start chord analysis in background
        background_tasks.add_task(process_chord_analysis, task)
        
        return {
            "task_id": task_id,
            "status": "processing",
            "message": "Chord analysis started from URL"
        }
        
    except Exception as e:
        print(f"Error in analyze_chords_from_url endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chord-analysis/{task_id}")
async def get_chord_analysis(task_id: str):
    """Get chord analysis results"""
    task = tasks_storage.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Chords are already stored as dictionaries, so we can return them directly
    chords_data = None
    if hasattr(task, 'chords') and task.chords:
        chords_data = task.chords  # Already stored as dictionaries
    
    # Key is already stored as dictionary, so we can return it directly
    key_data = None
    if hasattr(task, 'key') and task.key:
        key_data = task.key  # Already stored as dictionary
    
    return {
        "task_id": task_id,
        "status": task.status,
        "progress": task.progress,
        "chords": chords_data,
        "key": key_data,
        "error": task.error if hasattr(task, 'error') else None
    }

async def process_chord_analysis(task: ProcessingTask):
    """Background task to analyze chords"""
    try:
        print(f"Starting chord analysis for task {task.id}")
        print(f"File path: {task.file_path}")
        
        # Check if file exists
        import os
        if not os.path.exists(task.file_path):
            raise Exception(f"Audio file not found: {task.file_path}")
        
        # Initialize chord analyzer
        print("Initializing chord analyzer...")
        from chord_analyzer import ChordAnalyzer
        analyzer = ChordAnalyzer()
        
        # Update progress
        task.progress = 20
        task.status = TaskStatus.PROCESSING
        
        # Analyze chords
        print("Analyzing chords...")
        chords = analyzer.analyze_chords(task.file_path)
        print(f"Found {len(chords)} chords")
        task.progress = 60
        
        # Analyze key
        print("Analyzing key...")
        key_info = analyzer.analyze_key(task.file_path)
        print(f"Key analysis result: {key_info}")
        task.progress = 80
        
        # Save results
        task.chords = [
            {
                "chord": chord.chord,
                "confidence": float(chord.confidence),
                "start_time": float(chord.start_time),
                "end_time": float(chord.end_time),
                "root_note": chord.root_note,
                "chord_type": chord.chord_type
            }
            for chord in chords
        ]
        
        task.key = {
            "key": key_info.key if key_info else "Unknown",
            "mode": key_info.mode if key_info else "Unknown",
            "confidence": float(key_info.confidence) if key_info else 0.0,
            "tonic": key_info.tonic if key_info else "Unknown"
        } if key_info else None
        
        task.progress = 100
        task.status = TaskStatus.COMPLETED
        
        print(f"Chord analysis completed for task {task.id}")
        
    except Exception as e:
        task.status = TaskStatus.FAILED
        task.error = str(e)
        print(f"Chord analysis error: {e}")

@app.post("/api/analyze-bpm")
async def analyze_bpm(file: UploadFile = File(...)):
    """
    Analiza el BPM y offset del primer beat de un archivo de audio
    """
    try:
        # Crear directorio temporal si no existe
        temp_dir = Path("temp_analysis")
        temp_dir.mkdir(exist_ok=True)
        
        # Guardar archivo temporal
        temp_file = temp_dir / f"temp_{uuid.uuid4()}_{file.filename}"
        with open(temp_file, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        try:
            # Cargar audio con librosa
            y, sr = librosa.load(str(temp_file))
            
            # Detectar tempo y beats
            tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units='time')
            
            # Calcular offset del primer beat
            first_beat_time = 0.0
            if len(beat_frames) > 0:
                first_beat_time = beat_frames[0]
            
            # Detectar onset del primer ataque fuerte
            onsets = librosa.onset.onset_detect(y=y, sr=sr, units='time')
            first_onset = onsets[0] if len(onsets) > 0 else 0.0
            
            # Usar el menor entre primer beat y primer onset
            offset = min(first_beat_time, first_onset) if first_onset > 0 else first_beat_time
            
            # Duración del audio
            duration = len(y) / sr
            
            # Detectar compás (time signature)
            # Análisis básico de patrones de acentuación
            beat_times = librosa.frames_to_time(beat_frames, sr=sr)
            if len(beat_times) >= 4:
                # Analizar patrones de acentuación en los primeros beats
                energy_per_beat = []
                for i in range(min(8, len(beat_times) - 1)):
                    start_frame = int(beat_times[i] * sr)
                    end_frame = int(beat_times[i + 1] * sr)
                    beat_energy = np.mean(np.abs(y[start_frame:end_frame]))
                    energy_per_beat.append(beat_energy)
                
                # Detectar patrón de acentuación (4/4, 3/4, etc.)
                if len(energy_per_beat) >= 4:
                    # Buscar patrones de acentuación cada 4 beats
                    accent_pattern = 4  # Default
                    if len(energy_per_beat) >= 8:
                        # Analizar si hay acentuación cada 3 beats (3/4)
                        three_beat_energy = np.mean([energy_per_beat[i] for i in range(0, len(energy_per_beat), 3)])
                        four_beat_energy = np.mean([energy_per_beat[i] for i in range(0, len(energy_per_beat), 4)])
                        
                        if three_beat_energy > four_beat_energy * 1.2:
                            accent_pattern = 3
            else:
                accent_pattern = 4
            
            result = {
                "bpm": float(tempo),
                "offset": float(offset),
                "duration": float(duration),
                "time_signature": f"{accent_pattern}/4",
                "beat_times": beat_times.tolist()[:20],  # Primeros 20 beats
                "onsets": onsets.tolist()[:10]  # Primeros 10 onsets
            }
            
            return result
            
        finally:
            # Limpiar archivo temporal
            if temp_file.exists():
                temp_file.unlink()
                
    except Exception as e:
        print(f"Error analyzing BPM: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing audio: {str(e)}")

def detect_offset(audio_path: str) -> float:
    """Detecta el downbeat real (primer beat fuerte del compás) en segundos."""
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    
    # 1. Detectar tempo y beats
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    
    # 2. Detectar onsets (ataques)
    onset_strength = librosa.onset.onset_strength(y=y, sr=sr)
    onset_frames = librosa.onset.onset_detect(
        onset_envelope=onset_strength, sr=sr, units="frames",
        pre_max=3, post_max=3, pre_avg=3, post_avg=5, 
        delta=0.5, wait=20
    )
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)
    
    if len(beat_times) == 0 or len(onset_times) == 0:
        return 0.1  # Fallback
    
    # 3. Buscar el primer onset que coincida con un beat (downbeat real)
    tolerance = 0.15  # 150ms de tolerancia
    
    for beat_time in beat_times:
        # Buscar onsets cerca de este beat
        for onset_time in onset_times:
            if abs(onset_time - beat_time) <= tolerance:
                # Encontramos un onset que coincide con un beat
                return round(float(max(0.1, onset_time)), 3)
    
    # 4. Si no hay coincidencia exacta, buscar el primer beat fuerte
    # Analizar energía alrededor de cada beat
    energy = np.abs(y)
    beat_energies = []
    
    for beat_time in beat_times[:5]:  # Solo los primeros 5 beats
        start_frame = int((beat_time - 0.1) * sr)
        end_frame = int((beat_time + 0.1) * sr)
        start_frame = max(0, start_frame)
        end_frame = min(len(energy), end_frame)
        
        if end_frame > start_frame:
            beat_energy = np.mean(energy[start_frame:end_frame])
            beat_energies.append((beat_time, beat_energy))
    
    if beat_energies:
        # Tomar el beat con mayor energía (más probable que sea el downbeat)
        strongest_beat = max(beat_energies, key=lambda x: x[1])
        return round(float(max(0.1, strongest_beat[0])), 3)
    
    # 5. Fallback: usar el primer beat detectado
    return round(float(max(0.1, beat_times[0])), 3)

def detect_bpm_and_duration(audio_path: str):
    """Detecta BPM promedio y duración del audio con algoritmo mejorado."""
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    
    # Usar múltiples métodos para detectar BPM más preciso
    # Método 1: beat_track con diferentes parámetros
    tempo1, beats1 = librosa.beat.beat_track(y=y, sr=sr, start_bpm=60, tightness=100)
    
    # Método 2: beat_track con parámetros más conservadores
    tempo2, beats2 = librosa.beat.beat_track(y=y, sr=sr, start_bpm=120, tightness=50)
    
    # Método 3: Usar onset_strength para detectar tempo
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    tempo3, beats3 = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
    
    # Método 4: Análisis de espectro para detectar tempo
    tempo4, beats4 = librosa.beat.beat_track(y=y, sr=sr, units='time', hop_length=512)
    
    # Método 5: Usar tempo con diferentes hop_length
    tempo5, beats5 = librosa.beat.beat_track(y=y, sr=sr, hop_length=1024)
    
    # Método 6: Análisis de tempo con diferentes unidades
    tempo6, beats6 = librosa.beat.beat_track(y=y, sr=sr, units='frames')
    
    # Calcular promedio de los métodos
    tempos = [tempo1, tempo2, tempo3, tempo4, tempo5, tempo6]
    
    # Filtrar valores extremos (menos de 40 o más de 250 BPM)
    valid_tempos = [t for t in tempos if 40 <= t <= 250]
    
    if valid_tempos:
        # Usar la mediana para evitar outliers
        tempo = np.median(valid_tempos)
        
        # Verificar si el tempo es consistente con los beats detectados
        if len(beats1) > 0:
            beat_times = librosa.frames_to_time(beats1, sr=sr)
            if len(beat_times) > 1:
                # Calcular BPM basado en intervalos entre beats
                intervals = np.diff(beat_times)
                median_interval = np.median(intervals)
                calculated_bpm = 60.0 / median_interval
                
                # Si el BPM calculado es muy diferente, usar el calculado
                if abs(calculated_bpm - tempo) > 20:
                    tempo = calculated_bpm
    else:
        # Fallback al primer método si todos son inválidos
        tempo = tempo1
    
    # Normalización del BPM para rango musical estándar
    if tempo < 70:
        tempo = tempo * 2  # Subir al doble si está muy lento
    elif tempo > 180:
        tempo = tempo / 2  # Bajar a la mitad si está muy rápido
    
    # Asegurar que el tempo esté en un rango razonable
    tempo = max(60, min(180, tempo))
    
    # Redondear a números enteros (120, 121, 122, etc.)
    original_tempo = tempo
    print(f"BPM antes del redondeo: {tempo}")
    
    # Redondear al entero más cercano
    tempo = round(tempo)
    
    print(f"BPM después del redondeo: {original_tempo} -> {tempo}")
    print(f"BPM final que se devuelve: {tempo}")
    
    duration = librosa.get_duration(y=y, sr=sr)
    return int(tempo), round(float(duration), 2)

@app.post("/api/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    try:
        # Guardar el archivo temporalmente
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Detectar offset, bpm y duración
        offset = detect_offset(tmp_path)
        bpm, duration = detect_bpm_and_duration(tmp_path)

        # Eliminar archivo temporal
        os.remove(tmp_path)

        print(f"RESULTADO FINAL: offset={offset}, bpm={bpm}, duration={duration}")
        
        return {
            "success": True,
            "offset": offset,
            "bpm": bpm,
            "duration": duration
        }

    except Exception as e:
        print(f"Error analyzing audio: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing audio: {str(e)}")

@app.post("/youtube-extract")
async def extract_youtube_audio(request: Request):
    """
    Extrae audio de un video de YouTube
    """
    # Importar yt-dlp al inicio
    try:
        import yt_dlp
    except ImportError:
        raise HTTPException(
            status_code=500, 
            detail="yt-dlp no esta instalado. Ejecuta: pip install yt-dlp"
        )
    
    try:
        data = await request.json()
        youtube_url = data.get("url")
        
        if not youtube_url:
            raise HTTPException(status_code=400, detail="URL de YouTube requerida")
        
        print(f"[YouTube] Extrayendo audio de: {youtube_url}")
        
        # Crear directorio temporal
        temp_dir = tempfile.mkdtemp()
        output_template = os.path.join(temp_dir, '%(title)s.%(ext)s')
        
        # Opciones de yt-dlp
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': output_template,
            'quiet': False,
            'no_warnings': False,
            'noplaylist': True,  # Solo descargar el video, NO la playlist
        }
        
        # Extraer audio
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(youtube_url, download=True)
            video_title = info.get('title', 'video')
            duration = info.get('duration', 0)
            
            # Encontrar el archivo descargado
            downloaded_file = None
            for file in os.listdir(temp_dir):
                if file.endswith('.mp3'):
                    downloaded_file = os.path.join(temp_dir, file)
                    break
            
            if not downloaded_file or not os.path.exists(downloaded_file):
                raise HTTPException(status_code=500, detail="Error al descargar el audio")
            
            print(f"[YouTube] Audio extraido: {video_title}")
            
            # Leer el archivo y enviarlo como respuesta
            with open(downloaded_file, 'rb') as f:
                audio_data = f.read()
            
            # Limpiar archivos temporales
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
            
            # Retornar el audio como base64 para enviarlo al frontend
            import base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            return {
                "success": True,
                "title": video_title,
                "duration": duration,
                "audioData": audio_base64,
                "format": "mp3"
            }
    
    except yt_dlp.utils.DownloadError as e:
        print(f"[YouTube] Error de descarga: {e}")
        raise HTTPException(status_code=400, detail=f"Error al descargar video: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[YouTube] Error extrayendo audio: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/pitch-shift")
async def pitch_shift_audio(request: Request):
    """
    Endpoint para cambiar el pitch (tono) de un audio sin cambiar el tempo.
    Usa pyrubberband para procesamiento de alta calidad.
    """
    try:
        data = await request.json()
        audio_url = data.get('audioUrl')
        semitones = data.get('semitones', 0)
        
        if not audio_url:
            raise HTTPException(status_code=400, detail="audioUrl requerido")
        
        if semitones == 0:
            raise HTTPException(status_code=400, detail="semitones debe ser != 0")
        
        print(f"[PITCH SHIFT] URL: {audio_url}, Semitonos: {semitones}")
        
        # Importar pyrubberband
        try:
            import pyrubberband as pyrb
            import soundfile as sf
        except ImportError:
            raise HTTPException(
                status_code=501, 
                detail="Pitch shift no disponible en este servidor. pyrubberband no está instalado debido a incompatibilidad con Python 3.12."
            )
        
        # Descargar audio
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(audio_url)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Error descargando audio")
            
            audio_data = response.content
        
        # Guardar temporalmente
        temp_dir = Path("temp_pitch")
        temp_dir.mkdir(exist_ok=True)
        
        temp_input = temp_dir / f"input_{uuid.uuid4()}.wav"
        temp_output = temp_dir / f"output_{uuid.uuid4()}.wav"
        
        with open(temp_input, 'wb') as f:
            f.write(audio_data)
        
        # Cargar audio
        y, sr = librosa.load(str(temp_input), sr=None, mono=False)
        print(f"[PITCH SHIFT] Audio cargado: {y.shape}, SR: {sr}")
        
        # Aplicar pitch shift SIN cambiar tempo
        print(f"[PITCH SHIFT] Procesando con pyrubberband...")
        y_shifted = pyrb.pitch_shift(y, sr, n_steps=semitones)
        print(f"[PITCH SHIFT] Procesamiento completado")
        
        # Guardar resultado
        sf.write(str(temp_output), y_shifted.T if len(y_shifted.shape) > 1 else y_shifted, sr)
        
        # Leer archivo procesado
        with open(temp_output, 'rb') as f:
            processed_data = f.read()
        
        # Limpiar archivos temporales
        temp_input.unlink(missing_ok=True)
        temp_output.unlink(missing_ok=True)
        
        # Devolver audio procesado
        return StreamingResponse(
            iter([processed_data]),
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"attachment; filename=pitch_shifted_{semitones}st.wav"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PITCH SHIFT] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
