'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Users, 
  Church, 
  Bookmark, 
  FileText, 
  Coins, 
  Menu, 
  Home, 
  LogOut,
  Share2,
  Settings
} from 'lucide-react'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { useIgrejaConfig } from '@/lib/contexts/igreja-config'

const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Secretaria', href: '/secretaria', icon: FileText },
  { name: 'Tesouraria', href: '/tesouraria', icon: Coins },
  { name: 'Congregações', href: '/congregacoes', icon: Church },
  { name: 'Redes Sociais', href: '/redes-sociais', icon: Share2 },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const [loading, setLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { config, carregando } = useIgrejaConfig()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
      } else {
        try {
          // Verifica se o usuário existe no Firestore também
          const userRef = doc(db, 'usuarios', user.uid)
          const userDoc = await getDoc(userRef)
          
          if (!userDoc.exists()) {
            // Se o usuário não existir no Firestore, cria um documento para ele
            await setDoc(userRef, {
              nome: user.displayName || 'Usuário',
              email: user.email,
              cargo: 'Administrador',
              ultimoAcesso: new Date(),
              dataCadastro: new Date()
            })
          } else {
            // Atualiza o último acesso
            await updateDoc(userRef, {
              ultimoAcesso: new Date()
            })
          }
          
          setLoading(false)
        } catch (error) {
          console.error("Erro ao verificar usuário no Firestore:", error)
          setLoading(false)
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    try {
      await auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao sair:', error)
    }
  }

  if (loading || carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-800 text-white" style={{ backgroundColor: config.corPrimaria }}>
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center">
            {config.logo ? (
              <Image 
                src={config.logo} 
                alt={config.nome} 
                width={32} 
                height={32} 
                className="mr-2" 
              />
            ) : (
              <Bookmark className="mr-2" />
            )}
            {config.nomeAbreviado}
          </h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className={`flex items-center p-2 rounded-md ${
                      isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <Button 
            onClick={handleSignOut}
            variant="ghost" 
            className="w-full flex items-center text-white hover:text-white hover:bg-gray-700"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Header & Menu */}
      <div className="md:hidden bg-gray-800 text-white p-4 flex items-center justify-between" style={{ backgroundColor: config.corPrimaria }}>
        <h1 className="text-xl font-bold flex items-center">
          {config.logo ? (
            <Image 
              src={config.logo} 
              alt={config.nome} 
              width={32} 
              height={32} 
              className="mr-2" 
            />
          ) : (
            <Bookmark className="mr-2" />
          )}
          {config.nomeAbreviado}
        </h1>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-gray-800 text-white p-0 border-r border-gray-700 w-64" style={{ backgroundColor: config.corPrimaria }}>
            <div className="p-4 border-b border-gray-700">
              <h1 className="text-xl font-bold flex items-center">
                {config.logo ? (
                  <Image 
                    src={config.logo} 
                    alt={config.nome} 
                    width={32} 
                    height={32} 
                    className="mr-2" 
                  />
                ) : (
                  <Bookmark className="mr-2" />
                )}
                {config.nomeAbreviado}
              </h1>
            </div>
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                  const Icon = item.icon
                  return (
                    <li key={item.name}>
                      <Link 
                        href={item.href}
                        className={`flex items-center p-2 rounded-md ${
                          isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                        }`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="p-4 border-t border-gray-700">
              <Button 
                onClick={handleSignOut}
                variant="ghost" 
                className="w-full flex items-center text-white hover:text-white hover:bg-gray-700"
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden bg-gray-100">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
} 