# Zelou Website - Next.js

Website oficial do Zelou construído com Next.js 14.

## 🚀 Como usar

### 1. Instalar dependências

```bash
cd website-nextjs
npm install
```

### 2. Configurar variáveis de ambiente (opcional)

Copie o arquivo `.env.example` para `.env.local` e ajuste se necessário:

```bash
cp .env.example .env.local
```

### 3. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

O site estará disponível em `http://localhost:3001`

**Importante:** 
- Backend deve estar rodando em `http://localhost:3000`
- Frontend (Next.js) roda em `http://localhost:3001`
- Configure a variável `NEXT_PUBLIC_BACKEND_URL=http://localhost:3000` se necessário

### 3. Build para produção

```bash
npm run build
npm start
```

## 📁 Estrutura

```
website-nextjs/
├── app/                    # App Router do Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   ├── servicos/          # Página de serviços
│   ├── como-usar/         # Página como usar
│   ├── precos/            # Página de preços
│   ├── politica-privacidade/  # Política de privacidade
│   ├── termos-uso/        # Termos de uso
│   └── contato/           # Página de contato
├── components/            # Componentes reutilizáveis
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── Services.tsx
│   ├── Features.tsx
│   └── CTA.tsx
└── app/globals.css        # Estilos globais
```

## 🔗 Integração com Backend

O Next.js está configurado para fazer proxy das requisições `/api/*` para o backend em `http://localhost:3000` (configurado em `next.config.js`).

As páginas de Política de Privacidade e Termos de Uso buscam conteúdo do backend através das rotas:
- `/api/legal/privacy-policy`
- `/api/legal/terms-of-use`

## 🎨 Estilos

Os estilos estão organizados em:
- `app/globals.css` - Estilos globais e variáveis CSS
- `components/*.css` - Estilos específicos de cada componente
- `app/*/page.css` - Estilos específicos de cada página

## 📦 Deploy

O site pode ser deployado em:
- **Vercel** (recomendado para Next.js)
- **Railway** - Veja [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) para instruções detalhadas
- **Netlify**
- Qualquer plataforma que suporte Next.js

### 🚂 Deploy no Railway

Para fazer deploy no Railway, consulte o guia completo em [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md).

**Resumo rápido:**
1. Conecte seu repositório Git ao Railway
2. Configure o Root Directory como `website-nextjs`
3. Adicione as variáveis de ambiente:
   - `BACKEND_URL` - URL do backend
   - `NEXT_PUBLIC_BACKEND_URL` - URL do backend (para o cliente)
4. O Railway fará o deploy automaticamente

## 🔧 Configuração

### Variáveis de Ambiente (opcional)

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

