'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Plus, Search, Edit, Trash2, MapPin, Phone, User, Home } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { useAuth } from '@/lib/contexts/auth-context'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import ProtectedRoute from '@/components/auth/protected-route'
import ProtectedContent from '@/components/auth/protected-content'
import { useIgrejaConfig } from '@/lib/contexts/igreja-config'

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
  
  // Verifica se tem 14 dígitos
  if (cnpjLimpo.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false
  
  // Validação dos dígitos verificadores
  let soma = 0
  let peso = 2
  
  // Primeiro dígito verificador
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  
  let digito = 11 - (soma % 11)
  if (digito > 9) digito = 0
  
  if (parseInt(cnpjLimpo.charAt(12)) !== digito) return false
  
  // Segundo dígito verificador
  soma = 0
  peso = 2
  
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  
  digito = 11 - (soma % 11)
  if (digito > 9) digito = 0
  
  return parseInt(cnpjLimpo.charAt(13)) === digito
}

// Função para formatar CNPJ
function formatarCNPJ(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
  return cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

// Define o esquema de validação para o formulário
const formSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  endereco: z.string().min(5, 'O endereço deve ter pelo menos 5 caracteres'),
  cidade: z.string().min(2, 'A cidade deve ter pelo menos 2 caracteres'),
  estado: z.string().length(2, 'O estado deve ter 2 caracteres (sigla)'),
  telefone: z.string().min(10, 'O telefone deve ter pelo menos 10 dígitos'),
  pastor: z.string().min(3, 'O nome do pastor deve ter pelo menos 3 caracteres'),
  cnpj: z.string().optional(),
  dataFundacao: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Tipo para as congregações
type Congregacao = {
  id: string
  nome: string
  endereco: string
  cidade: string
  estado: string
  telefone: string
  pastor: string
  cnpj?: string
  capacidade: number
  dataFundacao?: string
  membros: number
  status: 'ativa' | 'inativa'
  isMatriz: boolean
}

export default function CongregacoesPage() {
  return (
    <ProtectedRoute
      requiredPermissions={['congregacoes.visualizar']}
      requiredCargos={['super_admin', 'administrador', 'pastor']}
      anyPermission={true}
    >
      <CongregacoesContent />
    </ProtectedRoute>
  )
}

function CongregacoesContent() {
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [congregacaoParaEditar, setCongregacaoParaEditar] = useState<Congregacao | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { user, userData } = useAuth()
  const { config } = useIgrejaConfig()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      endereco: '',
      cidade: '',
      estado: '',
      telefone: '',
      pastor: '',
      cnpj: '',
      dataFundacao: '',
    }
  })

  // Busca as congregações do Firebase
  useEffect(() => {
    const buscarCongregacoes = async () => {
      setLoading(true)
      try {
        const congregacoesRef = collection(db, 'congregacoes')
        const snapshot = await getDocs(congregacoesRef)
        const congregacoesData: Congregacao[] = []
        
        snapshot.forEach((doc) => {
          congregacoesData.push({
            id: doc.id,
            ...doc.data(),
            membros: doc.data().membros || 0,
            capacidade: doc.data().capacidade || 0,
            status: doc.data().status || 'ativa',
            isMatriz: doc.data().isMatriz || false
          } as Congregacao)
        })
        
        setCongregacoes(congregacoesData)
        
        // VERIFICAÇÃO: Se não existe sede mas existem configurações da igreja, criar sede automaticamente
        const sedeExistente = congregacoesData.find(c => c.isMatriz)
        if (!sedeExistente && config.nome && config.nome !== 'Igreja Evangélica Nacional') {
          console.log('Criando sede automaticamente baseada nas configurações da igreja')
          
          try {
            const novaSede = {
              nome: config.nome,
              endereco: config.endereco || '',
              cidade: config.cidade || '',
              estado: config.estado || '',
              telefone: config.telefone || '',
              email: config.email || '',
              site: config.site || '',
              pastor: config.pastor || 'Pastor Principal',
              cnpj: config.cnpj || '',
              membros: 0,
              capacidade: 0, // Mantido para compatibilidade com o tipo
              status: 'ativa' as const,
              isMatriz: true,
              dataFundacao: new Date().toISOString().split('T')[0],
            }
            
            const docRef = await addDoc(collection(db, 'congregacoes'), novaSede)
            console.log('Sede criada automaticamente com ID:', docRef.id)
            
            // Adiciona a nova sede à lista local
            const novaSedeComId: Congregacao = {
              id: docRef.id,
              ...novaSede
            }
            setCongregacoes([...congregacoesData, novaSedeComId])
            
          } catch (error) {
            console.error('Erro ao criar sede automaticamente:', error)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar congregações:', error)
        // Em caso de erro, podemos mostrar algum alerta ou feedback ao usuário
      } finally {
        setLoading(false)
      }
    }
    
    buscarCongregacoes()
  }, [config.nome, config.endereco, config.cidade, config.estado, config.telefone, config.email, config.site, config.pastor, config.cnpj])

  // Filtra congregações com base na busca
  const congregacoesFiltradas = congregacoes.filter(congregacao =>
    congregacao.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    congregacao.cidade.toLowerCase().includes(searchQuery.toLowerCase()) ||
    congregacao.pastor.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Organiza congregações por nome
  const congregacoesOrdenadas = [...congregacoesFiltradas].sort((a, b) => a.nome.localeCompare(b.nome))

  // Abre o diálogo para edição
  const handleEditarCongregacao = (congregacao: Congregacao) => {
    setCongregacaoParaEditar(congregacao)
    form.reset({
      nome: congregacao.nome,
      endereco: congregacao.endereco,
      cidade: congregacao.cidade,
      estado: congregacao.estado,
      telefone: congregacao.telefone,
      pastor: congregacao.pastor,
      cnpj: congregacao.cnpj || '',
      dataFundacao: congregacao.dataFundacao,
    })
    setDialogOpen(true)
  }

  // Abre o diálogo para criar nova congregação
  const handleNovaCongregacao = () => {
    setCongregacaoParaEditar(null)
    form.reset({
      nome: '',
      endereco: '',
      cidade: '',
      estado: '',
      telefone: '',
      pastor: '',
      cnpj: '',
      dataFundacao: '',
    })
    setDialogOpen(true)
  }

  // Exclui uma congregação
  const handleExcluirCongregacao = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'congregacoes', id))
      setCongregacoes(congregacoes.filter(congregacao => congregacao.id !== id))
    } catch (error) {
      console.error('Erro ao excluir congregação:', error)
      // Exibir mensagem de erro para o usuário
    }
  }

  // Salva o formulário (criação/edição)
  const onSubmit = async (values: FormValues) => {
    console.log('Função onSubmit iniciada', values);
    console.log('Usuário autenticado:', user ? 'Sim' : 'Não', user?.uid);
    console.log('Dados do usuário no contexto:', userData);
    
    
    
    // Verificar o estado atual da autenticação
    const currentAuth = getAuth();
    onAuthStateChanged(currentAuth, async (currentUser) => {
      console.log('Estado atual de autenticação:', currentUser ? 'Autenticado' : 'Não autenticado');
      if (currentUser) {
        console.log('UID do usuário atual:', currentUser.uid);
        console.log('Email do usuário atual:', currentUser.email);
        
        try {
          const token = await currentUser.getIdToken();
          console.log('Token do usuário obtido com sucesso');
        } catch (tokenError) {
          console.error('Erro ao obter token:', tokenError);
        }
      }
    });
    
    if (!user) {
      alert('Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }
    
    // Verificar se os dados do usuário existem no Firestore
    if (!userData) {
      alert('Dados do usuário não encontrados. Por favor, faça login novamente.');
      return;
    }
    
    try {
      if (congregacaoParaEditar) {
        console.log('Atualizando congregação existente', congregacaoParaEditar.id);
        // Atualiza congregação existente
        const congregacaoRef = doc(db, 'congregacoes', congregacaoParaEditar.id);
        console.log('Referência do documento:', congregacaoRef);
        
        const dadosAtualizados = {
          ...values,
          membros: congregacaoParaEditar.membros,
          status: congregacaoParaEditar.status,
          isMatriz: congregacaoParaEditar.isMatriz // Mantém o status de sede se já for sede
        };
        console.log('Dados a serem atualizados:', dadosAtualizados);
        
        try {
          await updateDoc(congregacaoRef, dadosAtualizados);
          console.log('Documento atualizado com sucesso');
        } catch (firebaseError: any) {
          console.error('Erro Firebase específico:', firebaseError);
          console.error('Código do erro:', firebaseError.code);
          console.error('Mensagem do erro:', firebaseError.message);
          
          // Se for erro de permissão, tenta usar a API
          if (firebaseError.code === 'permission-denied') {
            console.log('Tentando via API (Admin SDK)...');
            
            try {
              const response = await fetch(`/api/congregacoes?id=${congregacaoParaEditar.id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  ...values,
                  membros: congregacaoParaEditar.membros,
                  status: congregacaoParaEditar.status,
                  isMatriz: congregacaoParaEditar.isMatriz // Mantém o status de sede se já for sede
                })
              });
              
              if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
              }
              
              console.log('Atualizado com sucesso via API');
            } catch (apiError) {
              console.error('Erro ao usar API:', apiError);
              throw apiError;
            }
          } else {
            throw firebaseError;
          }
        }
        
        // Atualiza o estado local
        const congregacoesAtualizadas = congregacoes.map(congregacao =>
          congregacao.id === congregacaoParaEditar.id
            ? { ...congregacao, ...values }
            : congregacao
        );
        setCongregacoes(congregacoesAtualizadas);
      } else {
        console.log('Criando nova congregação');
        // Cria nova congregação
        const novaCongregacaoData = {
          ...values,
          membros: 0, // Nova congregação começa sem membros
          capacidade: 0, // Mantido para compatibilidade com o tipo
          status: 'ativa' as const, // Status padrão
          isMatriz: false, // Sempre false para novas congregações (são filiais)
        };
        console.log('Dados da nova congregação:', novaCongregacaoData);
        
        try {
          const docRef = await addDoc(collection(db, 'congregacoes'), novaCongregacaoData);
          console.log('Documento criado com ID:', docRef.id);
          
                      const novaCongregacao: Congregacao = {
              id: docRef.id,
              ...novaCongregacaoData,
              capacidade: 0 // Garantir que está presente
            };
          
          setCongregacoes([...congregacoes, novaCongregacao]);
        } catch (firebaseError: any) {
          console.error('Erro Firebase específico:', firebaseError);
          console.error('Código do erro:', firebaseError.code);
          console.error('Mensagem do erro:', firebaseError.message);
          
          // Se for erro de permissão, tenta usar a API
          if (firebaseError.code === 'permission-denied') {
            console.log('Tentando via API (Admin SDK)...');
            
            try {
              const response = await fetch('/api/congregacoes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  ...values,
                  membros: 0,
                  status: 'ativa',
                  isMatriz: false
                })
              });
              
              if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
              }
              
              const data = await response.json();
              console.log('Criado com sucesso via API:', data);
              
              const novaCongregacao: Congregacao = {
                id: data.id,
                ...values,
                membros: 0,
                capacidade: 0, // Mantido para compatibilidade
                status: 'ativa',
                isMatriz: false
              };
              
              setCongregacoes([...congregacoes, novaCongregacao]);
            } catch (apiError) {
              console.error('Erro ao usar API:', apiError);
              throw apiError;
            }
          } else {
            throw firebaseError;
          }
        }
      }
      
      console.log('Fechando diálogo');
      setDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar congregação:', error);
      alert(`Erro ao salvar congregação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Congregações</h1>
        <ProtectedContent
          permissions={['congregacoes.adicionar']}
          cargos={['administrador']}
          anyPermission={true}
        >
          <Button onClick={handleNovaCongregacao}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Congregação
          </Button>
        </ProtectedContent>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Congregações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{congregacoes.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Sede (Matriz)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {congregacoes.filter(c => c.isMatriz).length}
            </p>
            <p className="text-sm text-gray-500">
              {congregacoes.find(c => c.isMatriz)?.nome || 'Não definida'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Filiais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {congregacoes.filter(c => !c.isMatriz).length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Membros</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {congregacoes.reduce((total, cong) => total + cong.membros, 0)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Capacidade Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {congregacoes.reduce((total, cong) => total + cong.capacidade, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Lista de Congregações</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar congregações..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
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
          ) : congregacoesOrdenadas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma congregação encontrada.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleNovaCongregacao}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Congregação
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cidade/Estado</TableHead>
                    <TableHead>Pastor</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {congregacoesOrdenadas.map((congregacao) => (
                    <TableRow key={congregacao.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {congregacao.isMatriz && (
                            <Home className="h-4 w-4 text-blue-600" />
                          )}
                          <span className={congregacao.isMatriz ? "text-blue-600 font-semibold" : ""}>
                            {congregacao.nome}
                            {congregacao.isMatriz && " (Sede)"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                          {congregacao.cidade}/{congregacao.estado}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-500" />
                          {congregacao.pastor}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{congregacao.membros}</span>
                          <span className="text-gray-500 text-xs"> /{congregacao.capacidade}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (congregacao.membros / congregacao.capacidade) * 100)}%` }}
                          ></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-500" />
                          {congregacao.telefone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <ProtectedContent
                          permissions={['congregacoes.editar']}
                          cargos={['administrador']}
                          anyPermission={true}
                        >
                          <Button
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditarCongregacao(congregacao)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ProtectedContent>
                        <ProtectedContent
                          permissions={['congregacoes.excluir']}
                          cargos={['administrador']}
                          anyPermission={true}
                        >
                          <Button
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500"
                            onClick={() => handleExcluirCongregacao(congregacao.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {congregacaoParaEditar ? 'Editar Congregação' : 'Nova Congregação'}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes da congregação abaixo.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={(e) => {
              console.log('Formulário sendo submetido');
              console.log('Erros no formulário:', form.formState.errors);
              console.log('Valores do formulário:', form.getValues());
              console.log('Formulário é válido:', form.formState.isValid);
              form.handleSubmit(onSubmit)(e);
            }} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da congregação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              

              
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
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pastor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pastor Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do pastor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00.000.000/0000-00" 
                          value={field.value}
                          onChange={(e) => {
                            const valor = e.target.value
                            // Remove caracteres não numéricos
                            const cnpjLimpo = valor.replace(/[^\d]/g, '')
                            
                            // Formata automaticamente
                            let cnpjFormatado = cnpjLimpo
                            if (cnpjLimpo.length >= 2) {
                              cnpjFormatado = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
                            } else if (cnpjLimpo.length >= 5) {
                              cnpjFormatado = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})$/, '$1.$2.$3/$4')
                            } else if (cnpjLimpo.length >= 8) {
                              cnpjFormatado = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
                            } else if (cnpjLimpo.length >= 5) {
                              cnpjFormatado = cnpjLimpo.replace(/^(\d{2})(\d{3})$/, '$1.$2')
                            }
                            
                            field.onChange(cnpjFormatado)
                          }}
                          maxLength={18}
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && field.value.replace(/[^\d]/g, '').length === 14 && (
                        <div className={`text-xs ${validarCNPJ(field.value) ? 'text-green-600' : 'text-red-600'}`}>
                          {validarCNPJ(field.value) ? '✓ CNPJ válido' : '✗ CNPJ inválido'}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              

              
              <FormField
                control={form.control}
                name="dataFundacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fundação</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    console.log('Cancelar clicado');
                    setDialogOpen(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  onClick={(e) => {
                    console.log('Botão salvar clicado');
                    if (form.formState.isValid) {
                      // Se o formulário for válido, tente enviar diretamente
                      e.preventDefault();
                      onSubmit(form.getValues());
                    }
                  }}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}