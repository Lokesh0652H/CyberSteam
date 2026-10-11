FROM python:3.11-slim

WORKDIR /app

COPY streaming /app/streaming
COPY simulator /app/simulator
ENV PYTHONPATH=/app/streaming:/app

RUN pip install --no-cache-dir kafka-python

CMD ["python", "-m", "producers.producer"]
