# appBarbearia Web

Frontend de agendamento feito com Next.js, TypeScript e Tailwind CSS. O backend NestJS está em `appbarbearia-api/`; ambos formam o projeto integrado, mantendo a preparação para isolamento por barbearia realizado no servidor.

## Início rápido

1. No frontend, copie `.env.example` para `.env.local`.
2. No backend, copie `appbarbearia-api/.env.example` para `appbarbearia-api/.env` e preencha as URLs de conexão do Supabase.
3. Ainda no backend, execute `npm install`, `npm run prisma:generate`, `npm run prisma:migrate -- --name init`, `npm run seed` e `npm run start:dev`.
4. No frontend, execute `npm install` e `npm run dev`.

O backend fica em `http://localhost:3001/api/v1` por padrão e já libera CORS para `http://localhost:3000`.

## Integração de API

O cliente HTTP está em `src/lib/api.ts`. Ele centraliza token Bearer, renovação de sessão via `POST /auth/refresh` e a conversão de falhas em mensagens exibíveis. Está integrado aos caminhos reais: `auth`, `barbers`, `services`, `appointments`, `barber/dashboard` e `barber/schedule`.

O administrador inicial é `admin@barbearia.local` / `Admin@123456`. Crie um barbeiro pelo endpoint administrativo, associe um serviço e registre sua agenda antes de testar o agendamento de um cliente.

## Recursos incluídos

- Login, cadastro, sessão JWT e tentativa de refresh
- Guardas de rota e redirecionamento por perfil
- Dashboards iniciais por perfil
- Consulta de barbeiros, serviços e disponibilidade
- Criação e consulta de agendamentos
- Agenda, conclusão/no-show e bloqueios para barbeiro
- Visão administrativa, cadastro de serviços, cadastro de barbeiros e vínculo de serviços
- Configuração de horário de trabalho pelo barbeiro
