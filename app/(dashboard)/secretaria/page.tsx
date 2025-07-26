'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Edit, Trash2, Calendar as CalendarIcon, Mail, Phone, MapPin, User, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useIgrejaConfig } from '@/lib/contexts/igreja-config'
import Image from 'next/image'
import { useCongregacoes } from '@/lib/contexts/congregacoes-context'
import { useAuth } from '@/lib/contexts/auth-context'
import ProtectedRoute from '@/components/auth/protected-route'
import ProtectedContent from '@/components/auth/protected-content'

// Define o esquema de validação para o formulário
const formSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').or(z.string().length(0)),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').or(z.string().length(0)),
  endereco: z.string().min(5, 'Endereço é obrigatório'),
  cidade: z.string().min(2, 'Cidade é obrigatória'),
  estado: z.string().min(2, 'Estado é obrigatório'),
  dataNascimento: z.date().optional(),
  dataBatismo: z.date().optional(),
  batismoEspiritoSanto: z.enum(['sim', 'nao']).optional(),
  congregacaoId: z.string().min(1, 'Congregação é obrigatória'),
  funcao: z.string().optional(),
  status: z.enum(['ativo', 'inativo', 'visitante']),
  avatar: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Define o esquema de validação para o formulário de cartas
const cartaFormSchema = z.object({
  tipo: z.enum(['recomendacao', 'mudanca']),
  destinatario: z.string().min(3, 'O destinatário deve ter pelo menos 3 caracteres'),
  cidade: z.string().min(2, 'A cidade deve ter pelo menos 2 caracteres'),
  membroId: z.string().min(1, 'Selecione um membro'),
})

type CartaFormValues = z.infer<typeof cartaFormSchema>

// Tipo para os membros
type Membro = {
  id: string
  nome: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  dataNascimento?: Date
  dataBatismo?: Date
  batismoEspiritoSanto?: 'sim' | 'nao'
  congregacaoId: string // ID da congregação a que pertence
  congregacao?: string // Nome da congregação (para exibição)
  funcao?: string
  status: 'ativo' | 'inativo' | 'visitante'
  avatar?: string
}

// Tipo para as cartas
type Carta = {
  id: string
  tipo: 'recomendacao' | 'mudanca' | 'agradecimento' | 'outro'
  destinatario: string
  cidade: string
  data: Date
  status: 'pendente' | 'enviada' | 'recebida'
  membro?: string
  membroId?: string
  conteudo?: string
}

export default function SecretariaPage() {
  return (
    <ProtectedRoute
      requiredPermissions={['membros.visualizar']}
      requiredCargos={['super_admin', 'administrador', 'secretario_geral', 'secretario']}
      anyPermission={true}
      checkCongregacao={true}
    >
      <SecretariaContent />
    </ProtectedRoute>
  )
}

function SecretariaContent() {
  const [membros, setMembros] = useState<Membro[]>([])
  const [cartas, setCartas] = useState<Carta[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [membroParaEditar, setMembroParaEditar] = useState<Membro | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cartaDialogOpen, setCartaDialogOpen] = useState(false)
  const [previewCartaOpen, setPreviewCartaOpen] = useState(false)
  const [cartaAtual, setCartaAtual] = useState<Carta | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo' | 'visitante'>('todos')
  const [activeTab, setActiveTab] = useState<"membros" | "cartas">("membros")
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  
  // Obter dados da igreja do contexto
  const { config } = useIgrejaConfig()
  // Usar o contexto de congregações
  const { congregacoes, congregacaoAtual } = useCongregacoes()
  // Usar o contexto de autenticação
  const { userData } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      congregacaoId: '',
      funcao: '',
      status: 'ativo',
      avatar: '',
    }
  })

  const cartaForm = useForm<CartaFormValues>({
    resolver: zodResolver(cartaFormSchema),
    defaultValues: {
      tipo: 'recomendacao',
      destinatario: '',
      cidade: '',
      membroId: '',
    }
  })

  // Função para obter congregações disponíveis baseada no cargo do usuário
  const getCongregacoesDisponiveis = () => {
    // Se for secretário local, mostrar apenas sua congregação
    if (userData?.cargo === 'secretario' && userData?.congregacaoId) {
      const congregacaoUsuario = congregacoes.find(c => c.id === userData.congregacaoId);
      return congregacaoUsuario ? [congregacaoUsuario] : [];
    }
    
    // Se for secretário geral, administrador ou super_admin, mostrar todas
    if (['secretario_geral', 'administrador', 'super_admin'].includes(userData?.cargo || '')) {
      return congregacoes;
    }
    
    // Para outros cargos, mostrar apenas a congregação do usuário
    if (userData?.congregacaoId) {
      const congregacaoUsuario = congregacoes.find(c => c.id === userData.congregacaoId);
      return congregacaoUsuario ? [congregacaoUsuario] : [];
    }
    
    return [];
  };

  const congregacoesDisponiveis = getCongregacoesDisponiveis();

  // Lista de congregações (em um caso real, seria carregado do Firebase)
  const congregacoesList = [
    { id: '1', nome: 'Congregação Sede' },
    { id: '2', nome: 'Congregação Norte' },
    { id: '3', nome: 'Congregação Sul' },
    { id: '4', nome: 'Congregação Leste' },
    { id: '5', nome: 'Congregação Oeste' },
  ]

  // Lista de funções na igreja
  const funcoes = [
    'Membro',
    'Diácono',
    'Presbítero',
    'Evangelista',
    'Pastor',
    'Líder de Louvor',
    'Líder de Jovens',
    'Líder de Crianças',
    'Tesoureiro',
    'Secretário',
    'Outro'
  ]

  // Simula o carregamento de membros e cartas
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        // Buscar membros do Firebase
        const membrosRef = collection(db, 'membros');
        const membrosSnapshot = await getDocs(membrosRef);
        const membrosData: Membro[] = [];
        
        membrosSnapshot.forEach((doc) => {
          const data = doc.data();
          const membro = {
            id: doc.id,
            nome: data.nome,
            email: data.email,
            telefone: data.telefone,
            endereco: data.endereco,
            cidade: data.cidade,
            estado: data.estado,
            dataNascimento: data.dataNascimento ? new Date(data.dataNascimento.toDate()) : undefined,
            dataBatismo: data.dataBatismo ? new Date(data.dataBatismo.toDate()) : undefined,
            batismoEspiritoSanto: data.batismoEspiritoSanto,
            congregacaoId: data.congregacaoId,
            congregacao: congregacoes.find(c => c.id === data.congregacaoId)?.nome,
            funcao: data.funcao,
            status: data.status,
            avatar: data.avatar
          };
          
          membrosData.push(membro);
        });
        
        // Buscar cartas do Firebase
        const cartasRef = collection(db, 'cartas');
        const cartasSnapshot = await getDocs(cartasRef);
        const cartasData: Carta[] = [];
        
        cartasSnapshot.forEach((doc) => {
          const data = doc.data();
          cartasData.push({
            id: doc.id,
            tipo: data.tipo,
            destinatario: data.destinatario,
            cidade: data.cidade,
            data: data.data ? new Date(data.data.toDate()) : new Date(),
            status: data.status as 'pendente' | 'enviada' | 'recebida',
            membro: data.membro,
            membroId: data.membroId,
            conteudo: data.conteudo
          });
        });
        
        // Filtrar membros baseado no cargo do usuário
        let membrosFiltrados = membrosData;
        
        // Se for secretário local, filtrar apenas membros da sua congregação
        if (userData?.cargo === 'secretario' && userData?.congregacaoId) {
          membrosFiltrados = membrosData.filter(m => m.congregacaoId === userData.congregacaoId);
          console.log('Secretário local - Filtrando membros da congregação:', userData.congregacaoId);
        }
        
        // Se for secretário geral, administrador ou super_admin, ver todos os membros
        if (['secretario_geral', 'administrador', 'super_admin'].includes(userData?.cargo || '')) {
          membrosFiltrados = membrosData;
          console.log('Cargo geral - Vendo todos os membros');
        }
        
        console.log('Membros carregados:', membrosData.length);
        console.log('Membros filtrados:', membrosFiltrados.length);
        console.log('Cargo do usuário:', userData?.cargo);
        console.log('Congregação do usuário:', userData?.congregacaoId);
        
        setMembros(membrosFiltrados);
        setCartas(cartasData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [congregacoes, userData]);

  // Filtra membros com base na busca, status e congregação atual
  const membrosFiltrados = membros.filter(membro => {
    const matchesSearch = membro.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      membro.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (membro.congregacao && membro.congregacao.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (membro.funcao && membro.funcao.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = filtroStatus === 'todos' || membro.status === filtroStatus
    
    // Filtro por congregação - se não tiver congregação atual ou for admin, mostra todos
    // Se tiver congregação atual, filtra apenas os membros dessa congregação
    // Se o membro não tiver congregacaoId definido, mostra para todos (membros antigos)
    const matchesCongregacao = !congregacaoAtual || 
                               membro.congregacaoId === congregacaoAtual.id || 
                               !membro.congregacaoId
    

    
    return matchesSearch && matchesStatus && matchesCongregacao
  })

  // Organiza membros por nome
  const membrosOrdenados = [...membrosFiltrados].sort((a, b) => a.nome.localeCompare(b.nome))



  // Contagens para estatísticas
  const totalAtivos = membros.filter(m => m.status === 'ativo').length
  const totalInativos = membros.filter(m => m.status === 'inativo').length
  const totalVisitantes = membros.filter(m => m.status === 'visitante').length

  // Abre o diálogo para edição
  const handleEditarMembro = (membro: Membro) => {
    setMembroParaEditar(membro)
    setFotoPreview(membro.avatar || null)
    form.reset({
      nome: membro.nome,
      email: membro.email,
      telefone: membro.telefone,
      endereco: membro.endereco,
      cidade: membro.cidade,
      estado: membro.estado,
      dataNascimento: membro.dataNascimento,
      dataBatismo: membro.dataBatismo,
      batismoEspiritoSanto: membro.batismoEspiritoSanto,
      congregacaoId: membro.congregacaoId,
      funcao: membro.funcao,
      status: membro.status,
      avatar: membro.avatar,
    })
    setDialogOpen(true)
  }

  // Abre o diálogo para criar novo membro
  const handleNovoMembro = () => {
    setMembroParaEditar(null)
    setFotoPreview(null)
    
    // Se for secretário local, definir automaticamente a congregação
    let congregacaoPadrao = congregacaoAtual?.id || '';
    if (userData?.cargo === 'secretario' && userData?.congregacaoId) {
      congregacaoPadrao = userData.congregacaoId;
    }
    
    form.reset({
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      dataNascimento: undefined,
      dataBatismo: undefined,
      batismoEspiritoSanto: undefined,
      congregacaoId: congregacaoPadrao,
      funcao: '',
      status: 'ativo',
      avatar: '',
    })
    setDialogOpen(true)
  }

  // Exclui um membro
  const handleExcluirMembro = async (id: string) => {
    try {
      // Excluir membro do Firebase
      await deleteDoc(doc(db, 'membros', id));
      
      // Atualizar estado local
      setMembros(membros.filter(membro => membro.id !== id));
    } catch (error) {
      console.error("Erro ao excluir membro:", error);
    }
  };

  // Salva o formulário (criação/edição)
  const onSubmit = async (values: FormValues) => {
    try {
      // Verificar se uma foto foi selecionada
      if (!fotoPreview && !membroParaEditar?.avatar) {
        alert("Por favor, adicione uma foto para o membro.");
        return;
      }
      
      const dadosMembro = {
        ...values,
        avatar: fotoPreview || values.avatar || '',
        dataCadastro: new Date(),
        ultimaAtualizacao: new Date()
      };
      
      if (membroParaEditar) {
        // Atualiza membro existente
        await updateDoc(doc(db, 'membros', membroParaEditar.id), dadosMembro);
        
        // Encontrar o nome da congregação para exibição
        const congregacaoNome = congregacoes.find(c => c.id === dadosMembro.congregacaoId)?.nome;
        
        setMembros(membros.map(m => 
          m.id === membroParaEditar.id 
            ? {...dadosMembro, id: membroParaEditar.id, congregacao: congregacaoNome} as Membro 
            : m
        ));
      } else {
        // Cria novo membro
        const novoDoc = doc(collection(db, 'membros'));
        await setDoc(novoDoc, dadosMembro);
        
        // Adiciona ao estado local com o nome da congregação para exibição
        const congregacaoNome = congregacoes.find(c => c.id === dadosMembro.congregacaoId)?.nome;
        
        setMembros([...membros, {
          ...dadosMembro, 
          id: novoDoc.id,
          congregacao: congregacaoNome
        } as Membro]);
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar membro:", error);
    }
  };

  // Abre o diálogo para criar nova carta
  const handleNovaCarta = () => {
    cartaForm.reset({
      tipo: 'recomendacao',
      destinatario: '',
      cidade: '',
      membroId: '',
    })
    setCartaAtual(null)
    setCartaDialogOpen(true)
  }

  // Visualiza uma carta existente
  const handleVisualizarCarta = (carta: Carta) => {
    setCartaAtual(carta)
    setPreviewCartaOpen(true)
  }
  
  // Exclui uma carta
  const handleExcluirCarta = async (id: string) => {
    try {
      // Excluir carta do Firebase
      await deleteDoc(doc(db, 'cartas', id));
      
      // Atualizar estado local
      setCartas(cartas.filter(carta => carta.id !== id));
    } catch (error) {
      console.error("Erro ao excluir carta:", error);
    }
  };

  // Salva o formulário de carta
  const onSubmitCarta = async (values: CartaFormValues) => {
    try {
      const membroSelecionado = membros.find(m => m.id === values.membroId);
      
      if (!membroSelecionado) {
        return; // Membro não encontrado
      }
      
      const novaCartaData = {
        tipo: values.tipo,
        destinatario: values.destinatario,
        cidade: values.cidade,
        data: new Date(),
        status: 'pendente' as 'pendente' | 'enviada' | 'recebida',
        membro: membroSelecionado.nome,
        membroId: membroSelecionado.id,
        conteudo: values.tipo === 'recomendacao'
          ? `Apresentamos as Igrejas Evangélicas na Cidade de ${values.cidade}, o(a) irmão(ã) ${membroSelecionado.nome}, membro desta igreja. Por se achar em plena comunhão com essa Igreja, nós a recomendamos que recebais em comunhão no Senhor como usam fazer os Santos.`
          : `Comunicamos que o(a) irmão(ã) ${membroSelecionado.nome}, portador(a) deste, era membro em plena comunhão desta Igreja, e a pedido seu concedemos-lhe esta Carta Demissória para se unir à igreja de vossa direção.`
      };
      
      // Adicionar ao Firebase
      const docRef = await addDoc(collection(db, 'cartas'), novaCartaData);
      
      // Adicionar ao estado local com o ID gerado pelo Firebase
      const novaCarta: Carta = {
        id: docRef.id,
        ...novaCartaData
      };
      
      setCartas([...cartas, novaCarta]);
      setCartaDialogOpen(false);
      
      // Abre a visualização da carta
      setCartaAtual(novaCarta);
      setPreviewCartaOpen(true);
    } catch (error) {
      console.error("Erro ao salvar carta:", error);
    }
  };

  // Função para lidar com o upload de fotos
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setFotoPreview(result)
        form.setValue('avatar', result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Secretaria</h1>
        <ProtectedContent
          permissions={['membros.adicionar']}
          cargos={['administrador', 'secretario', 'pastor']}
          anyPermission={true}
        >
          <Button onClick={handleNovoMembro}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Membro
          </Button>
        </ProtectedContent>
      </div>

      <Tabs defaultValue="membros" className="w-full" onValueChange={(value) => setActiveTab(value as "membros" | "cartas")}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="membros" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Membros
          </TabsTrigger>
          <TabsTrigger value="cartas" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Cartas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="membros" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Gestão de Membros</h2>
              <p className="text-muted-foreground">Gerencie os membros da igreja, seus dados e status.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-800">Total de Membros</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-700">{membros.length}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-800">Membros Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-700">{totalAtivos}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-800">Membros Inativos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-orange-700">{totalInativos}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-800">Visitantes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-700">{totalVisitantes}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Lista de Membros</CardTitle>
                <div className="flex gap-4 w-full sm:w-auto">
                  <Tabs defaultValue="todos" className="w-full sm:w-[200px]" onValueChange={(value) => setFiltroStatus(value as any)}>
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="todos">Todos</TabsTrigger>
                      <TabsTrigger value="ativo">Ativos</TabsTrigger>
                      <TabsTrigger value="inativo">Inativos</TabsTrigger>
                      <TabsTrigger value="visitante">Visitantes</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar membros..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-12 bg-gray-200 rounded-md mb-4"></div>
                    </div>
                  ))}
                </div>
              ) : membrosOrdenados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum membro encontrado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Congregação</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {membrosOrdenados.map((membro) => (
                        <TableRow key={membro.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src={membro.avatar} alt={membro.nome} />
                                <AvatarFallback>{membro.nome.charAt(0) + membro.nome.split(' ')[1]?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{membro.nome}</p>
                                <p className="text-xs text-gray-500">
                                  {membro.dataNascimento && (
                                    <>Nasc: {format(membro.dataNascimento, "dd/MM/yyyy")}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Mail className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                {membro.email}
                              </div>
                              <div className="flex items-center text-sm">
                                <Phone className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                {membro.telefone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{membro.congregacao}</TableCell>
                          <TableCell>{membro.funcao || 'Membro'}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${membro.status === 'ativo' 
                                ? 'bg-green-100 text-green-800' 
                                : membro.status === 'inativo' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                              {membro.status === 'ativo' 
                                ? 'Ativo' 
                                : membro.status === 'inativo' 
                                  ? 'Inativo' 
                                  : 'Visitante'
                              }
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <ProtectedContent
                              permissions={['membros.editar']}
                              cargos={['administrador', 'secretario', 'pastor']}
                              anyPermission={true}
                            >
                              <Button
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditarMembro(membro)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </ProtectedContent>
                            <ProtectedContent
                              permissions={['membros.excluir']}
                              cargos={['administrador']}
                              anyPermission={true}
                            >
                              <Button
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500"
                                onClick={() => handleExcluirMembro(membro.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </ProtectedContent>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cartas" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Gestão de Cartas</h2>
              <p className="text-muted-foreground">Gerencie as cartas de recomendação e transferência.</p>
            </div>
            <Button onClick={handleNovaCarta}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Carta
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Lista de Cartas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="h-12 bg-gray-200 rounded-md mb-4"></div>
                    </div>
                  ))}
                </div>
              ) : cartas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma carta encontrada.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleNovaCarta}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Carta
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Membro</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cartas.map((carta) => (
                        <TableRow key={carta.id}>
                          <TableCell>
                            {carta.tipo === 'recomendacao' 
                              ? 'Recomendação' 
                              : carta.tipo === 'mudanca' 
                                ? 'Mudança' 
                                : carta.tipo === 'agradecimento' 
                                  ? 'Agradecimento' 
                                  : 'Outro'
                            }
                          </TableCell>
                          <TableCell>{carta.destinatario}</TableCell>
                          <TableCell>{carta.membro || '-'}</TableCell>
                          <TableCell>{format(carta.data, "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${carta.status === 'pendente' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : carta.status === 'enviada' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                              {carta.status === 'pendente' 
                                ? 'Pendente' 
                                : carta.status === 'enviada' 
                                  ? 'Enviada' 
                                  : 'Recebida'
                              }
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleVisualizarCarta(carta)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500"
                              onClick={() => handleExcluirCarta(carta.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para criar cartas */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {membroParaEditar ? 'Editar Membro' : 'Novo Membro'}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes do membro abaixo.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <Avatar className="w-24 h-24 cursor-pointer hover:opacity-80">
                    <AvatarImage src={fotoPreview || (membroParaEditar?.avatar ?? '')} alt="Foto do membro" />
                    <AvatarFallback className="text-xl">
                      {form.getValues().nome 
                        ? form.getValues().nome.charAt(0) + (form.getValues().nome.split(' ')[1]?.charAt(0) || '')
                        : 'MF'}
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="foto-upload"
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 cursor-pointer shadow-md hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                  </label>
                  <input 
                    id="foto-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFotoChange}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {fotoPreview 
                    ? "Foto selecionada. Clique no ícone + para alterar." 
                    : "É necessário adicionar uma foto para o membro."}
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="endereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Endereço completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataNascimento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Nascimento</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        <FormControl>
                          <Select
                            value={field.value ? field.value.getDate().toString() : ""}
                            onValueChange={(value) => {
                              if (field.value) {
                                const newDate = new Date(field.value);
                                newDate.setDate(parseInt(value));
                                field.onChange(newDate);
                              } else {
                                const newDate = new Date();
                                newDate.setDate(parseInt(value));
                                field.onChange(newDate);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Dia" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        
                        <FormControl>
                          <Select
                            value={field.value ? (field.value.getMonth() + 1).toString() : ""}
                            onValueChange={(value) => {
                              if (field.value) {
                                const newDate = new Date(field.value);
                                newDate.setMonth(parseInt(value) - 1);
                                field.onChange(newDate);
                              } else {
                                const newDate = new Date();
                                newDate.setMonth(parseInt(value) - 1);
                                field.onChange(newDate);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Mês" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                              ].map((month, index) => (
                                <SelectItem key={index + 1} value={(index + 1).toString()}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        
                        <FormControl>
                          <Select
                            value={field.value ? field.value.getFullYear().toString() : ""}
                            onValueChange={(value) => {
                              if (field.value) {
                                const newDate = new Date(field.value);
                                newDate.setFullYear(parseInt(value));
                                field.onChange(newDate);
                              } else {
                                const newDate = new Date();
                                newDate.setFullYear(parseInt(value));
                                field.onChange(newDate);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dataBatismo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Batismo</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        <FormControl>
                          <Select
                            value={field.value ? field.value.getDate().toString() : ""}
                            onValueChange={(value) => {
                              if (field.value) {
                                const newDate = new Date(field.value);
                                newDate.setDate(parseInt(value));
                                field.onChange(newDate);
                              } else {
                                const newDate = new Date();
                                newDate.setDate(parseInt(value));
                                field.onChange(newDate);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Dia" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                <SelectItem key={day} value={day.toString()}>
                                  {day.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        
                        <FormControl>
                          <Select
                            value={field.value ? (field.value.getMonth() + 1).toString() : ""}
                            onValueChange={(value) => {
                              if (field.value) {
                                const newDate = new Date(field.value);
                                newDate.setMonth(parseInt(value) - 1);
                                field.onChange(newDate);
                              } else {
                                const newDate = new Date();
                                newDate.setMonth(parseInt(value) - 1);
                                field.onChange(newDate);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Mês" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                              ].map((month, index) => (
                                <SelectItem key={index + 1} value={(index + 1).toString()}>
                                  {month}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        
                        <FormControl>
                          <Select
                            value={field.value ? field.value.getFullYear().toString() : ""}
                            onValueChange={(value) => {
                              if (field.value) {
                                const newDate = new Date(field.value);
                                newDate.setFullYear(parseInt(value));
                                field.onChange(newDate);
                              } else {
                                const newDate = new Date();
                                newDate.setFullYear(parseInt(value));
                                field.onChange(newDate);
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="batismoEspiritoSanto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batismo no Espírito Santo?</FormLabel>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="batismo-sim"
                          name="batismoEspiritoSanto"
                          value="sim"
                          checked={field.value === 'sim'}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="batismo-sim" className="text-sm font-medium">
                          Sim
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="batismo-nao"
                          name="batismoEspiritoSanto"
                          value="nao"
                          checked={field.value === 'nao'}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                        />
                        <label htmlFor="batismo-nao" className="text-sm font-medium">
                          Não
                        </label>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="congregacaoId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Congregação</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma congregação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {congregacoesDisponiveis.map((congregacao) => (
                            <SelectItem key={congregacao.id} value={congregacao.id}>
                              {congregacao.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="funcao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {funcoes.map((funcao) => (
                            <SelectItem key={funcao} value={funcao}>
                              {funcao}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="visitante">Visitante</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6 sticky bottom-0 bg-white pt-2 pb-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para criar cartas */}
      <Dialog open={cartaDialogOpen} onOpenChange={setCartaDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Carta</DialogTitle>
            <DialogDescription>
              Selecione o membro e insira os detalhes da carta.
            </DialogDescription>
          </DialogHeader>
          <Form {...cartaForm}>
            <form onSubmit={cartaForm.handleSubmit(onSubmitCarta)} className="space-y-4">
              <FormField
                control={cartaForm.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Carta</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="recomendacao">Carta de Recomendação</SelectItem>
                        <SelectItem value="mudanca">Carta de Mudança</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={cartaForm.control}
                name="membroId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Membro</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um membro" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {membros.filter(m => m.status === 'ativo').map((membro) => (
                          <SelectItem key={membro.id} value={membro.id}>
                            {membro.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={cartaForm.control}
                name="destinatario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destinatário</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da igreja destinatária" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={cartaForm.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade de destino" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Gerar Carta</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Diálogo para visualizar/imprimir a carta */}
      <Dialog open={previewCartaOpen} onOpenChange={setPreviewCartaOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização da Carta</DialogTitle>
            <DialogDescription>
              Clique em Imprimir para salvar ou imprimir esta carta.
            </DialogDescription>
          </DialogHeader>
          
          {cartaAtual && (
            <div className="p-6 border rounded-md bg-white">
              <div className="text-center mb-6 space-y-2">
                <div className="h-20 w-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  {config.logo ? (
                    <Image src={config.logo} alt={config.nome} width={80} height={80} className="rounded-full object-cover" />
                  ) : (
                    <div className="text-xs text-gray-500">LOGO</div>
                  )}
                </div>
                <h1 className="text-xl font-bold uppercase">{config.nome}</h1>
                <p className="text-sm text-gray-600">{config.endereco}</p>
                <p className="text-sm text-gray-600">{config.cidade} / {config.estado} - CEP: {config.cep}</p>
                <p className="text-sm text-gray-600">Tel: {config.telefone} - Email: {config.email}</p>
                {config.site && <p className="text-sm text-gray-600">Site: {config.site}</p>}
              </div>
              
              <h2 className="text-center text-xl font-bold mb-8">
                {cartaAtual.tipo === 'recomendacao' ? 'CARTA DE RECOMENDAÇÃO' : 'CARTA DE MUDANÇA'}
              </h2>
              
              <p className="mb-6 font-semibold">Saudações do Senhor:</p>
              
              <div className="mb-8 text-justify">
                {cartaAtual.tipo === 'recomendacao' ? (
                  <p>
                    Apresentamos às Igrejas Evangélicas na Cidade de{' '}
                    <span className="font-semibold">{cartaAtual.cidade}</span>, o(a) irmão(ã){' '}
                    <span className="font-semibold uppercase">{cartaAtual.membro}</span>, membro desta igreja.
                    <br /><br />
                    Por se achar em plena comunhão com essa Igreja, nós a recomendamos que recebais em comunhão no Senhor como usam fazer os Santos.
                  </p>
                ) : (
                  <p>
                    Comunicamos que o(a) irmão(ã){' '}
                    <span className="font-semibold uppercase">{cartaAtual.membro}</span>, portador(a) deste, era membro em plena comunhão desta Igreja, e a pedido seu concedemos-lhe esta Carta Demissória para se unir à igreja de vossa direção.
                  </p>
                )}
              </div>
              
              <p className="mb-8">
                Pela {config.nome} em {config.cidade} / {config.estado}.
              </p>
              
              <div className="text-center">
                <div className="border-t border-gray-400 w-48 mx-auto pt-2">
                  <p>Pastor</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setPreviewCartaOpen(false)}
            >
              Fechar
            </Button>
            <Button 
              type="button"
              onClick={() => window.print()}
            >
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}