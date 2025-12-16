# 🚀 Setup Rápido no Railway (Interface Web)

Guia rápido para configurar o website diretamente na interface do Railway.

## ⚡ Passos Rápidos

### 1. Criar Novo Serviço

1. No seu projeto Railway existente, clique em **"+ New"** → **"GitHub Repo"** (ou GitLab/Bitbucket)
2. Selecione seu repositório
3. Na tela de configuração:
   - **Root Directory**: Digite `website-nextjs`
   - Deixe o Railway detectar automaticamente (Next.js)

### 2. Configurar Variáveis de Ambiente

1. No serviço criado, vá em **"Variables"** (aba lateral)
2. Clique em **"+ New Variable"** e adicione:

```
BACKEND_URL = [URL do seu backend no Railway]
```

**Dica:** Se o backend está no mesmo projeto Railway:
- Clique em **"Reference Variable"**
- Selecione o serviço do backend
- Escolha `RAILWAY_PUBLIC_DOMAIN` ou `RAILWAY_TUNNEL_URL`
- Isso criará automaticamente: `${{Backend.RAILWAY_PUBLIC_DOMAIN}}`

3. Adicione também:

```
NEXT_PUBLIC_BACKEND_URL = [mesma URL do backend]
NODE_ENV = production
```

### 3. Configurar Build (Opcional)

1. Vá em **"Settings"** → **"Build & Deploy"**
2. Verifique se está configurado:
   - **Build Command**: `npm run build` (já vem por padrão)
   - **Start Command**: `npm start` (já vem por padrão)
   - **Root Directory**: `website-nextjs`

### 4. Gerar Domínio

1. Vá em **"Settings"** → **"Networking"**
2. Clique em **"Generate Domain"** para obter um domínio `.railway.app`
3. Ou adicione um domínio customizado em **"Custom Domain"**

### 5. Deploy

O Railway fará o deploy automaticamente! Você pode:
- Ver o progresso na aba **"Deployments"**
- Ver os logs em tempo real na aba **"Deploy Logs"**
- Acessar o site pelo domínio gerado

## 🎯 Configuração Mínima Necessária

**Variáveis obrigatórias:**
- `BACKEND_URL` - URL do seu backend
- `NEXT_PUBLIC_BACKEND_URL` - URL do backend (para o cliente)

**O resto o Railway faz automaticamente!**

## 💡 Dicas

1. **Usar variáveis de referência:** Se backend e frontend estão no mesmo projeto, use `${{Backend.RAILWAY_PUBLIC_DOMAIN}}` ao invés de URL fixa
2. **Logs em tempo real:** Acompanhe o build e deploy na aba "Deploy Logs"
3. **Rollback fácil:** Se algo der errado, vá em "Deployments" e clique em "Redeploy" em um deploy anterior
4. **Health Checks:** O Railway monitora automaticamente se o serviço está rodando

## 🔍 Verificar se Está Funcionando

1. Acesse o domínio gerado
2. Verifique se o site carrega
3. Teste as páginas que fazem requisições ao backend (ex: Política de Privacidade)
4. Veja os logs se houver algum erro

## 🐛 Problemas Comuns

**Site não carrega:**
- Verifique os logs em "Deploy Logs"
- Confirme que as variáveis de ambiente estão corretas
- Verifique se o build foi concluído com sucesso

**Erro de conexão com backend:**
- Confirme que `BACKEND_URL` está correto
- Teste a URL do backend manualmente
- Verifique se o backend está rodando

**Build falha:**
- Veja os logs completos
- Confirme que o Root Directory está como `website-nextjs`
- Verifique se todas as dependências estão no `package.json`

