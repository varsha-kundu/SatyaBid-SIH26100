# Lightweight container for the Flask API (Step 1)
FROM python:3.11-slim

WORKDIR /app

# Install system deps (for PDFs/optional OCR later)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app

ENV FLASK_APP=api.py
ENV FLASK_ENV=production

EXPOSE 8000

CMD ["python", "api.py"]