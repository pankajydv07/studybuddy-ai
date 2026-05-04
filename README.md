# StudyBuddy AI

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

An intelligent AI-powered study companion that helps students learn more effectively through personalized tutoring, automated quiz generation, smart document analysis, and adaptive study scheduling.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

StudyBuddy AI leverages advanced Language Learning Models (LLMs) to provide students with an interactive learning experience. Whether you need help understanding complex topics, generating practice questions from your notes, or organizing your study schedule, StudyBuddy AI adapts to your learning style and pace.

**Target Users:**
- High school and university students
- Self-learners and online course takers
- Professionals preparing for certifications
- Anyone looking to optimize their study habits

## Features

- 🤖 **AI Tutoring**: Get personalized explanations and answers to your questions in real-time
- 📝 **Smart Quiz Generation**: Automatically create quizzes from your study materials or topics
- 📄 **Document Analysis**: Upload PDFs or text files and get summaries, key points, and Q&A
- 📅 **Study Scheduler**: AI-powered study plan creation based on your goals and deadlines
- 🎯 **Progress Tracking**: Monitor your learning progress and identify weak areas
- 💾 **Study History**: Save and revisit previous study sessions and generated content
- 🌙 **Dark Mode**: Easy on the eyes for late-night study sessions

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **AI Integration**: OpenAI GPT-4 / Claude API
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **File Storage**: AWS S3 / Vercel Blob (for document uploads)
- **Deployment**: [Vercel](https://vercel.com)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.x or later
- npm, yarn, pnpm, or bun
- Git
- A PostgreSQL database (local or cloud)
- OpenAI API key or Claude API key

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pankajydv07/studybuddy-ai.git
   cd studybuddy-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   See [Environment Variables](#environment-variables) section for details.

4. **Set up the database**
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
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/studybuddy"

# Authentication (NextAuth.js)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI API Keys
OPENAI_API_KEY="sk-your-openai-api-key"
# or
ANTHROPIC_API_KEY="your-anthropic-api-key"

# Optional: File Storage
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_S3_BUCKET_NAME="your-bucket-name"
```

> **Note**: Never commit your `.env.local` file to version control. It is already added to `.gitignore`.

## Usage

### Getting Started

