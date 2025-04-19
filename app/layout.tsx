import { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'
import { IgrejaConfigProvider } from '@/lib/contexts/igreja-config'

export const metadata: Metadata = {
  title: 'Sistema de Gestão da Igreja',
  description: 'Gerenciamento de membros, congregações e finanças da igreja',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <IgrejaConfigProvider>
          {children}
          <Toaster position="top-right" richColors />
        </IgrejaConfigProvider>
      </body>
    </html>
  )
}
