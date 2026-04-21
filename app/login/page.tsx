'use client'

import { signIn } from 'next-auth/react'
import { BookOpen, Brain, Sparkles, Zap } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl animate-pulse [animation-delay:1.5s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Card */}
        <div className="bg-card border border-border/60 rounded-3xl shadow-2xl shadow-primary/10 p-8 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-foreground leading-tight">StudyBuddy AI</h1>
              <p className="text-xs text-muted-foreground">Your Personal AI Tutor</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Learn smarter, <span className="text-primary">not harder</span>
          </h2>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            Connect your Google Classroom and get an AI tutor that knows your exact course materials.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: BookOpen, label: 'From your syllabus' },
              { icon: Sparkles, label: 'AI-powered answers' },
              { icon: Zap, label: 'Instant quizzes' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-muted rounded-2xl p-3 flex flex-col items-center gap-1.5">
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-xs text-muted-foreground font-medium leading-tight text-center">{label}</span>
              </div>
            ))}
          </div>

          {/* Sign in button */}
          <button
            id="google-signin-btn"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl px-6 py-3.5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            We only read your Classroom & Drive. We never modify anything.
          </p>
        </div>
      </div>
    </div>
  )
}
