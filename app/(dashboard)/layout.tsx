'use client'

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '@/lib/contexts/auth-context'
import { CongregacoesProvider } from '@/lib/contexts/congregacoes-context'
import ProtectedRoute from '@/components/auth/protected-route'
import PermissionGate from '@/components/auth/permission-gate'
import CongregacaoSelector from '@/components/congregacao-selector'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Bookmark, 
  FileText, 
  Coins, 
  Church,
  Menu, 
  Home, 
  LogOut,
  Share2,
  Settings,
  UserIcon
} from 'lucide-react'
import { useIgrejaConfig } from '@/lib/contexts/igreja-config'
import { Permissao } from '@/lib/types'

// Tipagem correta para os itens de navegação
type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  requiredPermissions: Permissao[];
}

// Adicionar propriedade de permissões necessárias para cada item de navegação
const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, requiredPermissions: [] },
  { name: 'Secretaria', href: '/secretaria', icon: FileText, requiredPermissions: ['membros.visualizar'] },
  { name: 'Tesouraria', href: '/tesouraria', icon: Coins, requiredPermissions: ['financas.visualizar'] },
  { name: 'Congregações', href: '/congregacoes', icon: Church, requiredPermissions: ['congregacoes.visualizar'] },
  { name: 'Usuários', href: '/usuarios', icon: UserIcon, requiredPermissions: [] },
  { name: 'Redes Sociais', href: '/redes-sociais', icon: Share2, requiredPermissions: [] },
  { name: 'Configurações', href: '/configuracoes', icon: Settings, requiredPermissions: ['configuracoes.visualizar'] },
]

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthProvider>
      <CongregacoesProvider>
        <ProtectedRoute>
          <DashboardContent>{children}</DashboardContent>
        </ProtectedRoute>
      </CongregacoesProvider>
    </AuthProvider>
  );
}

// Componente interno para o conteúdo do dashboard
function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { config, carregando } = useIgrejaConfig();
  const { logout, hasPermission, isCargo, userData } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Log de debug para verificar as permissões do usuário logado
  useEffect(() => {
    if (userData) {
      console.log('Usuário logado:', userData);
      console.log('Cargo do usuário:', userData.cargo);
      console.log('Permissões do usuário:', userData.permissoes);
      console.log('Tem permissão de visualizar usuários:', hasPermission('usuarios.visualizar'));
      console.log('Tem permissão de visualizar finanças:', hasPermission('financas.visualizar'));
      console.log('Tem permissão de visualizar membros:', hasPermission('membros.visualizar'));
      console.log('É administrador:', isCargo('administrador'));
      console.log('É tesoureiro:', isCargo('tesoureiro'));
      console.log('É tesoureiro geral:', isCargo('tesoureiro_geral'));
    }
  }, [userData, hasPermission, isCargo]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    );
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
              
              // Debug específico para Tesouraria
              if (item.name === 'Tesouraria') {
                console.log('Debug Tesouraria:', {
                  itemName: item.name,
                  requiredPermissions: item.requiredPermissions,
                  hasPermission: item.requiredPermissions.map(p => ({ permission: p, has: hasPermission(p) })),
                  userCargo: userData?.cargo,
                  isTesoureiro: isCargo('tesoureiro'),
                  isTesoureiroGeral: isCargo('tesoureiro_geral')
                });
              }
              
              return (
                <li key={item.name}>
                  {item.requiredPermissions.length > 0 ? (
                    <PermissionGate
                      permissions={item.requiredPermissions}
                      anyPermission={true}
                      cargos={['super_admin', 'administrador', 'secretario_geral', 'tesoureiro_geral', 'secretario', 'tesoureiro']}
                    >
                      <Link 
                        href={item.href}
                        className={`flex items-center p-2 rounded-md ${
                          isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    </PermissionGate>
                  ) : (
                    <Link 
                      href={item.href}
                      className={`flex items-center p-2 rounded-md ${
                        isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <div className="mb-4">
            <CongregacaoSelector />
          </div>
          <Button 
            onClick={logout}
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
                      {item.requiredPermissions.length > 0 ? (
                        <PermissionGate
                          permissions={item.requiredPermissions}
                          anyPermission={true}
                          cargos={['super_admin', 'administrador', 'secretario_geral', 'tesoureiro_geral', 'secretario', 'tesoureiro']}
                        >
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
                        </PermissionGate>
                      ) : (
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
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
            <div className="p-4 border-t border-gray-700">
              <div className="mb-4">
                <CongregacaoSelector />
              </div>
              <Button 
                onClick={logout}
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
  );
} 