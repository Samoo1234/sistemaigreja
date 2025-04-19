'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useIgrejaConfig } from '@/lib/contexts/igreja-config'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Edit, Calendar, Clock } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"

// Tipos para eventos e horários
type Horario = {
  dia: string
  horario: string
}

type Evento = {
  titulo: string
  data: string
  horario: string
}

export default function EventosHorarios() {
  const { config, salvarConfig, recarregarConfig } = useIgrejaConfig()
  
  // Valores padrão para horários e eventos (garantindo que sempre existam valores)
  const horariosDefault = [
    { dia: 'Domingo', horario: '9h e 18h' },
    { dia: 'Quarta-feira', horario: '19h30' },
    { dia: 'Sexta-feira', horario: '20h' }
  ]
  
  const eventosDefault = [
    { titulo: 'Culto Especial de Louvor', data: '15 de Maio, 2023', horario: '19h' },
    { titulo: 'Encontro de Jovens', data: '28 de Maio, 2023', horario: '18h' },
    { titulo: 'Seminário Família Cristã', data: '10 de Junho, 2023', horario: '9h às 17h' }
  ]
  
  // Estado local para horários e eventos usando os valores do config ou os valores padrão
  const [horarios, setHorarios] = useState<Horario[]>(
    Array.isArray(config.horarios) && config.horarios.length > 0 
      ? config.horarios 
      : horariosDefault
  )
  
  const [eventos, setEventos] = useState<Evento[]>(
    Array.isArray(config.proximosEventos) && config.proximosEventos.length > 0 
      ? config.proximosEventos 
      : eventosDefault
  )
  
  // Estados para cadastro/edição
  const [novoHorario, setNovoHorario] = useState<Horario>({ dia: '', horario: '' })
  const [novoEvento, setNovoEvento] = useState<Evento>({ titulo: '', data: '', horario: '' })
  const [editandoHorario, setEditandoHorario] = useState<number | null>(null)
  const [editandoEvento, setEditandoEvento] = useState<number | null>(null)
  const [dialogHorarioAberto, setDialogHorarioAberto] = useState(false)
  const [dialogEventoAberto, setDialogEventoAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  
  // Atualiza o estado local quando as configurações do contexto mudarem
  useEffect(() => {
    if (Array.isArray(config.horarios) && config.horarios.length > 0) {
      setHorarios(config.horarios)
    }
    
    if (Array.isArray(config.proximosEventos) && config.proximosEventos.length > 0) {
      setEventos(config.proximosEventos)
    }
  }, [config])
  
  // Inicialização para garantir que os dados existentes sejam salvos
  useEffect(() => {
    // Verifica se há dados no estado local mas não no Firestore
    const verificarEAtualizarDados = async () => {
      try {
        if (
          (!Array.isArray(config.horarios) || config.horarios.length === 0) ||
          (!Array.isArray(config.proximosEventos) || config.proximosEventos.length === 0)
        ) {
          // Se não houver dados no Firestore, salva os valores padrão
          await salvarConfig({
            horarios: horarios,
            proximosEventos: eventos
          })
          
          // Recarrega para garantir que os dados estejam sincronizados
          await recarregarConfig()
          
          console.log('Dados iniciais de horários e eventos salvos no Firestore')
        }
      } catch (error) {
        console.error('Erro ao verificar e atualizar dados iniciais:', error)
      }
    }
    
    verificarEAtualizarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Execute apenas uma vez na montagem do componente
  
  // Funções para horários
  const handleAdicionarHorario = () => {
    if (!novoHorario.dia || !novoHorario.horario) {
      toast("Campos obrigatórios", {
        description: "Preencha o dia e o horário."
      })
      return
    }
    
    if (editandoHorario !== null) {
      // Editando um horário existente
      const horariosAtualizados = [...horarios]
      horariosAtualizados[editandoHorario] = novoHorario
      setHorarios(horariosAtualizados)
    } else {
      // Adicionando novo horário
      setHorarios([...horarios, novoHorario])
    }
    
    setNovoHorario({ dia: '', horario: '' })
    setEditandoHorario(null)
    setDialogHorarioAberto(false)
  }
  
  const handleEditarHorario = (index: number) => {
    setNovoHorario(horarios[index])
    setEditandoHorario(index)
    setDialogHorarioAberto(true)
  }
  
  const handleRemoverHorario = (index: number) => {
    const horariosAtualizados = [...horarios]
    horariosAtualizados.splice(index, 1)
    setHorarios(horariosAtualizados)
  }
  
  // Funções para eventos
  const handleAdicionarEvento = () => {
    if (!novoEvento.titulo || !novoEvento.data || !novoEvento.horario) {
      toast("Campos obrigatórios", {
        description: "Preencha todos os campos do evento."
      })
      return
    }
    
    if (editandoEvento !== null) {
      // Editando um evento existente
      const eventosAtualizados = [...eventos]
      eventosAtualizados[editandoEvento] = novoEvento
      setEventos(eventosAtualizados)
    } else {
      // Adicionando novo evento
      setEventos([...eventos, novoEvento])
    }
    
    setNovoEvento({ titulo: '', data: '', horario: '' })
    setEditandoEvento(null)
    setDialogEventoAberto(false)
  }
  
  const handleEditarEvento = (index: number) => {
    setNovoEvento(eventos[index])
    setEditandoEvento(index)
    setDialogEventoAberto(true)
  }
  
  const handleRemoverEvento = (index: number) => {
    const eventosAtualizados = [...eventos]
    eventosAtualizados.splice(index, 1)
    setEventos(eventosAtualizados)
  }
  
  const handleSalvar = async () => {
    try {
      setSalvando(true)
      
      // Atualiza as configurações gerais com os novos horários e eventos
      const dadosAtualizados = {
        horarios: horarios,
        proximosEventos: eventos
      }
      
      await salvarConfig(dadosAtualizados)
      await recarregarConfig()
      
      toast("Configurações salvas", {
        description: "Horários e eventos atualizados com sucesso."
      })
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast("Erro ao salvar", {
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'
      })
    } finally {
      setSalvando(false)
    }
  }
  
  return (
    <Tabs defaultValue="horarios">
      <TabsList className="mb-4">
        <TabsTrigger value="horarios">Horários de Culto</TabsTrigger>
        <TabsTrigger value="eventos">Próximos Eventos</TabsTrigger>
      </TabsList>
      
      <TabsContent value="horarios">
        <Card>
          <CardHeader>
            <CardTitle>Horários de Culto</CardTitle>
            <CardDescription>Configure os horários de culto que serão exibidos na página inicial</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex justify-end mb-4">
              <Dialog open={dialogHorarioAberto} onOpenChange={setDialogHorarioAberto}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => {
                      setNovoHorario({ dia: '', horario: '' })
                      setEditandoHorario(null)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Horário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editandoHorario !== null ? 'Editar Horário' : 'Adicionar Horário'}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do horário de culto
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="dia">Dia</Label>
                      <Input 
                        id="dia" 
                        placeholder="Ex: Domingo, Segunda-feira, etc."
                        value={novoHorario.dia}
                        onChange={e => setNovoHorario({...novoHorario, dia: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="horario">Horário</Label>
                      <Input 
                        id="horario" 
                        placeholder="Ex: 9h, 19h30, 9h e 18h"
                        value={novoHorario.horario}
                        onChange={e => setNovoHorario({...novoHorario, horario: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleAdicionarHorario}>
                      {editandoHorario !== null ? 'Salvar' : 'Adicionar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {horarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Nenhum horário cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  horarios.map((horario, index) => (
                    <TableRow key={index}>
                      <TableCell>{horario.dia}</TableCell>
                      <TableCell>{horario.horario}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditarHorario(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoverHorario(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          
          <CardFooter>
            <Button onClick={handleSalvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      <TabsContent value="eventos">
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>Configure os eventos que serão exibidos na página inicial</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex justify-end mb-4">
              <Dialog open={dialogEventoAberto} onOpenChange={setDialogEventoAberto}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => {
                      setNovoEvento({ titulo: '', data: '', horario: '' })
                      setEditandoEvento(null)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Evento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editandoEvento !== null ? 'Editar Evento' : 'Adicionar Evento'}
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados do evento
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="titulo">Título</Label>
                      <Input 
                        id="titulo" 
                        placeholder="Ex: Culto Especial de Louvor"
                        value={novoEvento.titulo}
                        onChange={e => setNovoEvento({...novoEvento, titulo: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="data">Data</Label>
                      <Input 
                        id="data" 
                        placeholder="Ex: 15 de Maio, 2023"
                        value={novoEvento.data}
                        onChange={e => setNovoEvento({...novoEvento, data: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="horarioEvento">Horário</Label>
                      <Input 
                        id="horarioEvento" 
                        placeholder="Ex: 19h, 9h às 17h"
                        value={novoEvento.horario}
                        onChange={e => setNovoEvento({...novoEvento, horario: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleAdicionarEvento}>
                      {editandoEvento !== null ? 'Salvar' : 'Adicionar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Nenhum evento cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  eventos.map((evento, index) => (
                    <TableRow key={index}>
                      <TableCell>{evento.titulo}</TableCell>
                      <TableCell>{evento.data}</TableCell>
                      <TableCell>{evento.horario}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditarEvento(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoverEvento(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          
          <CardFooter>
            <Button onClick={handleSalvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 