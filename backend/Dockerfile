FROM python:3.11-slim

WORKDIR /app

# Dependências do sistema mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cria diretório de dados (persistência local do container)
RUN mkdir -p /app/data

# Render/Railway/Fly definem $PORT. Default 8000 para rodar local com docker.
ENV PORT=8000
EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
