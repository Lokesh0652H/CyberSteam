import os
import logging
import json
import httpx

logger = logging.getLogger("cyberstream.llm_service")

LLM_ENABLED = os.environ.get("LLM_ENABLED", "false").lower() == "true"
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "gemini")
LLM_MODEL = os.environ.get("LLM_MODEL", "gemini-2.5-flash")

def is_enabled() -> bool:
    key = os.environ.get("LLM_API_KEY", LLM_API_KEY)
    enabled = os.environ.get("LLM_ENABLED", "false").lower() == "true"
    return enabled and bool(key)

def get_provider() -> str:
    key = os.environ.get("LLM_API_KEY", LLM_API_KEY)
    provider = os.environ.get("LLM_PROVIDER", LLM_PROVIDER).lower()
    if key.startswith("AQ.") or "gemini" in provider or "google" in provider:
        return "gemini"
    return "openai"

def get_model() -> str:
    provider = get_provider()
    if provider == "gemini":
        return os.environ.get("LLM_MODEL", "gemini-2.5-flash")
    return os.environ.get("LLM_MODEL", "gpt-4o-mini")

async def summarize_alert(alert_data: dict) -> str:
    if not is_enabled():
        return "LLM integration is currently disabled. Set LLM_ENABLED=true and provide an API key."

    provider = get_provider()
    key = os.environ.get("LLM_API_KEY", LLM_API_KEY)
    model = get_model()

    prompt = f"""You are an elite Security Operations Center (SOC) incident responder and Big Data cybersecurity expert analyzing an alert triggered in the CyberStream platform.

Alert Metadata:
{json.dumps(alert_data, indent=2, default=str)}

Provide a concise, professional security incident briefing in Markdown with the following structured sections:
### 🚨 Threat Summary & Attack Vector
(Explain what occurred, the velocity/frequency of events, and identify the attack type such as Distributed Brute Force, Layer 7 DDoS, Port Reconnaissance, Server Error Storm, etc.)

### 🎯 MITRE ATT&CK Classification
(Cite the exact MITRE ATT&CK Tactic and Technique ID, e.g., T1110 for Brute Force, T1498 for Network DoS, T1046 for Network Service Discovery)

### 💥 Blast Radius & Enterprise Impact
(Assess the risk to servers, banking services, or sensitive endpoints involved)

### 🛡️ Immediate Containment Actions (Runbook)
(Provide exact terminal firewall command like `iptables -A INPUT -s <IP> -j DROP`, account lockout, or rate-limiting recommendations)
"""

    if provider == "gemini":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 2048
                }
            }
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code != 200:
                    logger.error(f"Gemini API error {res.status_code}: {res.text}")
                    return f"Gemini API Error ({res.status_code}): {res.text[:200]}"
                data = res.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            logger.error(f"Gemini call failed: {e}")
            return f"Incident analysis error: {str(e)}"
    else:
        # OpenAI Fallback
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=key)
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a specialized SOC cybersecurity incident analyst."},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI call failed: {e}")
            return f"OpenAI incident analysis error: {str(e)}"

async def chat(message: str, context: str = '') -> str:
    if not is_enabled():
        return "LLM assistant is disabled. Set LLM_ENABLED=true and provide an API key in your .env file."

    provider = get_provider()
    key = os.environ.get("LLM_API_KEY", LLM_API_KEY)
    model = get_model()

    system_prompt = """You are CyberCopilot, the intelligent SOC assistant for CyberStream — a high-throughput Big Data streaming analytics platform.
CyberStream uses Apache Kafka, Apache Spark Structured Streaming, Complex Event Processing (CEP) sliding-window rules, HDFS Parquet cold storage, and PostgreSQL/SQLite hot storage.
It monitors enterprise infrastructure including web services, firewalls, and banking portals against cyber threats (Brute Force, DDoS floods, Port Scans, Server 500 Outages, Credential Stuffing).
Provide clear, authoritative, and actionable answers. Use markdown formatting with bullet points and code blocks when appropriate."""

    full_prompt = f"{system_prompt}\n\nContext:\n{context}\n\nUser Question: {message}" if context else f"{system_prompt}\n\nUser Question: {message}"

    if provider == "gemini":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": full_prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.4,
                    "maxOutputTokens": 1000
                }
            }
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code != 200:
                    return f"Gemini API Error ({res.status_code}): {res.text[:200]}"
                data = res.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            return f"Assistant error: {str(e)}"
    else:
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=key)
            response = await client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"OpenAI assistant error: {str(e)}"
