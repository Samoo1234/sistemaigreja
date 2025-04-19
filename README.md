# Sistema de Gestão para Igreja

Sistema de gestão para igrejas com funcionalidades como gerenciamento de membros, tesouraria, congregações e muito mais.

## Tecnologias

- Next.js 15
- React 19
- Firebase (Firestore, Authentication, Storage)
- TailwindCSS
- ShadcnUI

## Pré-requisitos

- Node.js 18+ 
- Projeto Firebase configurado

## Como executar o projeto

1. Clone o repositório:
```bash
git clone https://github.com/Samoo1234/sistemaigreja.git
cd sistemaigreja
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie o arquivo `.env.example` para `.env.local`
   - Preencha as variáveis com os dados do seu projeto Firebase

4. Execute em modo de desenvolvimento:
```bash
npm run dev
```

5. Acesse http://localhost:3000

## Deploy na Vercel

1. Configure o projeto no [Vercel Dashboard](https://vercel.com/new)
2. Conecte seu repositório GitHub
3. Configure as seguintes variáveis de ambiente no Vercel:
   - NEXT_PUBLIC_FIREBASE_API_KEY
   - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
   - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   - NEXT_PUBLIC_FIREBASE_APP_ID
   - NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID

4. Faça o deploy clicando em "Deploy"

## Estrutura do Projeto

- `/app` - Páginas e rotas da aplicação
- `/components` - Componentes reutilizáveis
- `/lib` - Utilitários, contextos e configuração do Firebase
- `/public` - Arquivos estáticos

## Recursos

- Dashboard administrativo
- Gerenciamento de membros
- Controle financeiro (entradas e saídas)
- Gestão de congregações
- Configurações personalizáveis

## Licença

Este projeto está sob a licença MIT.
