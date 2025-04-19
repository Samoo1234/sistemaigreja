'use client'

import { createContext, useState, useContext, ReactNode, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

// Tipo para as configurações da igreja
type IgrejaConfig = {
  nome: string
  nomeAbreviado: string
  logo?: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  telefone: string
  email: string
  site?: string
  corPrimaria: string
  corSecundaria: string
  horarios?: Array<{
    dia: string
    horario: string
  }>
  proximosEventos?: Array<{
    titulo: string
    data: string
    horario: string
  }>
}

// Valores padrão
const configPadrao: IgrejaConfig = {
  nome: 'Igreja Evangélica Nacional',
  nomeAbreviado: 'Sistema Igreja',
  logo: '',
  endereco: 'Rua Exemplo, 123',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '00000-000',
  telefone: '(00) 0000-0000',
  email: 'contato@igreja.org',
  site: 'www.igreja.org',
  corPrimaria: '#111827',
  corSecundaria: '#4B5563',
  horarios: [
    { dia: 'Domingo', horario: '9h e 18h' },
    { dia: 'Quarta-feira', horario: '19h30' },
    { dia: 'Sexta-feira', horario: '20h' }
  ],
  proximosEventos: [
    { titulo: 'Culto Especial de Louvor', data: '15 de Maio, 2023', horario: '19h' },
    { titulo: 'Encontro de Jovens', data: '28 de Maio, 2023', horario: '18h' },
    { titulo: 'Seminário Família Cristã', data: '10 de Junho, 2023', horario: '9h às 17h' }
  ]
}

// Contexto
type IgrejaConfigContextType = {
  config: IgrejaConfig
  carregando: boolean
  salvarConfig: (novaConfig: Partial<IgrejaConfig>) => Promise<void>
  recarregarConfig: () => Promise<void>
}

const IgrejaConfigContext = createContext<IgrejaConfigContextType | undefined>(undefined)

// Provider
export function IgrejaConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<IgrejaConfig>(configPadrao)
  const [carregando, setCarregando] = useState(true)

  // Função para carregar configurações do Firestore
  const carregarConfig = async () => {
    try {
      const configRef = doc(db, 'configuracoes', 'igreja')
      const docSnap = await getDoc(configRef)

      if (docSnap.exists()) {
        setConfig({ ...configPadrao, ...docSnap.data() as IgrejaConfig })
        console.log('Configurações carregadas do Firestore:', docSnap.data())
      } else {
        // Se não existir, cria com os valores padrão
        await setDoc(configRef, configPadrao)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setCarregando(false)
    }
  }

  // Carrega as configurações do Firestore ao iniciar
  useEffect(() => {
    carregarConfig()
  }, [])

  // Função para recarregar as configurações sob demanda
  const recarregarConfig = async () => {
    setCarregando(true)
    await carregarConfig()
  }

  // Função para salvar as configurações diretamente no Firestore
  const salvarConfig = async (novaConfig: Partial<IgrejaConfig>) => {
    try {
      // Evita fazer upload de imagens muito grandes
      if (novaConfig.logo && novaConfig.logo.length > 500000) {
        throw new Error('Imagem muito grande. Por favor, use uma imagem menor.')
      }
      
      // Atualiza o estado local primeiro
      const configAtualizada = { ...config, ...novaConfig }
      setConfig(configAtualizada)
      
      // Referência para o documento de configurações
      const configRef = doc(db, 'configuracoes', 'igreja')
      
      // Garante que todas as propriedades estejam definidas
      const configCompleta: IgrejaConfig = {
        nome: configAtualizada.nome || configPadrao.nome,
        nomeAbreviado: configAtualizada.nomeAbreviado || configPadrao.nomeAbreviado,
        logo: configAtualizada.logo || configPadrao.logo,
        endereco: configAtualizada.endereco || configPadrao.endereco,
        cidade: configAtualizada.cidade || configPadrao.cidade,
        estado: configAtualizada.estado || configPadrao.estado,
        cep: configAtualizada.cep || configPadrao.cep,
        telefone: configAtualizada.telefone || configPadrao.telefone,
        email: configAtualizada.email || configPadrao.email,
        site: configAtualizada.site || configPadrao.site,
        corPrimaria: configAtualizada.corPrimaria || configPadrao.corPrimaria,
        corSecundaria: configAtualizada.corSecundaria || configPadrao.corSecundaria,
        horarios: configAtualizada.horarios || configPadrao.horarios,
        proximosEventos: configAtualizada.proximosEventos || configPadrao.proximosEventos
      }
      
      // Tenta salvar com timeout para evitar problemas de rede
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tempo esgotado ao salvar. Verifique sua conexão.')), 10000)
      })
      
      // Salva no Firestore com timeout
      await Promise.race([
        setDoc(configRef, configCompleta),
        timeoutPromise
      ])
      
      console.log('Configurações salvas com sucesso no Firestore')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      // Propaga o erro para o componente tratar
      throw error
    }
  }

  return (
    <IgrejaConfigContext.Provider value={{ config, carregando, salvarConfig, recarregarConfig }}>
      {children}
    </IgrejaConfigContext.Provider>
  )
}

// Hook para usar o contexto
export function useIgrejaConfig() {
  const context = useContext(IgrejaConfigContext)
  if (context === undefined) {
    throw new Error('useIgrejaConfig deve ser usado dentro de um IgrejaConfigProvider')
  }
  return context
} 