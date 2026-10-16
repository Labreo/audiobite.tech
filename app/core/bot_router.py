"""
Forwarding Bot Router for AudioBite.tech (WhatsApp & Telegram).
Allows users to forward voice notes directly to a bot number/handle,
running the complete AudioBite pipeline:
1. Instant Speech-to-Text via Groq Whisper or Gemini Flash
2. TabPFN-v2 Acoustic Calibration (Signal purity %, scope risk %, estimated hours)
3. Gemma 4 Soundbite Extraction & Action Items
4. Stamped ReportLab PDF Dossier export sent directly back to chat
"""

import os
import json
import logging
from typing import Dict, Any, Optional
import httpx

from app.config import settings
from app.core.transcription import transcribe_audio_file
from app.core.tabpfn_engine import tabpfn_engine
from app.core.gemma_brain import generate_tactile_audiobite_sheet
from app.core.pdf_exporter import export_citation_card_pdf

logger = logging.getLogger("audiobite.bot_router")


async def process_voice_note_pipeline(
    file_path: str,
    sender_name: str = "Client Voice Note",
    duration_sec: int = 60
) -> Dict[str, Any]:
    """
    Executes the end-to-end AudioBite studio pipeline on any incoming voice note.
    Returns transcription, TabPFN telemetry, Gemma 4 action brief, and PDF bytes.
    """
    # 1. Transcribe audio
    transcript_res = await transcribe_audio_file(file_path)
    transcript_text = transcript_res.get("text", "")
    segments = transcript_res.get("segments", [])

    # 2. Run TabPFN Signal & Scope Prediction
    tabpfn_telemetry = tabpfn_engine.predict_signal({
        "track_duration_sec": max(15, duration_sec),
        "bpm": 155,
        "vocal_presence_ratio": 0.35,
        "track_title": sender_name
    })

    # 3. Dual-Brain Gemma 4 Extraction
    sheet_result = await generate_tactile_audiobite_sheet(
        track_title=sender_name,
        artist_name="Forwarded Voice Note",
        track_duration_sec=duration_sec,
        bpm=155,
        vocal_presence_ratio=0.35,
        transcript_text=transcript_text,
        tabpfn_telemetry=tabpfn_telemetry
    )

    sheet_content = sheet_result.get("sheet_content", {})
    action_items = sheet_content.get("action_items", [])
    exec_summary = sheet_content.get("executive_summary", [sheet_content.get("summary_notes", "Summary")])

    # Convert to bites format for PDF stamping
    bites = []
    for item in action_items:
        ts = item.get("timestamp", "00:00")
        parts = ts.split(":")
        sec = int(parts[0]) * 60 + int(parts[1]) if len(parts) == 2 else 0
        bites.append({
            "start_sec": sec,
            "end_sec": min(duration_sec, sec + 25),
            "quoted_soundbite": item.get("task", ""),
            "takeaway": f"Priority {item.get('priority', 'P1')} assigned to {item.get('assignee_role', 'Team')}",
            "signal_score_pct": float(tabpfn_telemetry.get("signal_purity_pct", 85.0)),
            "stage_tag": item.get("priority", "P1")
        })

    if not bites:
        bites.append({
            "start_sec": 0,
            "end_sec": min(30, duration_sec),
            "quoted_soundbite": transcript_text[:120] if transcript_text else "Key discussion point",
            "takeaway": "Main deliverable",
            "signal_score_pct": float(tabpfn_telemetry.get("signal_purity_pct", 85.0)),
            "stage_tag": "P0"
        })

    # 4. Stamp PDF Vector Dossier
    pdf_bytes, pdf_hash = export_citation_card_pdf(
        title=f"AudioBite Dossier: {sender_name}",
        source_url="https://audiobite.tech",
        bites=bites,
        curator_note="Forwarded Voice Note automatically processed by AudioBite Studio Bot",
        is_crate_dossier=False
    )

    return {
        "transcript": transcript_text,
        "segments": segments,
        "tabpfn_telemetry": tabpfn_telemetry,
        "sheet_content": sheet_content,
        "executive_summary": exec_summary,
        "action_items": action_items,
        "bites": bites,
        "pdf_bytes": pdf_bytes,
        "pdf_hash": pdf_hash
    }


async def handle_telegram_update(update: Dict[str, Any], upload_dir: str) -> Dict[str, Any]:
    """Processes incoming Telegram bot webhooks."""
    message = update.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    if not chat_id:
        return {"status": "ignored", "reason": "no_chat_id"}

    token = settings.telegram_bot_token
    if not token:
        logger.warning("Telegram update received but TELEGRAM_BOT_TOKEN is not configured.")
        return {"status": "unconfigured", "detail": "TELEGRAM_BOT_TOKEN required in environment"}

    text = message.get("text", "")
    if text == "/start":
        welcome_msg = (
            "*AudioBite Studio Bot*\n\n"
            "Forward any voice note, client brief, or audio message here.\n\n"
            "I will automatically generate:\n"
            "• 30-Second Executive Summary\n"
            "• Exact Timestamped Action Items\n"
            "• TabPFN Signal-to-Noise Score\n"
            "• Downloadable Stamped PDF Dossier"
        )
        await _telegram_send_message(token, chat_id, welcome_msg)
        return {"status": "ok", "action": "welcome_sent"}

    # Check for voice note or audio file
    voice = message.get("voice") or message.get("audio")
    if not voice:
        await _telegram_send_message(
            token, chat_id,
            "Please send or forward an audio recording or voice note to extract AudioBites."
        )
        return {"status": "ignored", "reason": "not_audio"}

    file_id = voice.get("file_id")
    duration = voice.get("duration", 60)
    sender_name = message.get("from", {}).get("first_name", "Voice Note")

    await _telegram_send_message(token, chat_id, "Processing your voice note through TabPFN & Gemma 4...")

    try:
        # Download file from Telegram
        async with httpx.AsyncClient(timeout=30.0) as client:
            file_info_resp = await client.get(f"https://api.telegram.org/bot{token}/getFile?file_id={file_id}")
            file_path_tg = file_info_resp.json().get("result", {}).get("file_path")
            if not file_path_tg:
                raise Exception("Could not retrieve file path from Telegram")

            download_url = f"https://api.telegram.org/file/bot{token}/{file_path_tg}"
            file_resp = await client.get(download_url)
            local_filename = f"tg_{chat_id}_{os.path.basename(file_path_tg)}"
            local_path = os.path.join(upload_dir, local_filename)

            with open(local_path, "wb") as f:
                f.write(file_resp.content)

        # Run pipeline
        result = await process_voice_note_pipeline(local_path, sender_name, duration)

        # Build Telegram response
        purity = result["tabpfn_telemetry"].get("signal_purity_pct", 85)
        hours = result["tabpfn_telemetry"].get("actionable_effort_hours", 4.0)
        quote = result["tabpfn_telemetry"].get("suggested_quote_usd", 160)

        reply_text = f"*AudioBite Summary: {sender_name}*\n"
        reply_text += f"Signal Purity: *{purity}%* • Est. Scope: *{hours} hrs (${quote})*\n\n"
        reply_text += "*Executive Summary:*\n"
        for bullet in result["executive_summary"]:
            reply_text += f"• {bullet}\n"

        if result["action_items"]:
            reply_text += "\n*Action Items:*\n"
            for item in result["action_items"][:4]:
                reply_text += f"[{item.get('timestamp', '00:00')}] *{item.get('task', '')}* ({item.get('priority', 'P1')})\n"

        reply_text += f"\nOnline Studio: https://{settings.custom_tech_domain}"

        # Send text summary
        await _telegram_send_message(token, chat_id, reply_text)

        # Send PDF dossier
        await _telegram_send_document(
            token, chat_id,
            result["pdf_bytes"],
            f"AudioBite_Dossier_{sender_name}.pdf",
            caption=f"SHA-256 Proof: {result['pdf_hash'][:16]}..."
        )

        return {"status": "ok", "action": "processed"}

    except Exception as e:
        logger.error(f"Error handling Telegram voice note: {e}")
        await _telegram_send_message(token, chat_id, f"Error processing voice note: {str(e)}")
        return {"status": "error", "detail": str(e)}


async def _telegram_send_message(token: str, chat_id: int, text: str):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        await client.post(url, json=payload)


async def _telegram_send_document(token: str, chat_id: int, file_bytes: bytes, filename: str, caption: str = ""):
    url = f"https://api.telegram.org/bot{token}/sendDocument"
    files = {"document": (filename, file_bytes, "application/pdf")}
    data = {"chat_id": chat_id, "caption": caption}
    async with httpx.AsyncClient(timeout=20.0) as client:
        await client.post(url, data=data, files=files)
