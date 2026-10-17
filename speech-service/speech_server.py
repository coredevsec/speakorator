import asyncio
import json
import os
import re
import unicodedata
from contextlib import asynccontextmanager

import numpy as np
from faster_whisper import WhisperModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

MODEL_NAME = os.getenv("WHISPER_MODEL", "base")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.getenv(
        "SPEECH_ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
}
SAMPLE_RATE = 16_000
MAX_WINDOW_SECONDS = 12
MIN_INFERENCE_SECONDS = 1.5
INFERENCE_INTERVAL_SECONDS = 1.25
MAX_SESSION_SECONDS = 20 * 60
MAX_MESSAGE_BYTES = 128_000
LANGUAGES = {"en", "es", "fr", "de", "pt"}
MAX_CONCURRENT_SESSIONS = max(1, int(os.getenv("MAX_CONCURRENT_SESSIONS", "1")))
session_slots = asyncio.Semaphore(MAX_CONCURRENT_SESSIONS)

model: WhisperModel | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global model
    model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE_TYPE)
    yield
    model = None


app = FastAPI(lifespan=lifespan)


def tokenize(text: str) -> list[str]:
    normalized = unicodedata.normalize("NFC", text).lower()
    return re.findall(r"[^\W_]+(?:['’][^\W_]+)*", normalized, flags=re.UNICODE)


def transcribe_window(audio: np.ndarray, language: str) -> list[str]:
    if model is None:
        return []
    segments, _ = model.transcribe(
        audio,
        language=language,
        beam_size=1,
        condition_on_previous_text=False,
        vad_filter=True,
    )
    return [token for segment in segments for token in tokenize(segment.text)]


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "model": MODEL_NAME}


@app.websocket("/ws/speech")
async def speech_socket(websocket: WebSocket) -> None:
    origin = websocket.headers.get("origin", "")
    if origin not in ALLOWED_ORIGINS:
        await websocket.close(code=1008, reason="Origin is not allowed")
        return

    try:
        await asyncio.wait_for(session_slots.acquire(), timeout=0.05)
    except asyncio.TimeoutError:
        await websocket.close(code=1013, reason="Speech capacity is busy")
        return

    audio = np.empty(0, dtype=np.float32)
    received_samples = 0
    last_inference_sample = 0
    language = "en"

    try:
        await websocket.accept()
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break

            packet = message.get("bytes")
            if packet is None:
                control = message.get("text")
                if control is None:
                    continue
                try:
                    command = json.loads(control)
                except json.JSONDecodeError:
                    await websocket.send_json({"error": "Invalid control message"})
                    continue

                if command.get("type") == "start":
                    requested_language = str(command.get("language", "en")).split("-")[0]
                    language = requested_language if requested_language in LANGUAGES else "en"
                    continue
                if command.get("type") == "stop":
                    break
                continue

            if len(packet) > MAX_MESSAGE_BYTES or len(packet) % 2:
                await websocket.send_json({"error": "Invalid audio packet"})
                await websocket.close(code=1009, reason="Invalid audio packet")
                return

            samples = np.frombuffer(packet, dtype="<i2").astype(np.float32) / 32768.0
            received_samples += samples.size
            if received_samples > MAX_SESSION_SECONDS * SAMPLE_RATE:
                await websocket.send_json({"error": "Speech session time limit reached"})
                break

            audio = np.concatenate((audio, samples))
            max_window_samples = MAX_WINDOW_SECONDS * SAMPLE_RATE
            if audio.size > max_window_samples:
                audio = audio[-max_window_samples:]

            samples_since_inference = received_samples - last_inference_sample
            if (
                audio.size >= MIN_INFERENCE_SECONDS * SAMPLE_RATE
                and samples_since_inference >= INFERENCE_INTERVAL_SECONDS * SAMPLE_RATE
                and model is not None
            ):
                tokens = await asyncio.to_thread(transcribe_window, audio.copy(), language)
                last_inference_sample = received_samples
                await websocket.send_json({"tokens": tokens, "final": False})
    except WebSocketDisconnect:
        pass
    except Exception as error:
        try:
            await websocket.send_json({"error": "Speech transcription failed"})
        except RuntimeError:
            pass
        print(f"Speech WebSocket error: {error}", flush=True)
    finally:
        session_slots.release()
        try:
            await websocket.close()
        except RuntimeError:
            pass