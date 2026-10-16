"""
Unit tests for WhatsApp & Telegram Forwarding Bot and Transcription Engine.
Verifies:
1. Local fallback transcription produces valid segments and text without crashing.
2. Telegram bot webhook handles /start and voice note payloads gracefully.
3. WhatsApp subscription verification and webhook payload reception.
4. Audio upload endpoint returns transcription data.
"""

import os
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.transcription import transcribe_audio_file

client = TestClient(app)


@pytest.mark.asyncio
async def test_transcription_fallback(tmp_path):
    """Verify local fallback acoustic transcription works when external API keys are omitted."""
    dummy_wav = tmp_path / "test_voice_note.wav"
    dummy_wav.write_bytes(b"RIFF" + b"\x00" * 32000)

    res = await transcribe_audio_file(str(dummy_wav))
    assert "text" in res
    assert len(res["segments"]) >= 1
    assert res["segments"][0]["end"] > res["segments"][0]["start"]
    assert "provider" in res
    assert res["duration_sec"] >= 0


def test_telegram_webhook_start():
    """Verify Telegram /start returns welcome info."""
    payload = {
        "update_id": 10001,
        "message": {
            "message_id": 1,
            "chat": {"id": 999999, "type": "private"},
            "text": "/start"
        }
    }
    response = client.post("/api/webhooks/telegram", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "status" in data


def test_whatsapp_webhook_verification():
    """Verify WhatsApp Cloud API GET challenge verification."""
    response = client.get(
        "/api/webhooks/whatsapp",
        params={
            "hub.mode": "subscribe",
            "hub.challenge": "123456789",
            "hub.verify_token": "audiobite_verify"
        }
    )
    assert response.status_code == 200
    assert response.text == "123456789"


def test_whatsapp_webhook_verification_invalid_token():
    """Verify WhatsApp Cloud API rejects invalid verification tokens."""
    response = client.get(
        "/api/webhooks/whatsapp",
        params={
            "hub.mode": "subscribe",
            "hub.challenge": "123456789",
            "hub.verify_token": "wrong_token"
        }
    )
    assert response.status_code == 403


def test_whatsapp_webhook_post():
    """Verify WhatsApp incoming audio message POST is accepted."""
    payload = {
        "object": "whatsapp_business_account",
        "entry": [{
            "id": "1001",
            "changes": [{
                "value": {
                    "messaging_product": "whatsapp",
                    "messages": [{
                        "from": "15551234567",
                        "id": "wamid.test",
                        "type": "audio",
                        "audio": {"id": "media_123"}
                    }]
                }
            }]
        }]
    }
    response = client.post("/api/webhooks/whatsapp", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "received"


def test_upload_audio_with_transcription(tmp_path):
    """Verify upload audio endpoint runs transcription and returns segments."""
    wav_content = b"RIFF" + b"\x00" * 32000
    files = {"file": ("test_client_audio.wav", wav_content, "audio/wav")}
    response = client.post("/api/upload-audio", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "uploaded"
    assert "transcript" in data
    assert "transcription_provider" in data
    assert "segments" in data
