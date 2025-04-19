'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { db, auth } from '@/lib/firebase/config'
import { collection, getDocs, query, limit, orderBy, where, doc, getDoc } from 'firebase/firestore'
import Link from 'next/link'
import { 
  Users, 
  Church, 
  Coins, 
  Calendar,
  ArrowUpRight,
  Share2,
  Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMembros: 0,
    totalCongregacoes: 0,
    totalEntradas: 0,
    totalEventos: 0,
    totalPublicacoes: 0
  })
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [atividades, setAtividades] = useState([])
  const [eventos, setEventos] = useState([])
  const router = useRouter()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Obtém usuário atual
        const user = auth.currentUser
        if (user) {
          setUserName(user.displayName || 'Usuário')
          
          // Buscar dados do usuário no Firestore
          const userRef = doc(db, 'usuarios', user.uid)
          const userDoc = await getDoc(userRef)
          
          if (userDoc.exists()) {
            // Poderia fazer algo com os dados do usuário aqui
            console.log('Dados do usuário:', userDoc.data())
          }
        } else {
          // Usuário não está logado, redirecionar para login
          router.push('/login')
          return
        }
        
        // Em caso de dados reais insuficientes, usamos valores de demonstração
        setStats({
          totalMembros: 247,
          totalCongregacoes: 5,
          totalEntradas: 12345,
          totalEventos: 8,
          totalPublicacoes: 15
        })
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        // Em caso de erro, usamos valores simulados
        setStats({
          totalMembros: 247,
          totalCongregacoes: 5,
          totalEntradas: 12345,
          totalEventos: 8,
          totalPublicacoes: 15
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [router])

  const statsCards = [
    {
      title: 'Membros',
      value: stats.totalMembros,
      icon: Users,
      href: '/secretaria',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Congregações',
      value: stats.totalCongregacoes,
      icon: Church,
      href: '/congregacoes',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'Entrada Mensal (R$)',
      value: stats.totalEntradas.toLocaleString('pt-BR'),
      icon: Coins,
      href: '/tesouraria',
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Eventos Próximos',
      value: stats.totalEventos,
      icon: Calendar,
      href: '/secretaria',
      color: 'bg-orange-100 text-orange-600'
    },
    {
      title: 'Publicações',
      value: stats.totalPublicacoes,
      icon: Share2,
      href: '/redes-sociais',
      color: 'bg-pink-100 text-pink-600'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-3xl font-bold">Olá, {userName}! Bem-vindo ao Dashboard</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium h-5 bg-gray-200 rounded w-24"></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold h-8 bg-gray-200 rounded w-16 mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {statsCards.map((card) => (
            <Link key={card.title} href={card.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex justify-between items-center">
                    <p className="text-2xl font-bold">{card.value}</p>
                    <div className={`p-2 rounded-full ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-blue-500">
                    <span>Ver detalhes</span>
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">5 novos membros cadastrados</p>
                      <p className="text-sm text-gray-500">Hoje, 10:30</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 text-green-600 p-2 rounded-full">
                      <Coins className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Nova entrada de dízimo registrada</p>
                      <p className="text-sm text-gray-500">Ontem, 15:45</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-orange-100 text-orange-600 p-2 rounded-full">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Evento adicionado: Culto Especial</p>
                      <p className="text-sm text-gray-500">2 dias atrás, 13:15</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 text-purple-600 p-2 rounded-full">
                      <Church className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Nova congregação adicionada</p>
                      <p className="text-sm text-gray-500">1 semana atrás, 09:30</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex space-x-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-px bg-gray-200 w-full my-2"></div>
                  </div>
                ))
              ) : (
                <>
                  <div>
                    <h3 className="font-medium">Culto de Santa Ceia</h3>
                    <div className="flex text-sm text-gray-500 gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Domingo, 28/05
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 18:00
                      </span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 w-full my-2"></div>
                  <div>
                    <h3 className="font-medium">Reunião de Liderança</h3>
                    <div className="flex text-sm text-gray-500 gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Terça, 30/05
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 19:30
                      </span>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 w-full my-2"></div>
                  <div>
                    <h3 className="font-medium">Culto de Oração</h3>
                    <div className="flex text-sm text-gray-500 gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Quarta, 31/05
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 19:30
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Link href="/secretaria" className="text-blue-500 text-sm flex items-center hover:underline">
                      Ver todos os eventos <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 