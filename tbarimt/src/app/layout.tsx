import type { Metadata } from 'next'
import Script from 'next/script'
import { Nunito } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { Toaster } from 'react-hot-toast'

const GA_MEASUREMENT_ID = 'G-130PLPXEE4'

const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'Контент Дэлгүүр - Бүх төрлийн контент нэг дороос',
  description: 'Реферат, дипломын ажил, тоглоом, програм хангамж болон бусад бүх төрлийн контент',
  icons: {
    icon: [
      { url: '/fav.png', type: 'image/png' },
    ],
    shortcut: '/fav.png',
    apple: '/fav.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={nunito.variable}>
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
      <body className={`${nunito.className} font-sans`}>
        {/* Google Analytics (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
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
