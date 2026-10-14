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
    
    # AI Runtime Mode: 'cloud' (DigitalOcean Serverless Gemma) or 'local' (Ollama Gemma)
    ai_runtime_mode: Literal["cloud", "local"] = "local"
    
    # DigitalOcean Serverless Inference (Cloud Brain)
    do_inference_api_key: str = ""
    do_model_endpoint: str = "https://inference.do-ai.run/v1"
    do_model_id: str = "google-gemma-4-31b-it"
    
    # Local Offline Ollama (Local Brain)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model_id: str = "gemma2:2b"
    
    # TabPFN Foundation Model
    tabpfn_api_key: str = ""
    tabpfn_token: str = ""
    tabpfn_mode: Literal["local", "cloud"] = "local"
    
    # Sentry Observability
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 1.0
    sentry_environment: str = "production"
    
    # Monetization & Telemetry
    checkout_or_waitlist_url: str = "https://www.buymeacoffee.com/kakeroth"
    enable_micro_checkout: bool = True
    
    # Hugging Face
    hf_token: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
