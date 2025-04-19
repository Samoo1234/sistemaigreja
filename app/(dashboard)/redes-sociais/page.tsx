'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Search, Edit, Trash2, Instagram, Facebook, Youtube, Twitter, Globe, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { db } from '@/lib/firebase/config'
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Define o esquema de validação para o formulário
const formSchema = z.object({
  tipo: z.enum(['post', 'evento', 'devocional', 'anuncio']),
  plataforma: z.enum(['instagram', 'facebook', 'youtube', 'twitter', 'site']),
  titulo: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  conteudo: z.string().min(5, 'O conteúdo deve ter pelo menos 5 caracteres'),
  dataAgendamento: z.date(),
  status: z.enum(['agendado', 'publicado', 'rascunho']),
  imagem: z.string().optional(),
  link: z.string().url('URL inválida').optional().or(z.literal('')),
  responsavel: z.string().min(3, 'O responsável deve ter pelo menos 3 caracteres'),
})

type FormValues = z.infer<typeof formSchema>

// Tipo para as publicações
type Publicacao = {
  id: string
  tipo: 'post' | 'evento' | 'devocional' | 'anuncio'
  plataforma: 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'site'
  titulo: string
  conteudo: string
  dataAgendamento: Date
  dataCriacao: Date
  dataPublicacao?: Date
  status: 'agendado' | 'publicado' | 'rascunho'
  imagem?: string
  link?: string
  responsavel: string
}

export default function RedesSociaisPage() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [publicacaoParaEditar, setPublicacaoParaEditar] = useState<Publicacao | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filtroPlataforma, setFiltroPlataforma] = useState<'todas' | 'instagram' | 'facebook' | 'youtube' | 'twitter' | 'site'>('todas')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'agendado' | 'publicado' | 'rascunho'>('todos')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'post',
      plataforma: 'instagram',
      titulo: '',
      conteudo: '',
      dataAgendamento: new Date(),
      status: 'rascunho',
      imagem: '',
      link: '',
      responsavel: '',
    }
  })

  // Simula o carregamento de publicações
  useEffect(() => {
    const fetchPublicacoes = async () => {
      try {
        setLoading(true);
        
        // Busca as publicações do Firebase
        const publicacoesRef = collection(db, 'publicacoes');
        const querySnapshot = await getDocs(publicacoesRef);
        
        const publicacoesData: Publicacao[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          publicacoesData.push({
            id: doc.id,
            tipo: data.tipo,
            plataforma: data.plataforma,
            titulo: data.titulo,
            conteudo: data.conteudo,
            dataAgendamento: data.dataAgendamento.toDate(),
            dataCriacao: data.dataCriacao.toDate(),
            dataPublicacao: data.dataPublicacao ? data.dataPublicacao.toDate() : undefined,
            status: data.status,
            imagem: data.imagem,
            link: data.link,
            responsavel: data.responsavel,
          });
        });
        
        if (publicacoesData.length === 0) {
          // Se não houver dados, usa os dados simulados para demonstração
          const mockPublicacoes: Publicacao[] = [
            {
              id: '1',
              tipo: 'post',
              plataforma: 'instagram',
              titulo: 'Culto de Domingo',
              conteudo: 'Venha participar do nosso culto de domingo às 18h. Tema: O poder da oração.',
              dataAgendamento: new Date(2023, 11, 15, 9, 0, 0),
              dataCriacao: new Date(2023, 11, 10),
              status: 'publicado',
              dataPublicacao: new Date(2023, 11, 15, 9, 0, 0),
              imagem: 'https://placehold.co/600x400/png',
              responsavel: 'Maria Silva'
            },
            {
              id: '2',
              tipo: 'evento',
              plataforma: 'facebook',
              titulo: 'Retiro de Jovens',
              conteudo: 'Nosso retiro anual de jovens acontecerá nos dias 20-22 de janeiro. Inscrições abertas!',
              dataAgendamento: new Date(2023, 12, 20, 10, 0, 0),
              dataCriacao: new Date(2023, 11, 25),
              status: 'agendado',
              imagem: 'https://placehold.co/600x400/png',
              link: 'https://exemplo.com/retiro',
              responsavel: 'João Oliveira'
            },
            {
              id: '3',
              tipo: 'devocional',
              plataforma: 'youtube',
              titulo: 'Devocional: Salmos 23',
              conteudo: 'Uma reflexão sobre o Salmo 23 e como aplicá-lo em nossa vida diária.',
              dataAgendamento: new Date(2023, 12, 5, 14, 0, 0),
              dataCriacao: new Date(2023, 11, 30),
              status: 'publicado',
              dataPublicacao: new Date(2023, 12, 5, 14, 0, 0),
              link: 'https://www.youtube.com/watch?v=exemplo',
              responsavel: 'Pastor Carlos'
            },
            {
              id: '4',
              tipo: 'anuncio',
              plataforma: 'site',
              titulo: 'Campanha de Natal',
              conteudo: 'Estamos arrecadando alimentos e brinquedos para nossa campanha de Natal. Participe!',
              dataAgendamento: new Date(2023, 12, 10, 8, 0, 0),
              dataCriacao: new Date(2023, 12, 1),
              status: 'rascunho',
              imagem: 'https://placehold.co/600x400/png',
              responsavel: 'Ana Santos'
            },
            {
              id: '5',
              tipo: 'post',
              plataforma: 'twitter',
              titulo: 'Versículo da Semana',
              conteudo: '"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito..." João 3:16',
              dataAgendamento: new Date(2023, 12, 18, 7, 0, 0),
              dataCriacao: new Date(2023, 12, 11),
              status: 'agendado',
              responsavel: 'Equipe de Comunicação'
            }
          ];
          
          // Opcionalmente, salva os dados simulados no Firebase
          for (const publicacao of mockPublicacoes) {
            const { id, ...publicacaoSemId } = publicacao;
            await addDoc(collection(db, 'publicacoes'), publicacaoSemId);
          }
          
          setPublicacoes(mockPublicacoes);
        } else {
          setPublicacoes(publicacoesData);
        }
      } catch (error) {
        console.error('Erro ao carregar publicações:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicacoes();
  }, []);

  // Filtra publicações com base na busca, plataforma e status
  const publicacoesFiltradas = publicacoes.filter(publicacao => {
    const matchesSearch = publicacao.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      publicacao.conteudo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      publicacao.responsavel.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPlataforma = filtroPlataforma === 'todas' || publicacao.plataforma === filtroPlataforma
    const matchesStatus = filtroStatus === 'todos' || publicacao.status === filtroStatus
    
    return matchesSearch && matchesPlataforma && matchesStatus
  })

  // Organiza publicações por data de agendamento (mais recentes primeiro)
  const publicacoesOrdenadas = [...publicacoesFiltradas].sort((a, b) => b.dataAgendamento.getTime() - a.dataAgendamento.getTime())

  // Abre o diálogo para edição
  const handleEditarPublicacao = (publicacao: Publicacao) => {
    setPublicacaoParaEditar(publicacao)
    form.reset({
      tipo: publicacao.tipo,
      plataforma: publicacao.plataforma,
      titulo: publicacao.titulo,
      conteudo: publicacao.conteudo,
      dataAgendamento: publicacao.dataAgendamento,
      status: publicacao.status,
      imagem: publicacao.imagem || '',
      link: publicacao.link || '',
      responsavel: publicacao.responsavel,
    })
    setDialogOpen(true)
  }

  // Abre o diálogo para criar nova publicação
  const handleNovaPublicacao = () => {
    setPublicacaoParaEditar(null)
    form.reset({
      tipo: 'post',
      plataforma: 'instagram',
      titulo: '',
      conteudo: '',
      dataAgendamento: new Date(),
      status: 'rascunho',
      imagem: '',
      link: '',
      responsavel: '',
    })
    setDialogOpen(true)
  }

  // Exclui uma publicação
  const handleExcluirPublicacao = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'publicacoes', id));
      setPublicacoes(publicacoes.filter(publicacao => publicacao.id !== id));
    } catch (error) {
      console.error('Erro ao excluir publicação:', error);
    }
  }

  // Renderiza o ícone apropriado para a plataforma
  const renderIconePlataforma = (plataforma: string) => {
    switch (plataforma) {
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-600" />
      case 'facebook':
        return <Facebook className="h-4 w-4 text-blue-600" />
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />
      case 'twitter':
        return <Twitter className="h-4 w-4 text-blue-400" />
      case 'site':
        return <Globe className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  // Salva o formulário (criação/edição)
  const onSubmit = async (values: FormValues) => {
    try {
      if (publicacaoParaEditar) {
        // Atualiza publicação existente
        const publicacaoRef = doc(db, 'publicacoes', publicacaoParaEditar.id);
        
        const dadosAtualizados = {
          ...values,
          dataPublicacao: values.status === 'publicado' ? new Date() : publicacaoParaEditar.dataPublicacao
        };
        
        await updateDoc(publicacaoRef, dadosAtualizados);
        
        const publicacoesAtualizadas = publicacoes.map(publicacao =>
          publicacao.id === publicacaoParaEditar.id
            ? { 
                ...publicacao, 
                ...values,
                dataPublicacao: values.status === 'publicado' ? new Date() : publicacao.dataPublicacao 
              }
            : publicacao
        );
        
        setPublicacoes(publicacoesAtualizadas);
      } else {
        // Cria nova publicação
        const novaPublicacaoData = {
          ...values,
          dataCriacao: new Date(),
          dataPublicacao: values.status === 'publicado' ? new Date() : null
        };
        
        const docRef = await addDoc(collection(db, 'publicacoes'), novaPublicacaoData);
        
        const novaPublicacao: Publicacao = {
          id: docRef.id,
          ...values,
          dataCriacao: new Date(),
          dataPublicacao: values.status === 'publicado' ? new Date() : undefined
        };
        
        setPublicacoes([...publicacoes, novaPublicacao]);
      }
      
      setDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar publicação:', error);
    }
  }

  // Contagens para estatísticas
  const totalPublicacoes = publicacoes.length
  const totalAgendadas = publicacoes.filter(p => p.status === 'agendado').length
  const totalPublicadas = publicacoes.filter(p => p.status === 'publicado').length
  const totalRascunhos = publicacoes.filter(p => p.status === 'rascunho').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Redes Sociais</h1>
        <Button onClick={handleNovaPublicacao}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Publicação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{totalPublicacoes}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-700">{totalAgendadas}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Publicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{totalPublicadas}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Rascunhos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-700">{totalRascunhos}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Publicações</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  defaultValue="todas" 
                  onValueChange={(value) => setFiltroPlataforma(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas plataformas</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  defaultValue="todos" 
                  onValueChange={(value) => setFiltroStatus(value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos status</SelectItem>
                    <SelectItem value="agendado">Agendadas</SelectItem>
                    <SelectItem value="publicado">Publicadas</SelectItem>
                    <SelectItem value="rascunho">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar publicações..."
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
          ) : publicacoesOrdenadas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma publicação encontrada.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleNovaPublicacao}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Publicação
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicacoesOrdenadas.map((publicacao) => (
                    <TableRow key={publicacao.id}>
                      <TableCell>
                        <div className="font-medium">{publicacao.titulo}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[200px]">
                          {publicacao.conteudo}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {renderIconePlataforma(publicacao.plataforma)}
                          <span className="capitalize">{publicacao.plataforma}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="capitalize">{publicacao.tipo}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(publicacao.dataAgendamento, "dd/MM/yyyy - HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${publicacao.status === 'publicado' ? 'bg-green-100 text-green-800' : 
                          publicacao.status === 'agendado' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'}`}
                        >
                          {publicacao.status === 'publicado' ? 'Publicado' : 
                           publicacao.status === 'agendado' ? 'Agendado' : 'Rascunho'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{publicacao.responsavel}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        {publicacao.link && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a href={publicacao.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 text-gray-500" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarPublicacao(publicacao)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExcluirPublicacao(publicacao.id)}
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {publicacaoParaEditar ? 'Editar Publicação' : 'Nova Publicação'}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes da publicação abaixo.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plataforma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plataforma</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a plataforma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="twitter">Twitter</SelectItem>
                          <SelectItem value="site">Site</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Conteúdo</FormLabel>
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
                          <SelectItem value="post">Post</SelectItem>
                          <SelectItem value="evento">Evento</SelectItem>
                          <SelectItem value="devocional">Devocional</SelectItem>
                          <SelectItem value="anuncio">Anúncio</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título da publicação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="conteudo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Conteúdo da publicação" 
                        className="min-h-[150px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataAgendamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data e Hora do Agendamento</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ? new Date(field.value.getTime() - field.value.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                          onChange={(e) => {
                            const date = e.target.value ? new Date(e.target.value) : new Date()
                            field.onChange(date)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                          <SelectItem value="rascunho">Rascunho</SelectItem>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="publicado">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imagem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://exemplo.com/imagem.jpg" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://exemplo.com/pagina" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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