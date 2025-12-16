# 🌐 Conectar Domínio GoDaddy ao Railway

Guia completo para conectar seu domínio do GoDaddy aos serviços do Railway.

## 📋 Pré-requisitos

1. Domínio registrado no GoDaddy
2. Acesso ao painel do GoDaddy
3. Serviços já deployados no Railway

## 🎯 Opções de Configuração

Você pode configurar de duas formas:

### Opção 1: Domínio Principal (Recomendado)
- `zelou.com.br` → Website
- `api.zelou.com.br` → Backend

### Opção 2: Subdomínios Separados
- `www.zelou.com.br` → Website
- `api.zelou.com.br` → Backend

## 🚀 Passo a Passo

### Parte 1: Configurar no Railway

#### Para o Website:

1. No serviço do **Website** no Railway
2. Vá em **"Settings"** → **"Networking"**
3. Em **"Custom Domain"**, clique em **"Add Custom Domain"**
4. Digite seu domínio (ex: `zelou.com.br` ou `www.zelou.com.br`)
5. O Railway mostrará as instruções de DNS

#### Para o Backend (API):

1. No serviço do **Backend** no Railway
2. Vá em **"Settings"** → **"Networking"**
3. Em **"Custom Domain"**, clique em **"Add Custom Domain"**
4. Digite o subdomínio da API (ex: `api.zelou.com.br`)
5. Anote as instruções de DNS

### Parte 2: Configurar DNS no GoDaddy

1. Acesse [GoDaddy.com](https://godaddy.com) e faça login
2. Vá em **"Meus Produtos"** → Selecione seu domínio
3. Clique em **"DNS"** ou **"Gerenciar DNS"**

#### Configuração para Website (zelou.com.br)

**Cenário A: Domínio raiz (zelou.com.br) → Website**

1. Procure por um registro do tipo **A** ou **CNAME** para `@` ou raiz
2. Se não existir, clique em **"Adicionar"** ou **"+ Adicionar Registro"**
3. Configure:
   - **Tipo:** `CNAME` (recomendado) ou `A`
   - **Nome/Host:** `@` ou deixe em branco (para domínio raiz)
   - **Valor/Points to:** Cole o valor fornecido pelo Railway
     - Exemplo: `website-production-xxxx.up.railway.app`
   - **TTL:** 600 (ou deixe padrão)

**Cenário B: Subdomínio www (www.zelou.com.br) → Website**

1. Clique em **"Adicionar"** ou **"+ Adicionar Registro"**
2. Configure:
   - **Tipo:** `CNAME`
   - **Nome/Host:** `www`
   - **Valor/Points to:** Cole o valor fornecido pelo Railway
   - **TTL:** 600

#### Configuração para Backend (api.zelou.com.br)

1. Clique em **"Adicionar"** ou **"+ Adicionar Registro"**
2. Configure:
   - **Tipo:** `CNAME`
   - **Nome/Host:** `api`
   - **Valor/Points to:** Cole o valor fornecido pelo Railway para o backend
     - Exemplo: `backend-production-xxxx.up.railway.app`
   - **TTL:** 600

### Parte 3: Configuração Completa (Exemplo)

Se você quer:
- `zelou.com.br` → Website
- `www.zelou.com.br` → Website (redireciona para zelou.com.br)
- `api.zelou.com.br` → Backend

#### Registros DNS no GoDaddy:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| CNAME | @ | website-production-xxxx.up.railway.app | 600 |
| CNAME | www | website-production-xxxx.up.railway.app | 600 |
| CNAME | api | backend-production-xxxx.up.railway.app | 600 |

**Nota:** O GoDaddy pode usar nomes diferentes:
- **Nome/Host** pode ser `@` para raiz, ou deixar em branco
- **Valor** pode ser "Points to" ou "Aponta para"

### Parte 4: Atualizar Variáveis de Ambiente

Após configurar o domínio, atualize as variáveis de ambiente:

#### No Serviço do Website:

1. Vá em **"Variables"**
2. Atualize `NEXT_PUBLIC_BACKEND_URL`:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://api.zelou.com.br
   ```

#### No Serviço do Backend (se necessário):

1. Verifique se há variáveis que precisam do domínio do website
2. Atualize conforme necessário

### Parte 5: SSL/HTTPS

O Railway configura SSL automaticamente via Let's Encrypt:
- Aguarde alguns minutos após configurar o DNS
- O Railway detecta automaticamente e configura o certificado SSL
- Você verá um ícone de cadeado quando estiver pronto

## ⏱️ Tempo de Propagação DNS

- **Normal:** 5-30 minutos
- **Máximo:** Até 48 horas (raro)
- **Verificar:** Use [whatsmydns.net](https://www.whatsmydns.net) para verificar propagação

## ✅ Verificar se Está Funcionando

### 1. Verificar DNS

Use ferramentas online:
- [whatsmydns.net](https://www.whatsmydns.net)
- [dnschecker.org](https://dnschecker.org)

Digite seu domínio e verifique se aponta para o Railway.

### 2. Verificar no Railway

1. No serviço, vá em **"Settings"** → **"Networking"**
2. Verifique o status do domínio:
   - ✅ **Active** = Funcionando
   - ⏳ **Pending** = Aguardando DNS/propagação
   - ❌ **Failed** = Verifique as configurações DNS

### 3. Testar Acesso

1. Acesse `https://zelou.com.br` (ou seu domínio)
2. Teste `https://api.zelou.com.br` (se configurado)
3. Verifique se o SSL está ativo (cadeado verde no navegador)

## 🐛 Problemas Comuns

### Domínio não resolve

**Sintomas:** Erro "DNS_PROBE_FINISHED_NXDOMAIN" ou página não carrega

**Soluções:**
1. Verifique se os registros DNS estão corretos no GoDaddy
2. Aguarde a propagação DNS (pode levar até 48h)
3. Limpe o cache DNS do seu computador:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache
   ```

### SSL não funciona

**Sintomas:** Site carrega mas mostra "Não seguro"

**Soluções:**
1. Aguarde alguns minutos (Railway configura SSL automaticamente)
2. Verifique se o DNS está propagado corretamente
3. No Railway, verifique se o domínio está como "Active"
4. Tente acessar via HTTP primeiro, depois HTTPS

### Erro 502 Bad Gateway

**Sintomas:** Domínio resolve mas mostra erro 502

**Soluções:**
1. Verifique se o serviço está rodando no Railway
2. Veja os logs do serviço em "Deploy Logs"
3. Verifique se o domínio está apontando para o serviço correto

### Domínio aponta para lugar errado

**Sintomas:** Acessa o domínio mas mostra outro site

**Soluções:**
1. Verifique se o CNAME está correto no GoDaddy
2. Confirme que está usando o domínio correto do Railway
3. Aguarde a propagação DNS completa

## 📝 Checklist Completo

- [ ] Domínio adicionado no Railway (Website)
- [ ] Domínio adicionado no Railway (Backend/API)
- [ ] Registros DNS configurados no GoDaddy
- [ ] DNS propagado (verificado em whatsmydns.net)
- [ ] SSL ativo (cadeado verde)
- [ ] Variáveis de ambiente atualizadas
- [ ] Website acessível via domínio
- [ ] API acessível via subdomínio
- [ ] Testado em diferentes navegadores

## 🔒 Segurança

1. **Sempre use HTTPS:** O Railway configura SSL automaticamente
2. **Não compartilhe credenciais:** Mantenha senhas seguras
3. **Monitore logs:** Acompanhe acessos suspeitos

## 💡 Dicas

1. **Use CNAME ao invés de A:** Mais flexível e fácil de gerenciar
2. **TTL baixo durante configuração:** Use 600 segundos, depois pode aumentar
3. **Teste localmente primeiro:** Use o domínio `.railway.app` para testar antes
4. **Documente suas configurações:** Anote os valores para referência futura

## 🆘 Suporte

Se tiver problemas:
1. Verifique os logs do Railway
2. Consulte a [documentação do Railway sobre domínios](https://docs.railway.app/develop/custom-domains)
3. Entre em contato com o suporte do Railway se necessário

