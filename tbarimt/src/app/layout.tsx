import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { Toaster } from 'react-hot-toast'

const rubik = Rubik({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Контент Дэлгүүр - Бүх төрлийн контент нэг дороос',
  description: 'Реферат, дипломын ажил, тоглоом, програм хангамж болон бусад бүх төрлийн контент',
  icons: {
    icon: '/tbarimt.jpeg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('darkMode');
                if (stored === 'true') {
                  document.documentElement.classList.add('dark');
                } else if (stored === 'false') {
                  document.documentElement.classList.remove('dark');
                } else if (stored === null) {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (prefersDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={rubik.className}>
        <ThemeProvider>
          <LanguageProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#004e6c',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
