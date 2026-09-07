# appBarbearia API

Backend multi-tenant preparado para SaaS, inicialmente operando com uma única barbearia.

## Stack
- Node.js + TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- JWT
- Argon2
- Passport

## Banco de dados: Supabase

Este projeto está configurado para usar um banco PostgreSQL do Supabase, sem Docker.

1. Crie um projeto no [Supabase](https://supabase.com/dashboard).
2. Em **Database > Roles**, crie um usuário `prisma` com uma senha forte.
3. Em **Connect**, copie a conexão **Session pooler** (porta `5432`).
4. Copie `.env.example` para `.env` e substitua `[PROJECT-REF]`, `[SENHA-PRISMA]` e `[REGIAO]` em `DATABASE_URL` e `DIRECT_URL`.

A Session pooler é compatível com redes IPv4 e serve tanto para o NestJS persistente quanto para as migrations do Prisma. Para uma conexão direta com suporte de rede, você pode usá-la em `DIRECT_URL`. Consulte a documentação do Supabase sobre [Prisma](https://supabase.com/docs/guides/database/prisma).

## PostgreSQL local (opcional)
```bash
docker compose up -d
```

## Instalação
```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

Depois execute `prisma/tenant-index.sql` no PostgreSQL para ativar a proteção de concorrência de horários.

## Desenvolvimento
```bash
npm run start:dev
```
API: `http://localhost:3001/api/v1`
Health: `GET /api/v1/health`

## Credencial inicial do seed
- E-mail: `admin@barbearia.local`
- Senha: `Admin@123456`

Troque a senha imediatamente em ambiente real.

## Domínios
- `/auth` autenticação
- `/users` perfil
- `/barbers` barbeiros
- `/admin/barbers` gestão administrativa de barbeiros
- `/services` serviços
- `/barber/schedule` agenda
- `/appointments` agendamentos e disponibilidade
- `/barber/dashboard` dashboard

## Regra de tenant
O `barbershopId` não deve ser aceito do frontend como autoridade. Ele vem do usuário autenticado/JWT e é usado pelo backend para filtrar os dados.

## Próximas melhorias de produção
- Refresh token persistido/rotacionado e revogação por sessão
- Google OAuth completo com callback
- Rate limiting global
- Logs estruturados e auditoria administrativa
- Redis para cache/filas
- Testes unitários/e2e
- migrations CI/CD
- RLS do PostgreSQL como camada adicional de defesa
