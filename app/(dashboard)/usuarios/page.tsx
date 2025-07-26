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
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Shield, 
  User as UserIcon,
  UserCheck,
  UserMinus,
  Church,
  Key,
  FileText,
  Coins
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { collection, getDocs, deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '@/lib/firebase/config'
import { useAuth } from '@/lib/contexts/auth-context'
import { useCongregacoes } from '@/lib/contexts/congregacoes-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Cargo } from '@/lib/types'
import { permissoesPorCargo } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import ProtectedRoute from '@/components/auth/protected-route'
import ProtectedContent from '@/components/auth/protected-content'
import { toast } from 'sonner'

// Tipo para os convites
type Convite = {
  id: string;
  email: string;
  nome: string;
  cargo: string;
  congregacaoId: string;
  token: string;
  status: 'pendente' | 'aceito' | 'expirado';
  dataCriacao: Date;
  dataExpiracao: Date;
  criadoPor: string;
  criadoPorId?: string;
  criadoPorNome?: string;
}

// Define o esquema de validação para o formulário de cadastro
const formSchema = z.object({
  nome: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().optional(),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  congregacaoId: z.string().min(1, 'Congregação é obrigatória'),
})

type FormValues = z.infer<typeof formSchema>

// Tipo para os usuários
type Usuario = {
  id: string
  nome: string
  email: string
  cargo: Cargo
  congregacaoId: string
  congregacao?: string
  permissoes: string[]
  dataCadastro: Date
  ultimoAcesso: Date
  status: 'ativo' | 'inativo'
}

export default function UsuariosPage() {
  return (
    <ProtectedRoute
      requiredPermissions={['usuarios.visualizar']}
      requiredCargos={['super_admin', 'administrador']}
      anyPermission={true}
    >
      <UsuariosContent />
    </ProtectedRoute>
  )
}

function UsuariosContent() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [convites, setConvites] = useState<Convite[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos')
  const [activeTab, setActiveTab] = useState<"usuarios" | "convites">("usuarios")
  const [enviandoConvite, setEnviandoConvite] = useState(false)
  const [sucessoConvite, setSucessoConvite] = useState(false)
  const [erroConvite, setErroConvite] = useState<string | null>(null)
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<Usuario | null>(null)
  
  // Obter dados de autenticação e congregações dos contextos
  const { user, userData } = useAuth()
  const { congregacoes } = useCongregacoes()
  
  useEffect(() => {
    console.log('Congregações disponíveis no contexto:', congregacoes);
    console.log('Usuário logado:', userData);
    console.log('Cargo do usuário logado:', userData?.cargo);
    console.log('Permissões do usuário logado:', userData?.permissoes);
  }, [congregacoes, userData]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      cargo: 'usuario',
      congregacaoId: userData?.congregacaoId || '',
    }
  })

  // Carregar usuários e convites
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      try {
        // Buscar usuários
        const usuariosRef = collection(db, 'usuarios')
        const usuariosSnapshot = await getDocs(usuariosRef)
        const usuariosData: Usuario[] = []
        
        usuariosSnapshot.forEach((doc) => {
          const data = doc.data()
          const congregacao = congregacoes.find(c => c.id === data.congregacaoId)
          
          usuariosData.push({
            id: doc.id,
            nome: data.nome,
            email: data.email,
            cargo: data.cargo,
            congregacaoId: data.congregacaoId,
            congregacao: congregacao?.nome,
            permissoes: data.permissoes || [],
            dataCadastro: data.dataCadastro?.toDate() || new Date(),
            ultimoAcesso: data.ultimoAcesso?.toDate() || new Date(),
            status: data.status || 'ativo'
          })
        })
        
        setUsuarios(usuariosData)
        
        // Buscar convites
        const convitesRef = collection(db, 'convites')
        const convitesSnapshot = await getDocs(convitesRef)
        const convitesData: Convite[] = []
        
        convitesSnapshot.forEach((doc) => {
          const data = doc.data()
          
          convitesData.push({
            id: doc.id,
            email: data.email,
            nome: data.nome || '',
            cargo: data.perfil || data.cargo,
            congregacaoId: data.congregacao || data.congregacaoId,
            token: data.token,
            status: data.status,
            dataCriacao: data.dataCriacao?.toDate() || new Date(),
            dataExpiracao: data.dataExpiracao?.toDate() || new Date(),
            criadoPor: data.criadoPorNome || data.criadoPor || 'Sistema',
            criadoPorId: data.criadoPorId,
            criadoPorNome: data.criadoPorNome
          })
        })
        
        setConvites(convitesData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [congregacoes, userData?.congregacaoId])

  // Filtra usuários com base na busca e status
  const usuariosFiltrados = usuarios.filter(usuario => {
    const matchesSearch = 
      usuario.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (usuario.congregacao && usuario.congregacao.toLowerCase().includes(searchQuery.toLowerCase())) ||
      usuario.cargo.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filtroStatus === 'todos' || usuario.status === filtroStatus
    
    return matchesSearch && matchesStatus
  })

  // Organiza usuários por nome
  const usuariosOrdenados = [...usuariosFiltrados].sort((a, b) => a.nome.localeCompare(b.nome))

  // Filtra convites (pendentes primeiro, depois por data de criação)
  const convitesOrdenados = [...convites].sort((a, b) => {
    if (a.status === 'pendente' && b.status !== 'pendente') return -1
    if (a.status !== 'pendente' && b.status === 'pendente') return 1
    return b.dataCriacao.getTime() - a.dataCriacao.getTime()
  })

  // Abre o diálogo para cadastrar novo usuário
  const handleNovoUsuario = () => {
    setUsuarioParaEditar(null)
    setSucessoConvite(false)
    setErroConvite(null)
    
    console.log('Congregações disponíveis:', congregacoes);
    
    // Se não houver congregações, ainda assim precisamos de um valor padrão
    const defaultCongregacaoId = congregacoes.length > 0 
      ? (userData?.congregacaoId || congregacoes[0].id) 
      : 'default';
    
    form.reset({
      nome: '',
      email: '',
      senha: '',
      cargo: 'usuario',
      congregacaoId: defaultCongregacaoId,
    })
    setDialogOpen(true)
  }

  // Cadastra novo usuário ou edita usuário existente
  const onSubmit = async (values: FormValues) => {
    setEnviandoConvite(true)
    setSucessoConvite(false)
    setErroConvite(null)
    
    try {
      // Se estiver editando, não verificar email duplicado
      if (!usuarioParaEditar) {
        // Verificar se o email já existe apenas para novos usuários
        const usuariosRef = collection(db, 'usuarios')
        const usuariosSnapshot = await getDocs(usuariosRef)
        const emailExiste = usuariosSnapshot.docs.some(doc => doc.data().email === values.email)
        
        if (emailExiste) {
          throw new Error('Este email já está cadastrado no sistema')
        }
      }

      // Encontrar a congregação selecionada
      let congregacaoId = "matriz";
      let congregacaoNome = "Congregação Matriz";
      
      if (values.congregacaoId !== "default" && congregacoes.length > 0) {
        const congregacaoSelecionada = congregacoes.find(c => c.id === values.congregacaoId);
        if (congregacaoSelecionada) {
          congregacaoId = congregacaoSelecionada.id;
          congregacaoNome = congregacaoSelecionada.nome;
        }
      }

      if (usuarioParaEditar) {
        // EDITAR USUÁRIO EXISTENTE
        const permissoes = permissoesPorCargo[values.cargo as Cargo] || permissoesPorCargo['usuario']
        
        // Atualizar documento no Firestore
        await updateDoc(doc(db, 'usuarios', usuarioParaEditar.id), {
          nome: values.nome,
          email: values.email,
          cargo: values.cargo as Cargo,
          congregacaoId: congregacaoId,
          permissoes: permissoes,
          ultimaAtualizacao: new Date()
        })

        // Atualizar estado local
        setUsuarios(usuarios.map(u => 
          u.id === usuarioParaEditar.id 
            ? { ...u, nome: values.nome, email: values.email, cargo: values.cargo as Cargo, congregacaoId: congregacaoId, congregacao: congregacaoNome, permissoes }
            : u
        ))

        toast.success('Usuário atualizado com sucesso!')
      } else {
        // CRIAR NOVO USUÁRIO
        // Criar usuário no Firebase Auth
        if (!values.senha) {
          throw new Error('Senha é obrigatória para novos usuários')
        }
        
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.senha
        )

        // Obter permissões baseadas no cargo
        const permissoes = permissoesPorCargo[values.cargo as Cargo] || permissoesPorCargo['usuario']

        // Criar documento do usuário no Firestore
        const userData = {
          nome: values.nome,
          email: values.email,
          cargo: values.cargo as Cargo,
          congregacaoId: congregacaoId,
          permissoes: permissoes,
          dataCadastro: new Date(),
          ultimoAcesso: new Date(),
          status: 'ativo' as const
        }

        await setDoc(doc(db, 'usuarios', userCredential.user.uid), userData)

        // Adicionar o novo usuário à lista
        const novoUsuario: Usuario = {
          id: userCredential.user.uid,
          nome: values.nome,
          email: values.email,
          cargo: values.cargo as Cargo,
          congregacaoId: congregacaoId,
          congregacao: congregacaoNome,
          permissoes: permissoes,
          dataCadastro: new Date(),
          ultimoAcesso: new Date(),
          status: 'ativo'
        }

        setUsuarios([...usuarios, novoUsuario])
        setSucessoConvite(true)
      }

      // Fechar diálogo
      setTimeout(() => {
        setDialogOpen(false)
        setSucessoConvite(false)
        setUsuarioParaEditar(null)
      }, 3000)
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error)
      setErroConvite(error instanceof Error ? error.message : 'Erro ao cadastrar usuário')
    } finally {
      setEnviandoConvite(false)
    }
  }

  // Cancelar um convite
  const handleCancelarConvite = async (id: string) => {
    try {
      await fetch(`/api/convites?id=${id}`, {
        method: 'DELETE'
      })
      
      // Remover o convite da lista
      setConvites(convites.filter(c => c.id !== id))
    } catch (error) {
      console.error('Erro ao cancelar convite:', error)
    }
  }

  // Editar usuário
  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioParaEditar(usuario)
    form.reset({
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
      congregacaoId: usuario.congregacaoId,
      senha: '', // Não preenchemos a senha na edição
    })
    setDialogOpen(true)
  }

  // Alterar status do usuário (ativar/desativar)
  const handleAlterarStatusUsuario = async (usuario: Usuario) => {
    try {
      const novoStatus = usuario.status === 'ativo' ? 'inativo' : 'ativo'
      
      // Atualizar no Firestore
      await updateDoc(doc(db, 'usuarios', usuario.id), {
        status: novoStatus,
        ultimaAtualizacao: new Date()
      })
      
      // Atualizar estado local
      setUsuarios(usuarios.map(u => 
        u.id === usuario.id 
          ? { ...u, status: novoStatus }
          : u
      ))
      
      toast.success(`Usuário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`)
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  // Excluir usuário
  const handleExcluirUsuario = async (usuario: Usuario) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${usuario.nome}? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      // Excluir do Firestore
      await deleteDoc(doc(db, 'usuarios', usuario.id))
      
      // Remover da lista local
      setUsuarios(usuarios.filter(u => u.id !== usuario.id))
      
      toast.success('Usuário excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast.error('Erro ao excluir usuário')
    }
  }

  // Redefinir senha do usuário
  const handleRedefinirSenha = async (usuario: Usuario) => {
    if (!confirm(`Deseja redefinir a senha do usuário ${usuario.nome}?`)) {
      return
    }

    try {
      // Gerar nova senha aleatória
      const novaSenha = Math.random().toString(36).slice(-8)
      
      // Atualizar senha no Firebase Auth
      // Nota: Isso requer privilégios de admin no Firebase
      // Por enquanto, vamos apenas mostrar a nova senha
      
      toast.success(`Nova senha gerada: ${novaSenha}`)
      console.log('Nova senha para', usuario.email, ':', novaSenha)
    } catch (error) {
      console.error('Erro ao redefinir senha:', error)
      toast.error('Erro ao redefinir senha')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <ProtectedContent
          permissions={['usuarios.adicionar']}
          cargos={['super_admin', 'administrador']}
          anyPermission={true}
        >
          <Button onClick={handleNovoUsuario}>
            <Plus className="mr-2 h-4 w-4" />
            Cadastrar Usuário
          </Button>
        </ProtectedContent>
      </div>

      <Tabs defaultValue="usuarios" className="w-full" onValueChange={(value) => setActiveTab(value as "usuarios" | "convites")}>
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="usuarios" className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="convites" className="flex items-center">
            <Mail className="mr-2 h-4 w-4" />
            Histórico de Convites
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="usuarios" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{usuarios.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Usuários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{usuarios.filter(u => u.status === 'ativo').length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Administradores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{usuarios.filter(u => u.cargo === 'administrador').length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Lista de Usuários</CardTitle>
                <div className="flex gap-4 w-full sm:w-auto">
                  <Tabs defaultValue="todos" className="w-full sm:w-[200px]" onValueChange={(value) => setFiltroStatus(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="todos">Todos</TabsTrigger>
                      <TabsTrigger value="ativo">Ativos</TabsTrigger>
                      <TabsTrigger value="inativo">Inativos</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar usuários..."
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
              ) : usuariosOrdenados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum usuário encontrado.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleNovoUsuario}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Usuário
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Congregação</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuariosOrdenados.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{usuario.nome.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{usuario.nome}</div>
                            </div>
                          </TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {usuario.cargo === 'super_admin' ? (
                                <Shield className="mr-1 h-4 w-4 text-red-600" />
                              ) : usuario.cargo === 'administrador' ? (
                                <Shield className="mr-1 h-4 w-4 text-primary" />
                              ) : usuario.cargo === 'pastor' ? (
                                <Church className="mr-1 h-4 w-4 text-emerald-600" />
                              ) : usuario.cargo === 'secretario_geral' ? (
                                <FileText className="mr-1 h-4 w-4 text-blue-600" />
                              ) : usuario.cargo === 'tesoureiro_geral' ? (
                                <Coins className="mr-1 h-4 w-4 text-yellow-600" />
                              ) : (
                                <UserIcon className="mr-1 h-4 w-4 text-gray-500" />
                              )}
                              <span className="capitalize">{usuario.cargo.replace('_', ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{usuario.congregacao || 'Matriz'}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${usuario.status === 'ativo' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                              }`}>
                              {usuario.status === 'ativo' 
                                ? 'Ativo' 
                                : 'Inativo'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(usuario.ultimoAcesso, "dd/MM/yy HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <ProtectedContent
                                permissions={['usuarios.editar']}
                                cargos={['super_admin', 'administrador']}
                                anyPermission={true}
                              >
                                <Button
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditarUsuario(usuario)}
                                  title="Editar usuário"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </ProtectedContent>
                              
                              <ProtectedContent
                                permissions={['usuarios.editar']}
                                cargos={['super_admin', 'administrador']}
                                anyPermission={true}
                              >
                                <Button
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleRedefinirSenha(usuario)}
                                  title="Redefinir senha"
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                              </ProtectedContent>
                              
                              <ProtectedContent
                                permissions={['usuarios.editar']}
                                cargos={['super_admin', 'administrador']}
                                anyPermission={true}
                              >
                                <Button
                                  variant="ghost" 
                                  size="icon" 
                                  className={usuario.status === 'ativo' ? 'text-orange-500' : 'text-green-500'}
                                  onClick={() => handleAlterarStatusUsuario(usuario)}
                                  title={usuario.status === 'ativo' ? 'Desativar usuário' : 'Ativar usuário'}
                                >
                                  {usuario.status === 'ativo' ? (
                                    <UserMinus className="h-4 w-4" />
                                  ) : (
                                    <UserCheck className="h-4 w-4" />
                                  )}
                                </Button>
                              </ProtectedContent>
                              
                              <ProtectedContent
                                permissions={['usuarios.excluir']}
                                cargos={['super_admin', 'administrador']}
                                anyPermission={true}
                              >
                                <Button
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-500"
                                  onClick={() => handleExcluirUsuario(usuario)}
                                  title="Excluir usuário"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </ProtectedContent>
                            </div>
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
        
        <TabsContent value="convites" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Histórico de Convites</CardTitle>
                <Button onClick={handleNovoUsuario}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Novo Usuário
                </Button>
              </div>
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
              ) : convites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum convite enviado.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleNovoUsuario}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Usuário
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data de Envio</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {convitesOrdenados.map((convite) => (
                        <TableRow key={convite.id}>
                          <TableCell>{convite.email}</TableCell>
                          <TableCell>{convite.nome || '-'}</TableCell>
                          <TableCell>{convite.cargo}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                              ${convite.status === 'pendente' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : convite.status === 'aceito'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                              {convite.status === 'pendente' 
                                ? 'Pendente' 
                                : convite.status === 'aceito'
                                  ? 'Aceito'
                                  : 'Expirado'
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(convite.dataCriacao, "dd/MM/yy HH:mm")}
                          </TableCell>
                          <TableCell>
                            {format(convite.dataExpiracao, "dd/MM/yy")}
                          </TableCell>
                          <TableCell className="text-right">
                            {convite.status === 'pendente' && (
                              <>
                                <Button
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    // Copiar link para o clipboard
                                    const baseUrl = window.location.origin
                                    const url = `${baseUrl}/registrar?token=${convite.token}`
                                    navigator.clipboard.writeText(url)
                                    alert('Link copiado para a área de transferência!')
                                  }}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-500"
                                  onClick={() => handleCancelarConvite(convite.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
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

      {/* Diálogo para enviar convite */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
          <DialogTitle>{usuarioParaEditar ? 'Editar Usuário' : 'Cadastrar Novo Usuário'}</DialogTitle>
          <DialogDescription>
            {usuarioParaEditar 
              ? 'Edite os detalhes do usuário no sistema.'
              : 'Preencha os detalhes para cadastrar um novo usuário no sistema.'
            }
          </DialogDescription>
        </DialogHeader>
          
          {sucessoConvite && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertTitle>Usuário cadastrado com sucesso!</AlertTitle>
              <AlertDescription>
                O usuário foi criado e já pode fazer login no sistema.
              </AlertDescription>
            </Alert>
          )}
          
          {erroConvite && (
            <Alert className="bg-red-50 border-red-200 text-red-800">
              <AlertTitle>Erro ao cadastrar usuário</AlertTitle>
              <AlertDescription>{erroConvite}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!usuarioParaEditar && (
                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Senha do usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="cargo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Administrador</SelectItem>
                        <SelectItem value="administrador">Administrador</SelectItem>
                        <SelectItem value="pastor">Pastor</SelectItem>
                        <SelectItem value="secretario_geral">Secretário Geral</SelectItem>
                        <SelectItem value="secretario">Secretário</SelectItem>
                        <SelectItem value="tesoureiro_geral">Tesoureiro Geral</SelectItem>
                        <SelectItem value="tesoureiro">Tesoureiro</SelectItem>
                        <SelectItem value="lider_ministerio">Líder de Ministério</SelectItem>
                        <SelectItem value="usuario">Usuário Básico</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                        {congregacoes.length > 0 ? (
                          congregacoes.map((congregacao) => (
                            <SelectItem key={congregacao.id} value={congregacao.id}>
                              {congregacao.nome}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="default">Congregação Matriz</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={enviandoConvite || sucessoConvite}
                >
                  {enviandoConvite 
                    ? (usuarioParaEditar ? 'Atualizando...' : 'Cadastrando...') 
                    : (usuarioParaEditar ? 'Atualizar Usuário' : 'Cadastrar Usuário')
                  }
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 