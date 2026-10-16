"""
Configuration management for AudioBite.tech / StemNote Studio.
Uses pydantic-settings to validate environment and runtime settings.
"""

from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App & Runtime Settings
    environment: str = "development"
    port: int = 8000
    host: str = "0.0.0.0"
    custom_tech_domain: str = "audiobite.tech"
    
    # AI Runtime Mode: 'cloud' (Google AI Studio / OpenRouter Gemma 4 31B) or 'local' (Ollama Gemma)
    ai_runtime_mode: Literal["cloud", "local"] = "cloud"
    
    # Primary Cloud Route: Google AI Studio Free Tier (No credit card, $0.00)
    gemini_api_key: str = ""
    gemma_cloud_endpoint: str = "https://generativelanguage.googleapis.com/v1beta/openai"
    gemma_cloud_model: str = "gemma-4-26b-a4b-it"
    
    # Secondary Cloud Route: OpenRouter Free Tier ($0.00)
    openrouter_api_key: str = ""
    openrouter_endpoint: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "google/gemma-4-31b-it:free"
    
    # Local Offline Ollama (Local Brain, $0.00)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model_id: str = "gemma2:2b"
    
    # TabPFN Foundation Model (Runs 100% on CPU, $0.00)
    tabpfn_api_key: str = ""
    tabpfn_token: str = ""
    tabpfn_mode: Literal["local", "cloud"] = "local"
    
    # Sentry Observability (Free Developer Tier, $0.00)
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 1.0
    sentry_environment: str = "production"
    
    # Monetization & Telemetry
    checkout_or_waitlist_url: str = "https://www.buymeacoffee.com/kakeroth"
    enable_micro_checkout: bool = True

    # Fast Speech-to-Text Transcription (Groq Cloud Whisper)
    groq_api_key: str = ""
    groq_whisper_model: str = "whisper-large-v3-turbo"

    # Telegram Forwarding Bot Integration
    telegram_bot_token: str = "8921939042:AAGmwSfBApr1Q_oPfhJKvWLPLYYOhfIKBOI"
    telegram_webhook_secret: str = ""

    # WhatsApp Cloud Webhook Integration
    whatsapp_verify_token: str = ""
    whatsapp_api_token: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
