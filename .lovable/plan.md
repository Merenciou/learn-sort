## O problema

O Lovable publica só o frontend (Cloudflare Workers/TS). O backend FastAPI em `backend/` é Python — **não roda no Lovable**. Para o professor testar de qualquer lugar, o Python precisa estar hospedado em algum lugar público, e o frontend publicado precisa apontar para essa URL pública via `VITE_API_URL`.

## Opções (escolha uma)

### Opção A — Hospedar o backend em nuvem grátis (recomendado)

Sobe o `backend/` em um serviço gratuito que aceita Python/FastAPI, e o frontend publicado no Lovable consome essa URL. Professor só abre o link do Lovable e tudo funciona.

Serviços que funcionam bem para FastAPI no plano grátis:

| Serviço | Prós | Contras |
|---|---|---|
| **Render** | Deploy via GitHub, free tier, suporta FastAPI nativo | "Cold start" de ~30s após inatividade |
| **Railway** | Muito simples, deploy por GitHub | Free tier limitado (créditos mensais) |
| **Fly.io** | Rápido, global | Pede cartão para verificar (não cobra) |
| **Hugging Face Spaces (Docker/FastAPI)** | 100% grátis, sem cartão | Menos "profissional", mas funciona |

Fluxo:
1. Adiciono ao projeto: `backend/Dockerfile` + `backend/.dockerignore` + ajuste de CORS para liberar o domínio publicado do Lovable + variável `PORT` lida do ambiente.
2. Adiciono `.env.example` no frontend com `VITE_API_URL=https://SEU-BACKEND.onrender.com`.
3. Atualizo `README.md` com passo a passo de deploy no serviço escolhido (com prints/comandos).
4. Você sobe o backend uma vez, copia a URL, define `VITE_API_URL` e publica o frontend pelo Lovable.
5. Professor abre o link publicado e usa a aba **Persistência** normalmente.

### Opção B — Backend rodando na sua máquina + túnel público (Cloudflare Tunnel / ngrok)

Você roda `uvicorn` localmente e expõe via túnel. Frontend publicado aponta para a URL do túnel. Funciona só enquanto seu PC estiver ligado — bom para a apresentação, ruim para "deixar o professor testar quando quiser".

### Opção C — Portar tudo para TypeScript (sem Python)

Reescrevo os 4 stores em TS como `createServerFn` no próprio Lovable. Vantagem: tudo publica junto, zero infraestrutura externa. Desvantagem: descaracteriza o trabalho — o critério pede persistência em **Python** (json/csv/pickle/struct). `pickle` e `struct` não têm equivalente nativo direto em JS; teria que simular. **Não recomendo** se o trabalho exige Python.

### Opção D — Empacotar backend como executável (.exe) para o professor rodar localmente

Gero um `.exe` (PyInstaller) que o professor baixa e abre — sobe `localhost:8000` sozinho. Frontend publicado aponta para `localhost:8000`. Funciona, mas o professor precisa rodar o executável e confiar nele (Windows pode bloquear).

## Minha recomendação

**Opção A com Render** — é o caminho mais limpo: link único do Lovable, sem PC ligado, sem `.exe`, mantém o backend Python íntegro. O cold start é aceitável para uma avaliação.

Se aprovar, preciso saber:
1. Qual serviço de hospedagem do backend você prefere (Render / Railway / Fly / HF Spaces / outro)?
2. Você já tem o projeto no GitHub? (Render/Railway puxam de lá.)
3. O `VITE_API_URL` final você define quando souber a URL do backend, ou quer que eu já deixe um placeholder no README?

## O que vou gerar quando aprovar

- `backend/Dockerfile` e `backend/.dockerignore`
- Ajuste em `backend/main.py`: CORS dinâmico (env var `ALLOWED_ORIGINS`) e `PORT` do ambiente
- `backend/render.yaml` (ou `railway.json` / `fly.toml` conforme escolha)
- `.env.example` na raiz com `VITE_API_URL=`
- Seção "Deploy do backend" no `README.md` com o passo a passo do serviço escolhido
- Banner mais claro no `PersistencePanel` quando `VITE_API_URL` não estiver setado
