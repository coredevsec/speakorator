FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/models

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 speech

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY speech_server.py ./speech_server.py
RUN mkdir -p /models && chown -R speech:speech /app /models

USER speech
EXPOSE 8000
CMD ["uvicorn", "speech_server:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]