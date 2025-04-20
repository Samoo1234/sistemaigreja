'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Convite } from '@/app/api/convites/route'

const formSchema = z.object({
  nome: z.string().min(2, 'O nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmacao: z.string().min(6, 'Confirme sua senha')
}).refine(data => data.senha === data.confirmacao, {
  message: 'As senhas não coincidem',
  path: ['confirmacao']
})

type FormValues = z.infer<typeof formSchema>

export default function RegistrarPage() {
  const [convite, setConvite] = useState<Convite | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [registroSucesso, setRegistroSucesso] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams ? searchParams.get('token') : null

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmacao: ''
    }
  })

  // Buscar o convite ao carregar a página
  useEffect(() => {
    const buscarConvite = async () => {
      if (!token) {
        setError('Token de convite não fornecido')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/convites?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Erro ao buscar convite')
          setLoading(false)
          return
        }

        setConvite(data)
        form.setValue('email', data.email)
        form.setValue('nome', data.nome || '')
        setLoading(false)
      } catch (error) {
        console.error('Erro ao buscar convite:', error)
        setError('Erro ao buscar convite. Tente novamente mais tarde.')
        setLoading(false)
      }
    }

    if (token) {
      buscarConvite()
    } else {
      setError('Token de convite não fornecido')
      setLoading(false)
    }
  }, [token, form])

  const onSubmit = async (values: FormValues) => {
    if (!convite) return

    try {
      setLoading(true)
      setError(null)

      // Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.senha)
      const user = userCredential.user

      // Atualizar o perfil do usuário com o nome
      await updateProfile(user, {
        displayName: values.nome
      })

      // Criar dados do usuário no Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: values.nome,
        email: values.email,
        cargo: convite.cargo,
        congregacaoId: convite.congregacaoId,
        permissoes: determinarPermissoes(convite.cargo),
        dataCadastro: new Date(),
        ultimoAcesso: new Date(),
        status: 'ativo'
      })

      // Atualizar o status do convite para 'aceito'
      await fetch('/api/convites', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: convite.token,
          status: 'aceito'
        })
      })

      // Mostrar mensagem de sucesso e redirecionar para o login
      setRegistroSucesso(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error: any) {
      console.error('Erro ao registrar usuário:', error)
      if (error.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso. Por favor, utilize outro email ou faça login.')
      } else {
        setError(`Erro ao criar conta: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Determinar permissões com base no cargo
  const determinarPermissoes = (cargo: string) => {
    switch (cargo.toLowerCase()) {
      case 'administrador':
        return [
          'membros.visualizar', 'membros.adicionar', 'membros.editar', 'membros.excluir',
          'financas.visualizar', 'financas.adicionar', 'financas.editar', 'financas.excluir',
          'congregacoes.visualizar', 'congregacoes.adicionar', 'congregacoes.editar', 'congregacoes.excluir',
          'relatorios.visualizar', 'relatorios.gerar',
          'configuracoes.visualizar', 'configuracoes.editar',
          'usuarios.visualizar', 'usuarios.adicionar', 'usuarios.editar', 'usuarios.excluir'
        ]
      case 'pastor':
        return [
          'membros.visualizar', 'membros.adicionar', 'membros.editar',
          'financas.visualizar',
          'congregacoes.visualizar',
          'relatorios.visualizar', 'relatorios.gerar',
          'configuracoes.visualizar'
        ]
      case 'secretario':
        return [
          'membros.visualizar', 'membros.adicionar', 'membros.editar',
          'relatorios.visualizar', 'relatorios.gerar'
        ]
      case 'tesoureiro':
        return [
          'financas.visualizar', 'financas.adicionar', 'financas.editar',
          'relatorios.visualizar', 'relatorios.gerar'
        ]
      case 'lider_ministerio':
        return ['membros.visualizar']
      default:
        return ['membros.visualizar']
    }
  }

  if (loading && !convite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-xl">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-red-600">Erro no Convite</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">{error}</p>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (registroSucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-green-600">Registro Concluído!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-6">
              Sua conta foi criada com sucesso. Você será redirecionado para a página de login em instantes...
            </p>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              Ir para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Criar Conta</CardTitle>
          <CardDescription className="text-center">
            Você foi convidado como <span className="font-medium">{convite?.cargo}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        {...field} 
                        disabled={true} 
                        className="bg-gray-100" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Digite a senha novamente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={loading}
              >
                {loading ? 'Criando Conta...' : 'Criar Conta'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Já tem uma conta? <a href="/login" className="text-primary hover:underline">Fazer login</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 