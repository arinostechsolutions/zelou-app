# Zelou Backend API

Backend REST API para aplicativo de gestão de condomínio.

## Configuração

1. Instalar dependências:
```bash
npm install
```

2. Criar arquivo `.env.development` baseado em `env.template`:
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb+srv://SEU_USUARIO:SUA_SENHA@SEU_CLUSTER.mongodb.net/zelou-dev?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
```

**Importante:** Use `zelou-dev` como nome do database para desenvolvimento e `zelou-prod` para produção. Ambos podem usar o mesmo cluster do MongoDB Atlas!

3. Iniciar servidor:
```bash
npm run dev
```

## Estrutura

- `models/` - Modelos MongoDB (User, Delivery, Report, Area, Reservation, Announcement, Visitor)
- `routes/` - Rotas da API
- `middleware/` - Middlewares de autenticação e autorização
- `server.js` - Arquivo principal do servidor

## Autenticação

Todas as rotas (exceto `/api/auth/*`) exigem token JWT no header:
```
Authorization: Bearer <token>
```

## Documentação da API

Importe o arquivo `API_Insomnia.json` no Insomnia para ter todas as rotas prontas para testar.



