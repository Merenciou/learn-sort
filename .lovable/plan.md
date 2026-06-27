## Objetivo

Fazer o site publicado no Lovable (`learn-sort.lovable.app`) chamar o backend hospedado no Render (`https://algolab-backend-0hao.onrender.com`) sem depender de `.env` no build do Lovable.

## Mudanças

### 1. `src/lib/api-client.ts` — fallback de produção

Substituir a resolução atual de `BASE_URL` por uma cascata:

1. Se `VITE_API_URL` estiver definida no build → usa ela (dev local com `.env`, ou Build Secret se configurado).
2. Senão, se o app estiver rodando em `localhost` / `127.0.0.1` → `http://localhost:8000` (dev sem `.env`).
3. Senão (produção, ex. `learn-sort.lovable.app`) → `https://algolab-backend-0hao.onrender.com`.

Isso garante que:
- Localmente continua usando `localhost:8000`.
- Publicado pelo Lovable, mesmo sem `.env`, aponta para o Render.
- Se um dia mudar o backend, basta sobrescrever via `.env` ou Build Secret sem mexer no código.

### 2. `.env.example` — atualizar URL de referência

Trocar o placeholder `https://SEU-BACKEND.onrender.com` por `https://algolab-backend-0hao.onrender.com` e deixar claro no comentário que essa URL já é o fallback embutido (o `.env` só é necessário se quiser sobrescrever).

### 3. `README.md` — nota curta

Na seção "Publicando o app", adicionar uma linha explicando que a URL do Render já está embutida como fallback em `src/lib/api-client.ts`, então o `Publish` do Lovable já funciona sem precisar configurar `.env` no painel.

### 4. `src/components/PersistencePanel.tsx` — nada a mudar

A nota que avisa sobre cold start do Render já existe e cobre o cenário.

## Como testar depois do Publish

1. Abrir `https://algolab-backend-0hao.onrender.com/docs` — deve mostrar o Swagger (esquenta o cold start).
2. Abrir o site publicado → aba **Persistência** → clicar em **Salvar nos 4 formatos** → tabela comparativa deve aparecer.
