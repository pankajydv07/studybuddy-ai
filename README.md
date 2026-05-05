This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# StudyBuddy AI
 
## Getting Started
An intelligent AI-powered study assistant that helps students learn more effectively through personalized tutoring, automated quiz generation, study planning, and document analysis.
 
First, run the development server:
## Features
 
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
- **AI-Powered Q&A**: Ask questions about any topic and get detailed, contextual answers from advanced AI models
- **Interactive Quiz Generation**: Automatically generate quizzes from your study materials to test your knowledge
- **Study Schedule Planning**: Create personalized study plans and schedules based on your goals and timeline
- **Document Summarization**: Upload PDFs, notes, or textbooks and get instant summaries and key insights
- **Flashcard Creation**: Automatically generate flashcards from your documents for spaced repetition learning
- **Progress Tracking**: Monitor your learning progress and identify areas that need more attention
 
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
## Tech Stack
 
You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.
- [Next.js 14](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [OpenAI API](https://openai.com/) - AI/LLM capabilities
- [LangChain](https://js.langchain.com/) - LLM orchestration and chains
- [Prisma](https://www.prisma.io/) - Database ORM (if applicable)
- [NextAuth.js](https://next-auth.js.org/) - Authentication (if applicable)
 
This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
## Prerequisites
 
## Learn More
Before you begin, ensure you have the following:
 
To learn more about Next.js, take a look at the following resources:
- Node.js 18.x or later
- npm, yarn, pnpm, or bun package manager
- OpenAI API key (or Anthropic API key)
- (Optional) Database URL if using persistent storage
 
- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
## Getting Started
 
You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
1. **Clone the repository**
   ```bash
   git clone https://github.com/pankajydv07/studybuddy-ai.git
   cd studybuddy-ai
   ```
 
## Deploy on Vercel
2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```
 
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your API keys (see Environment Variables section below).
 
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
4. **Configure the database (if applicable)**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

6. **Open the application**
   
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key for AI features | Yes |
| `ANTHROPIC_API_KEY` | Alternative: Anthropic Claude API key | No* |
| `DATABASE_URL` | Database connection string (if using DB) | Conditional |
| `NEXTAUTH_SECRET` | Random string for JWT encryption (if using auth) | Conditional |
| `NEXTAUTH_URL` | Your app URL (typically http://localhost:3000) | Conditional |

\* Only if not using OpenAI

## Usage

1. **Upload Study Materials**: Upload PDFs, text files, or paste content directly into the application
2. **Ask the AI Tutor**: Use the chat interface to ask questions about your materials or general topics
3. **Generate Study Tools**: Create quizzes, flashcards, and summaries from your uploaded documents
4. **Plan Your Studies**: Set up study schedules and get reminders for upcoming topics
5. **Track Progress**: Review your quiz scores and study statistics in the dashboard

## Screenshots

![StudyBuddy AI Dashboard](./docs/images/dashboard.png)
*Main dashboard showing study materials and quick actions*

![AI Tutor Chat](./docs/images/chat.png)
*Interactive AI tutoring interface*

> Note: Add your own screenshots to the `docs/images/` directory and update the paths above.

## Deployment

The easiest way to deploy StudyBuddy AI is using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Make sure to add your environment variables in the Vercel dashboard under Project Settings > Environment Variables.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
