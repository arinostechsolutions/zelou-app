# Zelou Mobile

Aplicativo React Native com Expo para gestão de condomínio.

## Configuração

1. Instalar dependências:
```bash
npm install
```

2. Configurar variáveis de ambiente:
- Edite `app.config.ts` para ajustar a URL da API

3. Iniciar o app:
```bash
npm start
```

Para Android:
```bash
npm run android
```

Para iOS:
```bash
npm run ios
```

## Estrutura

- `src/api/` - Serviços de API
- `src/components/` - Componentes reutilizáveis
- `src/contexts/` - Contextos React (Auth)
- `src/navigation/` - Configuração de navegação
- `src/screens/` - Telas do aplicativo
  - `Auth/` - Autenticação (Welcome, Login, Register, ForgotPassword)
  - `Home/` - Tela inicial
  - `Deliveries/` - Entregas
  - `Reports/` - Irregularidades
  - `Reservations/` - Reservas
  - `Announcements/` - Comunicados
  - `Visitors/` - Visitantes
  - `Profile/` - Perfil

## Permissões por Role

- **Morador**: Ver entregas, criar irregularidades, reservar áreas, ver comunicados, registrar visitantes
- **Porteiro**: Registrar entregas, confirmar retirada, ver visitantes, liberar entrada/saída
- **Zelador**: Ver irregularidades, atualizar status, criar comunicados, ver entregas
- **Síndico**: Todas as permissões do Zelador + criar regras de áreas, cadastrar unidades/moradores, gerenciar permissões



