'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Church, 
  Calendar, 
  Clock, 
  MapPin, 
  PhoneCall, 
  Mail, 
  ArrowRight, 
  Facebook, 
  Instagram, 
  Youtube,
  Bookmark 
} from 'lucide-react'
import { useIgrejaConfig } from '@/lib/contexts/igreja-config'
import Image from 'next/image'
import { auth } from '@/lib/firebase/config'

export default function Home() {
  const router = useRouter()
  const { config } = useIgrejaConfig()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Valores padrão para quando os dados não estiverem disponíveis
  const horariosPadrao = [
    { dia: 'Domingo', horario: '9h e 18h' },
    { dia: 'Quarta-feira', horario: '19h30' },
    { dia: 'Sexta-feira', horario: '20h' }
  ]
  
  const eventosPadrao = [
    { titulo: 'Culto Especial de Louvor', data: '15 de Maio, 2023', horario: '19h' },
    { titulo: 'Encontro de Jovens', data: '28 de Maio, 2023', horario: '18h' },
    { titulo: 'Seminário Família Cristã', data: '10 de Junho, 2023', horario: '9h às 17h' }
  ]
  
  // Dados da igreja (alguns vem do contexto, outros são fixos para a página)
  const igreja = {
    nome: config.nome || 'Igreja Evangélica Nacional',
    nomeAbreviado: config.nomeAbreviado || 'Sistema Igreja',
    slogan: 'Transformando vidas pelo poder da Palavra',
    endereco: config.endereco || 'Rua Principal, 123 - Centro',
    cidade: config.cidade || 'São Paulo',
    estado: config.estado || 'SP',
    cep: config.cep || '00000-000',
    telefone: config.telefone || '(00) 0000-0000',
    email: config.email || 'contato@igreja.org',
    site: config.site || 'www.igreja.org',
    logo: config.logo || '',
    corPrimaria: config.corPrimaria || '#111827',
    corSecundaria: config.corSecundaria || '#4B5563',
    // Usar os dados do Firestore se existirem, senão usar os valores padrão
    horarios: Array.isArray(config.horarios) && config.horarios.length > 0 
      ? config.horarios 
      : horariosPadrao,
    redesSociais: {
      facebook: 'https://facebook.com/',
      instagram: 'https://instagram.com/',
      youtube: 'https://youtube.com/'
    },
    proximosEventos: Array.isArray(config.proximosEventos) && config.proximosEventos.length > 0 
      ? config.proximosEventos 
      : eventosPadrao
  }

  const enderecoCompleto = `${igreja.endereco}, ${igreja.cidade} - ${igreja.estado}, ${igreja.cep}`
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true)
        router.push('/secretaria')
      } else {
        setIsLoggedIn(false)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Cabeçalho */}
      <header className="bg-gray-900 text-white" style={{ backgroundColor: igreja.corPrimaria }}>
        <div className="container mx-auto py-6 px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            {igreja.logo ? (
              <Image 
                src={igreja.logo} 
                alt={igreja.nome} 
                width={32} 
                height={32} 
                className="h-8 w-8" 
              />
            ) : (
              <Church className="h-8 w-8" />
            )}
            <h1 className="text-2xl font-bold">{igreja.nome}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#sobre" className="hover:text-gray-300">Sobre</Link>
            <Link href="#horarios" className="hover:text-gray-300">Horários</Link>
            <Link href="#eventos" className="hover:text-gray-300">Eventos</Link>
            <Link href="#contato" className="hover:text-gray-300">Contato</Link>
            <Link href="/login">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                Acessar Sistema
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Banner Principal */}
      <div className="relative bg-gray-800 text-white h-96 flex items-center">
        <div className="absolute inset-0 bg-[url('/banner-church.jpg')] bg-cover bg-center opacity-40"></div>
        <div className="container mx-auto px-4 z-10">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 max-w-2xl">
            {igreja.slogan}
          </h2>
          <p className="text-xl mb-8 max-w-xl">
            Venha nos conhecer e fazer parte desta família. 
            Todos são bem-vindos!
          </p>
          <div className="flex gap-4">
            <Button 
              className="bg-white text-gray-900 hover:bg-gray-200"
              onClick={() => router.push('#horarios')}
            >
              Nossos Horários
            </Button>
            <Button 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-gray-900"
              onClick={() => router.push('#contato')}
            >
              Como Chegar
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto py-12 px-4">
          {/* Sobre */}
          <section id="sobre" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Sobre Nossa Igreja</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <p className="mb-4 text-lg">
                  Somos uma comunidade de fé comprometida com os valores cristãos e dedicada a servir a Deus e ao próximo.
                </p>
                <p className="mb-4 text-lg">
                  Nossa missão é compartilhar o amor de Deus através de ações práticas, pregação da Palavra e desenvolvimento de relacionamentos saudáveis.
                </p>
                <p className="text-lg">
                  Acreditamos que cada pessoa é importante para Deus e tem um propósito único. Estamos aqui para ajudar você a descobrir e viver esse propósito!
                </p>
              </div>
              <div className="bg-gray-200 rounded-lg h-72 flex items-center justify-center text-gray-400">
                <span className="text-sm">Imagem da Igreja</span>
              </div>
            </div>
          </section>

          {/* Horários */}
          <section id="horarios" className="mb-16 bg-white rounded-lg shadow-md p-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Nossos Horários</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {igreja.horarios.map((horario, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle>{horario.dia}</CardTitle>
                    <Clock className="h-5 w-5 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-medium">{horario.horario}</p>
                    <p className="text-gray-500">Culto de Celebração</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Próximos Eventos */}
          <section id="eventos" className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">Próximos Eventos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {igreja.proximosEventos.map((evento, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{evento.titulo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{evento.data}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{evento.horario}</span>
                    </div>
                    <Button variant="link" className="px-0 mt-4">
                      Mais informações <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Contato */}
          <section id="contato" className="mb-8">
            <h2 className="text-3xl font-bold mb-8 text-center">Contato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <MapPin className="h-6 w-6 text-gray-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Endereço</h3>
                    <p>{enderecoCompleto}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 mb-6">
                  <PhoneCall className="h-6 w-6 text-gray-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Telefone</h3>
                    <p>{igreja.telefone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 mb-6">
                  <Mail className="h-6 w-6 text-gray-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Email</h3>
                    <p>{igreja.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3">Redes Sociais</h3>
                  <div className="flex gap-4">
                    <Link href={igreja.redesSociais.facebook} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="outline">
                        <Facebook className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href={igreja.redesSociais.instagram} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="outline">
                        <Instagram className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href={igreja.redesSociais.youtube} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="outline">
                        <Youtube className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-sm">Mapa da Igreja (Google Maps)</span>
              </div>
            </div>
          </section>
          
          {/* Acesso ao Sistema */}
          <section className="bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Área Restrita</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Se você é membro da equipe, acesse o sistema de gerenciamento da igreja utilizando seu login e senha.
            </p>
            <Button 
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Acessar Sistema
            </Button>
          </section>
        </div>
      </main>

      {/* Rodapé */}
      <footer className="bg-gray-800 text-white py-8" style={{ backgroundColor: igreja.corPrimaria }}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {igreja.logo ? (
                  <Image 
                    src={igreja.logo} 
                    alt={igreja.nome} 
                    width={32} 
                    height={32} 
                    className="h-8 w-8" 
                  />
                ) : (
                  <Church className="h-8 w-8" />
                )}
                <h3 className="text-xl font-bold">{igreja.nome}</h3>
              </div>
              <p className="mb-4">{igreja.slogan}</p>
              <p className="text-gray-400">{igreja.site}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li><Link href="#sobre" className="hover:text-gray-300">Sobre Nós</Link></li>
                <li><Link href="#horarios" className="hover:text-gray-300">Horários de Culto</Link></li>
                <li><Link href="#eventos" className="hover:text-gray-300">Eventos</Link></li>
                <li><Link href="#contato" className="hover:text-gray-300">Contato</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contato</h3>
              <p className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" />
                {enderecoCompleto}
              </p>
              <p className="flex items-center gap-2 mb-2">
                <PhoneCall className="h-4 w-4" />
                {igreja.telefone}
              </p>
              <p className="flex items-center gap-2 mb-4">
                <Mail className="h-4 w-4" />
                {igreja.email}
              </p>
              <div className="flex gap-3">
                <Link href={igreja.redesSociais.facebook} target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5 hover:text-gray-300" />
                </Link>
                <Link href={igreja.redesSociais.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram className="h-5 w-5 hover:text-gray-300" />
                </Link>
                <Link href={igreja.redesSociais.youtube} target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-5 w-5 hover:text-gray-300" />
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} {igreja.nome}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
