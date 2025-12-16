# 🚂 Deploy do Website no Railway

Este guia explica como fazer o deploy do website Next.js no Railway.

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. Backend já deployado no Railway (ou URL do backend)

## 🚀 Passo a Passo

### 1. Preparar o Repositório

Certifique-se de que o código está no seu repositório Git:

```bash
git add .
git commit -m "Preparar para deploy no Railway"
git push
```

### 2. Criar Novo Projeto no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"** (ou GitLab/Bitbucket)
4. Escolha o repositório e a branch
5. Selecione a pasta `website-nextjs` como **Root Directory**

### 3. Configurar Variáveis de Ambiente

No painel do Railway, vá em **Variables** e adicione:

#### Variáveis Obrigatórias:

```env
BACKEND_URL=https://seu-backend.railway.app
NEXT_PUBLIC_BACKEND_URL=https://seu-backend.railway.app
PORT=3001
NODE_ENV=production
```

**Importante:**
- Substitua `https://seu-backend.railway.app` pela URL real do seu backend no Railway
- Se o backend estiver no mesmo projeto Railway, você pode usar a variável de referência: `${{Backend.RAILWAY_PUBLIC_DOMAIN}}`

#### Variáveis Opcionais (se necessário):

```env
NEXT_PUBLIC_API_URL=https://seu-backend.railway.app
```

### 4. Configurar o Build

O Railway detecta automaticamente projetos Next.js, mas você pode configurar:

1. Vá em **Settings** → **Build & Deploy**
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`
4. **Root Directory**: `website-nextjs` (se o projeto estiver em uma subpasta)

### 5. Configurar Domínio

1. No painel do serviço, vá em **Settings** → **Networking**
2. Clique em **Generate Domain** para obter um domínio `.railway.app`
3. Ou adicione um domínio customizado em **Custom Domain**

### 6. Deploy

O Railway fará o deploy automaticamente quando você:
- Fizer push no repositório
- Ou clicar em **Deploy** manualmente

## 🔧 Configuração Avançada

### Usando o Mesmo Projeto Railway

Se o backend e frontend estão no mesmo projeto Railway:

1. Crie dois serviços no mesmo projeto:
   - **Backend** (pasta `backend`)
   - **Website** (pasta `website-nextjs`)

2. Configure as variáveis do Website:
   ```env
   BACKEND_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   NEXT_PUBLIC_BACKEND_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   ```

### Variáveis de Ambiente por Ambiente

Você pode ter diferentes variáveis para produção e staging:

1. Crie um **Environment** para staging
2. Configure variáveis específicas para cada ambiente

## 📝 Checklist de Deploy

- [ ] Código commitado e no repositório Git
- [ ] Projeto criado no Railway
- [ ] Root Directory configurado como `website-nextjs`
- [ ] Variáveis de ambiente configuradas
- [ ] URL do backend correta nas variáveis
- [ ] Domínio configurado (opcional)
- [ ] Deploy realizado com sucesso
- [ ] Website acessível e funcionando

## 🐛 Troubleshooting

### Erro: "Build failed"

- Verifique se todas as dependências estão no `package.json`
- Confira os logs de build no Railway
- Certifique-se de que o Node.js versão está correta (Railway usa a versão do `package.json`)

### Erro: "Cannot connect to backend"

- Verifique se `BACKEND_URL` está configurada corretamente
- Confirme que o backend está rodando e acessível
- Teste a URL do backend manualmente

### Erro: "Port already in use"

- O Railway define a porta automaticamente via variável `PORT`
- Não precisa especificar porta no comando start (já está configurado)

### Imagens não carregam

- Verifique se as imagens estão na pasta `public/`
- Confirme que os caminhos estão corretos (começando com `/`)

## 🔗 Links Úteis

- [Documentação Railway](https://docs.railway.app)
- [Next.js no Railway](https://docs.railway.app/guides/nextjs)
- [Variáveis de Ambiente Railway](https://docs.railway.app/develop/variables)

## 💡 Dicas

1. **Monitoramento**: Use o painel do Railway para monitorar logs e métricas
2. **Rollback**: Railway mantém histórico de deploys, você pode fazer rollback facilmente
3. **CI/CD**: O Railway faz deploy automático a cada push (se configurado)
4. **Custo**: Railway oferece plano gratuito generoso para começar

