import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Autenticação | Sistema Igreja',
  description: 'Sistema de gerenciamento para igrejas',
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  )
} 