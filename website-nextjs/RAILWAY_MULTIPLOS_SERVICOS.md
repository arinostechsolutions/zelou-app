# 🚂 Configurar Website no Mesmo Projeto Railway

Como adicionar o website-nextjs como segundo serviço no projeto Railway existente.

## 📋 Situação Atual

Você já tem:
- **Projeto Railway:** `zelou-app`
- **Serviço 1:** Backend (Root Directory: `backend`)
- **Estrutura GitHub:**
  ```
  zelou-app/
    ├── backend/
    ├── mobile/
    └── website-nextjs/
  ```

## 🎯 Objetivo

Adicionar um **segundo serviço** no mesmo projeto para o website.

## ⚡ Passos na Interface do Railway

### 1. Adicionar Novo Serviço

1. No seu projeto `zelou-app` no Railway
2. Clique em **"+ New"** (canto superior direito ou no menu lateral)
3. Selecione **"GitHub Repo"** (ou a opção do seu provedor Git)
4. **IMPORTANTE:** Selecione o **mesmo repositório** `zelou-app`
5. O Railway vai perguntar se você quer adicionar ao projeto existente - confirme

### 2. Configurar Root Directory

1. Na tela de configuração do novo serviço, procure por **"Root Directory"** ou **"Configure"**
2. Digite: `website-nextjs`
3. O Railway vai detectar automaticamente que é um projeto Next.js

### 3. Configurar Variáveis de Ambiente

1. No novo serviço criado, vá em **"Variables"**
2. Clique em **"+ New Variable"**

#### Opção 1: Usar Referência ao Backend (RECOMENDADO)

1. Clique em **"Reference Variable"** (ou ícone de link)
2. Selecione o serviço do **Backend**
3. Escolha `RAILWAY_PUBLIC_DOMAIN` ou `RAILWAY_TUNNEL_URL`
4. Isso criará automaticamente: `${{Backend.RAILWAY_PUBLIC_DOMAIN}}`

Adicione duas variáveis usando referência:
- **Variable Name:** `BACKEND_URL`
  - **Value:** `${{Backend.RAILWAY_PUBLIC_DOMAIN}}` (ou clique em Reference Variable)

- **Variable Name:** `NEXT_PUBLIC_BACKEND_URL`
  - **Value:** `${{Backend.RAILWAY_PUBLIC_DOMAIN}}` (ou clique em Reference Variable)

#### Opção 2: URL Manual

Se preferir usar URL manual:
- `BACKEND_URL` = `https://seu-backend.railway.app`
- `NEXT_PUBLIC_BACKEND_URL` = `https://seu-backend.railway.app`

### 4. Configurar Build (Verificar)

1. Vá em **"Settings"** → **"Build & Deploy"**
2. Verifique:
   - **Root Directory:** `website-nextjs` ✅
   - **Build Command:** `npm run build` (já vem por padrão)
   - **Start Command:** `npm start` (já vem por padrão)

### 5. Gerar Domínio

1. Vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"**
3. Você terá um domínio como: `website-production-xxxx.up.railway.app`

### 6. Deploy Automático

O Railway fará o deploy automaticamente! Você pode:
- Ver o progresso em **"Deployments"**
- Acompanhar logs em **"Deploy Logs"**

## 📊 Estrutura Final no Railway

Após configurar, você terá:

```
Projeto: zelou-app
├── Serviço 1: Backend
│   ├── Root Directory: backend
│   └── Domínio: backend-production-xxxx.up.railway.app
│
└── Serviço 2: Website (novo)
    ├── Root Directory: website-nextjs
    ├── Variáveis:
    │   ├── BACKEND_URL = ${{Backend.RAILWAY_PUBLIC_DOMAIN}}
    │   └── NEXT_PUBLIC_BACKEND_URL = ${{Backend.RAILWAY_PUBLIC_DOMAIN}}
    └── Domínio: website-production-xxxx.up.railway.app
```

## ✅ Vantagens de Usar Referência

1. **Automático:** Se o domínio do backend mudar, o website atualiza automaticamente
2. **Sem configuração manual:** Não precisa copiar URLs
3. **Mais seguro:** Railway gerencia as conexões internas

## 🔍 Verificar se Está Funcionando

1. Acesse o domínio gerado para o website
2. Teste uma página que faz requisição ao backend (ex: Política de Privacidade)
3. Veja os logs se houver algum erro

## 🐛 Problemas Comuns

**Erro: "Cannot find module"**
- Verifique se o Root Directory está como `website-nextjs`
- Confirme que o código foi commitado e está no repositório

**Erro: "Cannot connect to backend"**
- Verifique se as variáveis de referência estão corretas
- Confirme que o serviço do backend está rodando
- Teste acessar a URL do backend manualmente

**Build falha:**
- Veja os logs completos em "Deploy Logs"
- Confirme que todas as dependências estão no `package.json`

## 💡 Dica Extra

Você pode renomear os serviços no Railway para ficar mais organizado:
- Clique no nome do serviço → **"Settings"** → **"Service Name"**
- Exemplo: "Backend" e "Website"

