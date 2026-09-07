# appBarbearia

Sistema de agendamento para barbearias, com acesso dedicado para clientes, barbeiros e administradores. Reúne uma interface web em Next.js e uma API NestJS com PostgreSQL hospedado no Supabase.

A experiência inicial atende uma única barbearia. O modelo de dados utiliza `barbershopId` para preparar a evolução para múltiplas barbearias, sem incluir cobrança, planos ou assinaturas comerciais.

> **Status:** projeto em desenvolvimento. A compilação e os testes ponta a ponta ainda não foram concluídos neste ambiente; a implementação não está validada para produção.

## Funcionalidades

| Perfil | Recursos disponíveis na interface |
| --- | --- |
| Cliente | Cadastro, login, consulta de barbeiros e serviços, disponibilidade, agendamento e consulta dos próprios horários |
| Barbeiro | Agenda do dia, horários semanais, criação de bloqueios, conclusão de atendimentos e registro de ausência |
| Administrador | Visão geral, consulta de agendamentos, cadastro de serviços e barbeiros e associação de serviços à equipe |

A autenticação utiliza JWT, com tentativa de renovação por refresh token e redirecionamento conforme o perfil do usuário.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Interface | Next.js 14, React 18, TypeScript, Tailwind CSS e Lucide |
| API | NestJS 11, TypeScript e Prisma 6 |
| Banco de dados | PostgreSQL / Supabase |
| Autenticação | JWT, Passport e Argon2 |

O Supabase é utilizado como provedor do banco PostgreSQL. O cadastro e o login são gerenciados pela API NestJS, sem integração com Supabase Auth.

## Estrutura do projeto

```text
appbarbearia/
├── src/
│   ├── app/                    # Páginas, layouts e rotas do frontend
│   ├── components/             # Componentes compartilhados
│   └── lib/                    # Cliente HTTP, sessão e tipos
├── appbarbearia-api/
│   ├── src/                    # Módulos e endpoints NestJS
│   ├── prisma/                 # Modelo de dados, seed e índice SQL
│   ├── .env.example            # Configuração de referência da API
│   └── package.json
├── .env.example                # Configuração de referência do frontend
├── package.json
└── README.md
```

O frontend fica na raiz; o backend, em `appbarbearia-api`. Cada um possui suas próprias dependências e deve ser executado em um terminal separado.

## Pré-requisitos

- Node.js 22 ou superior e npm.
- Projeto Supabase destinado ao desenvolvimento deste sistema.
- Conexão PostgreSQL e credenciais com permissões para criar as tabelas da aplicação.

Docker é opcional e não é necessário ao utilizar Supabase.

## Configuração do Supabase

1. No painel do projeto, acesse **Connect** e copie a conexão **Session pooler**, na porta `5432`.
2. Use os dados reais de host, usuário e senha na configuração do backend. O `.env.example` pressupõe um usuário `prisma`; ele precisa existir e ter as permissões necessárias. Criar o usuário, por si só, não concede essas permissões.
3. Consulte o [guia oficial de Prisma com Supabase](https://supabase.com/docs/guides/database/prisma) para configurar o usuário e seus privilégios. Este projeto utiliza Prisma 6, com o datasource em `prisma/schema.prisma`.

Para desenvolvimento local, `DATABASE_URL` e `DIRECT_URL` podem apontar à mesma conexão Session pooler. A segunda variável é utilizada pelo Prisma CLI. Utilize a senha do banco, não uma chave `anon` ou `service_role`. Caracteres especiais da senha devem ser codificados para uso em uma URL.

Prefira um projeto dedicado e vazio para a primeira migração. Se já houver tabelas ou dados de outra aplicação, revise o banco antes de prosseguir e não aceite uma solicitação de reset sem avaliar a perda de dados.

## Executar localmente

Os comandos abaixo usam PowerShell e partem da raiz do projeto.

### 1. Configurar o backend

```powershell
cd appbarbearia-api
Copy-Item .env.example .env
npm install
```

Se `.env` já existir, edite-o sem substituir sua configuração. Preencha:

| Variável | Finalidade |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL utilizada pela API |
| `DIRECT_URL` | Conexão utilizada pelo Prisma CLI |
| `JWT_ACCESS_SECRET` | Segredo do token de acesso |
| `JWT_REFRESH_SECRET` | Segredo distinto para o refresh token |
| `FRONTEND_URL` | Origem permitida pelo CORS; localmente, `http://localhost:3000` |
| `PORT` | Porta da API; padrão `3001` |

Substitua os segredos de exemplo por valores aleatórios distintos. As variáveis de Google OAuth presentes no arquivo não são necessárias para login com e-mail e senha.

### 2. Preparar o banco e iniciar a API

Com o `.env` preenchido, execute no diretório `appbarbearia-api`:

```powershell
npm run prisma:generate
npm run prisma:migrate -- --name init
npx prisma db execute --file prisma/tenant-index.sql --schema prisma/schema.prisma
npm run seed
npm run start:dev
```

O índice SQL impede agendamentos confirmados com o mesmo barbeiro, data e horário inicial. Ele complementa as tabelas criadas pelo Prisma, mas não impede sozinho todas as sobreposições entre intervalos.

Se a migração falhar por falta de permissão para criar o *shadow database*, será necessário configurar um banco separado para essa finalidade ou revisar a estratégia de migração. Nunca use o banco principal como shadow database.

Verifique a API em [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health).

### 3. Iniciar o frontend

Em um segundo terminal, na raiz do projeto:

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

O arquivo `.env.local` deve conter:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

Abra [http://localhost:3000](http://localhost:3000). As credenciais do banco e os segredos JWT pertencem exclusivamente ao backend e não devem ser colocados no frontend.

## Primeiro acesso e roteiro de teste

O seed cria a **Barbearia Principal**, três serviços iniciais e uma conta administrativa de desenvolvimento:

```text
E-mail: admin@barbearia.local
Senha: Admin@123456
```

Essa senha é pública e deve ser substituída antes de qualquer uso real.

1. Entre como administrador e confira os serviços em `/admin/servicos`.
2. Cadastre um barbeiro e vincule os serviços em `/admin/barbeiros`.
3. Entre com a conta do barbeiro e configure o dia desejado em `/barber/horarios`.
4. Crie uma conta de cliente em `/cadastro` e agende em `/client/agendar`.
5. Confira a reserva em `/client/agendamentos` e na agenda do barbeiro em `/barber`.
6. Teste a criação de um bloqueio e a atualização do atendimento para concluído ou ausente.

Use sessões de navegador separadas para testar diferentes perfis simultaneamente.

## Integração e organização dos dados

A API usa o prefixo `/api/v1`. O cliente HTTP do frontend está em `src/lib/api.ts`, e os tipos da interface estão em `src/lib/types.ts`.

| Grupo | Responsabilidade |
| --- | --- |
| `/auth` | Cadastro, login, perfil autenticado e renovação de tokens |
| `/barbers` | Consulta de barbeiros |
| `/admin/barbers` | Cadastro de barbeiros e vínculo de serviços |
| `/services` | Catálogo e gestão de serviços |
| `/appointments` | Agendamentos, disponibilidade, cancelamento e status |
| `/barber/schedule` | Horários semanais e bloqueios |
| `/barber/dashboard` | Agenda e totais por dia |

O backend obtém o `barbershopId` da sessão autenticada para filtrar os dados. Os controles de navegação do frontend não substituem as verificações de autorização da API.

## Verificação de compilação

Na raiz do projeto:

```powershell
npm run build
```

No diretório `appbarbearia-api`:

```powershell
npm run prisma:generate
npm run build
```

Após uma compilação bem-sucedida, `npm run start` inicia cada aplicação no seu respectivo diretório. A compilação não substitui os testes dos fluxos com banco e API ativos.

## Limitações atuais

- A compilação e o fluxo completo ainda precisam de validação em um ambiente configurado.
- A interface de horários semanais permite salvar um período contínuo por dia.
- Os tokens são armazenados em `localStorage`; a estratégia de sessão precisa ser revisada antes de produção.
- O backend ainda não persiste nem revoga refresh tokens por sessão.
- A proteção de concorrência precisa ser ampliada para garantir ausência de sobreposição entre intervalos distintos.
- A preparação multi-tenant ainda exige revisão de isolamento e autorização antes de atender várias barbearias.

## Diagnóstico rápido

| Situação | O que verificar |
| --- | --- |
| Frontend não conecta à API | API iniciada, porta `3001`, `NEXT_PUBLIC_API_URL` e `FRONTEND_URL` |
| Prisma não conecta ao Supabase | Projeto ativo, host copiado do painel, usuário, senha e porta `5432` |
| Não aparecem horários | Serviço vinculado ao barbeiro, dia de trabalho configurado, bloqueios e reservas existentes |
| Comando `next` ou `nest` não encontrado | Instalação concluída no diretório correto, sem erros do npm |
| Alterações no `.env` não surtiram efeito | Reinicie a aplicação correspondente após editar as variáveis |
