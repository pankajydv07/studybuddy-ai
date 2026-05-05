This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# StudyBuddy AI
 
## Getting Started
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?style=flat&logo=openai)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat&logo=supabase)](https://supabase.io/)
 
First, run the development server:
An AI-powered study assistant that helps you learn from your documents. Upload PDFs and DOCX files, ask questions, and get intelligent responses with source references. Built with Next.js, OpenAI, and Supabase.
 
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
## Features
 
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
- 🤖 **AI-Powered Study Assistance** - Get intelligent answers to your questions using OpenAI's latest models
- 📄 **Document Upload & Parsing** - Support for PDF and DOCX files with automatic text extraction
- 💬 **Real-time Chat Interface** - Interactive chat with markdown support for formatted responses
- 🔐 **User Authentication** - Secure login with NextAuth.js and session management
- ☁️ **Google Drive Integration** - Connect with Google APIs for document access (optional)
- 📱 **Responsive UI** - Beautiful interface built with shadcn/ui components and Tailwind CSS
- 🎯 **Smart State Management** - Using Zustand for client-side state and TanStack Query for server state
 
You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
## Prerequisites
 
This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
Before you begin, ensure you have the following:
 
## Learn More
- **Node.js** 18+ installed
- **npm**, **yarn**, or **pnpm** package manager
- **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/)
- **Supabase Project** - Create at [Supabase](https://supabase.com/)
- **Google Cloud Credentials** (optional) - For Google Drive integration
- **NextAuth Secret** - Generate a random string for JWT encryption
 
To learn more about Next.js, take a look at the following resources:
## Installation
 
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
1. **Clone the repository**
 
You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
   ```bash
   git clone https://github.com/pankajydv07/studybuddy-ai.git
   cd studybuddy-ai
   ```
 
## Deploy on Vercel
2. **Install dependencies**
 
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```
 
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
3. **Set up environment variables**

   Create a `.env.local` file in the root directory and add the required environment variables (see below).

4. **Run database migrations** (if applicable)

   Set up your Supabase database tables according to your schema requirements.

5. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# NextAuth.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (Optional - for Google Drive integration)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

> **Note:** Never commit your `.env.local` file to version control. It is already added to `.gitignore`.

## Usage

### Uploading Documents

1. Sign in to your account
2. Click on the upload button to add PDF or DOCX files
3. Wait for the document to be processed and indexed

### Chatting with AI

1. Select a document from your library
2. Type your questions in the chat interface
3. Receive AI-generated responses with markdown formatting
4. View source references from your uploaded documents

### Authentication

- The app uses NextAuth.js for secure authentication
- Configure your preferred authentication providers in the NextAuth configuration
- Sessions are persisted securely with JWT

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query)
- **AI Integration:** [OpenAI](https://openai.com/) + [AI SDK](https://sdk.vercel.ai/)
- **Database:** [Supabase](https://supabase.com/)
- **Authentication:** [NextAuth.js v5](https://next-auth.js.org/)
- **Document Parsing:** [Mammoth](https://github.com/mwilliamson/mammoth.js) (DOCX), [unpdf](https://github.com/unjs/unpdf) (PDF)
- **Markdown:** [React Markdown](https://github.com/remarkjs/react-markdown) with [GFM](https://github.com/remarkjs/remark-gfm)
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/)
- **Icons:** [Lucide React](https://lucide.dev/)

## Deployment

### Deploy on Vercel

The easiest way to deploy StudyBuddy AI is using the [Vercel Platform](https://vercel.com/new).

1. Push your code to GitHub
2. Import your repository on Vercel
3. Configure the environment variables in the Vercel dashboard:
   - Add all variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production domain
4. Deploy!

> **Important:** Ensure your Supabase project allows connections from your Vercel deployment domain. Update your Supabase Row Level Security (RLS) policies accordingly.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting (`npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please ensure your code follows the existing ESLint configuration and passes all linting checks.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [OpenAI Documentation](https://platform.openai.com/docs) - AI model integration
- [Supabase Documentation](https://supabase.com/docs) - Database and authentication

---

Built with ❤️ using Next.js and OpenAI
