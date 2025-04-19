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
import { Plus, Search, Edit, Trash2, MapPin, Phone, User } from 'lucide-react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'

// Define o esquema de validação para o formulário
const formSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  endereco: z.string().min(5, 'O endereço deve ter pelo menos 5 caracteres'),
  cidade: z.string().min(2, 'A cidade deve ter pelo menos 2 caracteres'),
  estado: z.string().length(2, 'O estado deve ter 2 caracteres (sigla)'),
  telefone: z.string().min(10, 'O telefone deve ter pelo menos 10 dígitos'),
  pastor: z.string().min(3, 'O nome do pastor deve ter pelo menos 3 caracteres'),
  capacidade: z.coerce.number().min(1, 'A capacidade deve ser maior que zero'),
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
  capacidade: number
  dataFundacao?: string
  membros: number
}

export default function CongregacoesPage() {
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [congregacaoParaEditar, setCongregacaoParaEditar] = useState<Congregacao | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      endereco: '',
      cidade: '',
      estado: '',
      telefone: '',
      pastor: '',
      capacidade: 0,
      dataFundacao: '',
    }
  })

  // Simula o carregamento de congregações
  useEffect(() => {
    // Em um caso real, isso buscaria as congregações do Firebase
    const mockCongregacoes: Congregacao[] = [
      {
        id: '1',
        nome: 'Congregação Sede',
        endereco: 'Rua Principal, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        telefone: '(11) 99999-8888',
        pastor: 'Pr. José Silva',
        capacidade: 500,
        dataFundacao: '1985-05-15',
        membros: 450
      },
      {
        id: '2',
        nome: 'Congregação Norte',
        endereco: 'Av. Norte, 456',
        cidade: 'São Paulo',
        estado: 'SP',
        telefone: '(11) 97777-6666',
        pastor: 'Pr. Paulo Oliveira',
        capacidade: 200,
        dataFundacao: '1998-10-20',
        membros: 180
      },
      {
        id: '3',
        nome: 'Congregação Sul',
        endereco: 'Rua Sul, 789',
        cidade: 'São Paulo',
        estado: 'SP',
        telefone: '(11) 95555-4444',
        pastor: 'Pr. Roberto Santos',
        capacidade: 150,
        dataFundacao: '2005-03-08',
        membros: 120
      },
      {
        id: '4',
        nome: 'Congregação Leste',
        endereco: 'Av. Leste, 101',
        cidade: 'Guarulhos',
        estado: 'SP',
        telefone: '(11) 93333-2222',
        pastor: 'Pr. Carlos Ferreira',
        capacidade: 250,
        dataFundacao: '2010-11-12',
        membros: 200
      },
      {
        id: '5',
        nome: 'Congregação Oeste',
        endereco: 'Rua Oeste, 202',
        cidade: 'Osasco',
        estado: 'SP',
        telefone: '(11) 91111-0000',
        pastor: 'Pr. Marcos Lima',
        capacidade: 180,
        dataFundacao: '2015-07-25',
        membros: 150
      }
    ]

    setTimeout(() => {
      setCongregacoes(mockCongregacoes)
      setLoading(false)
    }, 1000)
  }, [])

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
      capacidade: congregacao.capacidade,
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
      capacidade: 0,
      dataFundacao: '',
    })
    setDialogOpen(true)
  }

  // Exclui uma congregação
  const handleExcluirCongregacao = (id: string) => {
    // Em um caso real, isso excluiria a congregação do Firebase
    setCongregacoes(congregacoes.filter(congregacao => congregacao.id !== id))
  }

  // Salva o formulário (criação/edição)
  const onSubmit = (values: FormValues) => {
    if (congregacaoParaEditar) {
      // Atualiza congregação existente
      const congregacoesAtualizadas = congregacoes.map(congregacao =>
        congregacao.id === congregacaoParaEditar.id
          ? { ...congregacao, ...values }
          : congregacao
      )
      setCongregacoes(congregacoesAtualizadas)
    } else {
      // Cria nova congregação
      const novaCongregacao: Congregacao = {
        id: Math.random().toString(36).substring(2, 9), // Gera ID aleatório (em produção usaria o ID do Firebase)
        ...values,
        membros: 0 // Nova congregação começa sem membros
      }
      setCongregacoes([...congregacoes, novaCongregacao])
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Congregações</h1>
        <Button onClick={handleNovaCongregacao}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Congregação
        </Button>
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
                      <TableCell className="font-medium">{congregacao.nome}</TableCell>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarCongregacao(congregacao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExcluirCongregacao(congregacao.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  name="capacidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidade</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Capacidade máxima" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
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
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}