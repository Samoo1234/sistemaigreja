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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ArrowUpRight, Calendar as CalendarIcon, Plus, Search, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, MapPin, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'

// Define o esquema de validação para o formulário
const formSchema = z.object({
  descricao: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres'),
  valor: z.coerce.number().min(0.01, 'O valor deve ser maior que zero'),
  tipo: z.enum(['entrada', 'saida']),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  data: z.date({ required_error: 'Por favor, selecione uma data' }),
  responsavel: z.string().min(3, 'Nome do responsável deve ter pelo menos 3 caracteres'),
  congregacao: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Tipo para as transações
type Transacao = {
  id: string
  descricao: string
  valor: number
  tipo: 'entrada' | 'saida'
  categoria: string
  data: Date
  responsavel: string
  congregacao?: string
}

export default function TesourariaPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [transacaoParaEditar, setTransacaoParaEditar] = useState<Transacao | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos')
  const [congregacaoSelecionada, setCongregacaoSelecionada] = useState<string>('todas')
  const [periodoRelatorio, setPeriodoRelatorio] = useState<'mes' | 'trimestre' | 'ano'>('mes')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      descricao: '',
      valor: 0,
      tipo: 'entrada',
      categoria: '',
      responsavel: '',
      congregacao: '',
    }
  })

  // Simula o carregamento de transações
  useEffect(() => {
    const carregarTransacoes = async () => {
      setLoading(true);
      try {
        // Buscar transações do Firebase
        const transacoesRef = collection(db, 'transacoes');
        const transacoesSnapshot = await getDocs(transacoesRef);
        const transacoesData: Transacao[] = [];
        
        transacoesSnapshot.forEach((doc) => {
          const data = doc.data();
          transacoesData.push({
            id: doc.id,
            descricao: data.descricao,
            valor: data.valor,
            tipo: data.tipo,
            categoria: data.categoria,
            data: data.data ? new Date(data.data.toDate()) : new Date(),
            responsavel: data.responsavel,
            congregacao: data.congregacao
          });
        });
        
        setTransacoes(transacoesData);
      } catch (error) {
        console.error("Erro ao carregar transações:", error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarTransacoes();
  }, []);

  // Lista de congregações
  const congregacoes = [
    { id: '1', nome: 'Congregação Sede' },
    { id: '2', nome: 'Congregação Norte' },
    { id: '3', nome: 'Congregação Sul' },
    { id: '4', nome: 'Congregação Leste' },
    { id: '5', nome: 'Congregação Oeste' },
  ]

  // Filtra transações com base na busca e tipo
  const transacoesFiltradas = transacoes.filter(transacao => {
    const matchesSearch = transacao.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transacao.responsavel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transacao.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transacao.congregacao && transacao.congregacao.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesTipo = filtroTipo === 'todos' || transacao.tipo === filtroTipo
    
    return matchesSearch && matchesTipo
  })

  // Organiza transações por data (mais recentes primeiro)
  const transacoesOrdenadas = [...transacoesFiltradas].sort((a, b) => b.data.getTime() - a.data.getTime())

  // Calcula totais
  const totalEntradas = transacoes
    .filter(t => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0)

  const totalSaidas = transacoes
    .filter(t => t.tipo === 'saida')
    .reduce((sum, t) => sum + t.valor, 0)

  const saldo = totalEntradas - totalSaidas

  // Categorias para o formulário
  const categorias = {
    entrada: ['Dízimo', 'Oferta', 'Doação', 'Campanha', 'Outro'],
    saida: ['Contas', 'Manutenção', 'Salários', 'Material', 'Equipamentos', 'Eventos', 'Outro']
  }

  // Abre o diálogo para edição
  const handleEditarTransacao = (transacao: Transacao) => {
    setTransacaoParaEditar(transacao)
    form.reset({
      descricao: transacao.descricao,
      valor: transacao.valor,
      tipo: transacao.tipo,
      categoria: transacao.categoria,
      data: transacao.data,
      responsavel: transacao.responsavel,
      congregacao: transacao.congregacao || '',
    })
    setDialogOpen(true)
  }

  // Abre o diálogo para criar nova transação
  const handleNovaTransacao = () => {
    setTransacaoParaEditar(null)
    form.reset({
      descricao: '',
      valor: 0,
      tipo: 'entrada',
      categoria: '',
      data: new Date(),
      responsavel: '',
      congregacao: '',
    })
    setDialogOpen(true)
  }

  // Exclui uma transação
  const handleExcluirTransacao = async (id: string) => {
    try {
      // Excluir transação do Firebase
      await deleteDoc(doc(db, 'transacoes', id));
      
      // Atualizar estado local
      setTransacoes(transacoes.filter(transacao => transacao.id !== id));
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
    }
  }

  // Salva o formulário (criação/edição)
  const onSubmit = async (values: FormValues) => {
    try {
      if (transacaoParaEditar) {
        // Atualiza transação existente no Firebase
        const transacaoRef = doc(db, 'transacoes', transacaoParaEditar.id);
        await updateDoc(transacaoRef, values);
        
        // Atualizar estado local
        const transacoesAtualizadas = transacoes.map(transacao =>
          transacao.id === transacaoParaEditar.id
            ? { ...transacao, ...values }
            : transacao
        );
        
        setTransacoes(transacoesAtualizadas);
      } else {
        // Cria nova transação no Firebase
        const docRef = await addDoc(collection(db, 'transacoes'), values);
        
        // Adicionar ao estado local com o ID gerado pelo Firebase
        const novaTransacao: Transacao = {
          id: docRef.id,
          ...values
        };
        
        setTransacoes([...transacoes, novaTransacao]);
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
    }
  }

  // Funções para relatórios por congregação
  const getTransacoesPorCongregacao = (congregacao: string) => {
    if (congregacao === 'todas') {
      return transacoes;
    }
    return transacoes.filter(t => t.congregacao === congregacao);
  }

  const getEntradasPorCongregacao = (congregacao: string) => {
    const transacoesCongregacao = getTransacoesPorCongregacao(congregacao);
    return transacoesCongregacao
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0);
  }

  const getSaidasPorCongregacao = (congregacao: string) => {
    const transacoesCongregacao = getTransacoesPorCongregacao(congregacao);
    return transacoesCongregacao
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + t.valor, 0);
  }

  const getSaldoPorCongregacao = (congregacao: string) => {
    return getEntradasPorCongregacao(congregacao) - getSaidasPorCongregacao(congregacao);
  }

  // Filtrar transações por período
  const filtrarTransacoesPorPeriodo = (transacoes: Transacao[]) => {
    const hoje = new Date();
    let dataInicial = new Date();
    
    if (periodoRelatorio === 'mes') {
      dataInicial.setMonth(hoje.getMonth() - 1);
    } else if (periodoRelatorio === 'trimestre') {
      dataInicial.setMonth(hoje.getMonth() - 3);
    } else if (periodoRelatorio === 'ano') {
      dataInicial.setFullYear(hoje.getFullYear() - 1);
    }
    
    return transacoes.filter(t => t.data >= dataInicial);
  }

  const transacoesCongregacaoFiltradas = congregacaoSelecionada === 'todas'
    ? filtrarTransacoesPorPeriodo(transacoes)
    : filtrarTransacoesPorPeriodo(transacoes.filter(t => t.congregacao === congregacaoSelecionada));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Tesouraria</h1>
        <Button onClick={handleNovaTransacao}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold text-green-700">
                R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="p-2 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-2xl font-bold text-red-700">
                R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="p-2 rounded-full bg-red-100 text-red-600">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${saldo >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-medium ${saldo >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className={`p-2 rounded-full ${saldo >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transacoes" className="w-full">
        <TabsList className="grid w-full md:w-[500px] grid-cols-2">
          <TabsTrigger value="transacoes" className="flex items-center">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="congregacoes" className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            Congregações
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transacoes" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Transações</CardTitle>
                <div className="flex gap-4 w-full sm:w-auto">
                  <Tabs defaultValue="todos" className="w-full sm:w-[200px]" onValueChange={(value) => setFiltroTipo(value as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="todos">Todos</TabsTrigger>
                      <TabsTrigger value="entrada">Entradas</TabsTrigger>
                      <TabsTrigger value="saida">Saídas</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar transações..."
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
              ) : transacoesOrdenadas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma transação encontrada.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={handleNovaTransacao}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Transação
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Congregação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transacoesOrdenadas.map((transacao) => (
                        <TableRow key={transacao.id}>
                          <TableCell className="font-medium">{transacao.descricao}</TableCell>
                          <TableCell>{transacao.categoria}</TableCell>
                          <TableCell className={transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                            {transacao.tipo === 'entrada' ? '+' : '-'} R$ {transacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {format(transacao.data, "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{transacao.responsavel}</TableCell>
                          <TableCell>{transacao.congregacao || 'Central'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditarTransacao(transacao)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExcluirTransacao(transacao.id)}
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
        </TabsContent>
        
        <TabsContent value="congregacoes" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Prestação de Contas - Congregações</h2>
            <div className="flex gap-4">
              <Select 
                value={congregacaoSelecionada} 
                onValueChange={setCongregacaoSelecionada}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione uma congregação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Congregações</SelectItem>
                  {congregacoes.map((cong) => (
                    <SelectItem key={cong.id} value={cong.nome}>{cong.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={periodoRelatorio} 
                onValueChange={(value: any) => setPeriodoRelatorio(value)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mes">Último mês</SelectItem>
                  <SelectItem value="trimestre">Último trimestre</SelectItem>
                  <SelectItem value="ano">Último ano</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Exportar Relatório
              </Button>
            </div>
          </div>
          
          {congregacaoSelecionada === 'todas' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {congregacoes.map((cong) => (
                <Card key={cong.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 pb-2">
                    <CardTitle className="text-md">{cong.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Entradas:</span>
                        <span className="font-medium text-green-600">
                          R$ {getEntradasPorCongregacao(cong.nome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Saídas:</span>
                        <span className="font-medium text-red-600">
                          R$ {getSaidasPorCongregacao(cong.nome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Saldo:</span>
                          <span className={`font-bold ${getSaldoPorCongregacao(cong.nome) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            R$ {getSaldoPorCongregacao(cong.nome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-green-800">Entradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-700">
                      R$ {getEntradasPorCongregacao(congregacaoSelecionada).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50 border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-800">Saídas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-700">
                      R$ {getSaidasPorCongregacao(congregacaoSelecionada).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className={`${getSaldoPorCongregacao(congregacaoSelecionada) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-medium ${getSaldoPorCongregacao(congregacaoSelecionada) >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                      Saldo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${getSaldoPorCongregacao(congregacaoSelecionada) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                      R$ {getSaldoPorCongregacao(congregacaoSelecionada).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Transações de {congregacaoSelecionada}</CardTitle>
                </CardHeader>
                <CardContent>
                  {transacoesCongregacaoFiltradas.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhuma transação encontrada para esta congregação no período selecionado.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Responsável</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transacoesCongregacaoFiltradas
                            .sort((a, b) => b.data.getTime() - a.data.getTime())
                            .map((transacao) => (
                              <TableRow key={transacao.id}>
                                <TableCell className="font-medium">{transacao.descricao}</TableCell>
                                <TableCell>{transacao.categoria}</TableCell>
                                <TableCell className={transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}>
                                  {transacao.tipo === 'entrada' ? '+' : '-'} R$ {transacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  {format(transacao.data, "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell>{transacao.responsavel}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {transacaoParaEditar ? 'Editar Transação' : 'Nova Transação'}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes da transação abaixo.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
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
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="saida">Saída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição da transação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="congregacao"
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
                        {congregacoes.map((cong) => (
                          <SelectItem key={cong.id} value={cong.nome}>{cong.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => {
                  const tipoAtual = form.watch('tipo')
                  const listaCategorias = tipoAtual === 'entrada' ? categorias.entrada : categorias.saida
                  
                  return (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {listaCategorias.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
              
              <FormField
                control={form.control}
                name="responsavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
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