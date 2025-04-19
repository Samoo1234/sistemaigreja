'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const formSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})

type FormValues = z.infer<typeof formSchema>

export default function Login() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true)
      setError(null)
      await signInWithEmailAndPassword(auth, data.email, data.password)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Erro ao fazer login:', error.code, error.message)
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Credenciais inválidas. Por favor, tente novamente.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Muitas tentativas de login. Tente novamente mais tarde.')
      } else if (error.code === 'auth/user-disabled') {
        setError('Esta conta foi desativada.')
      } else {
        setError('Ocorreu um erro ao fazer login. Por favor, tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Para depuração/demonstração apenas - Cria um usuário para teste se não houver
  const handleDemo = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithEmailAndPassword(auth, 'admin@igreja.com', 'admin123')
      router.push('/dashboard')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Se não existir, você poderia criar um usuário de demonstração
        // Isso seria feito em um ambiente real via Firebase Admin SDK em uma função serverless
        setError('Usuário de teste não encontrado. Em um ambiente real, você precisaria criar um usuário primeiro.')
      } else {
        setError('Erro ao fazer login com conta de demonstração: ' + error.message)
      }
      console.error('Erro demo login:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sistema Igreja</CardTitle>
          <CardDescription className="text-center">
            Entre na sua conta para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              
              <div className="text-center mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="text-xs" 
                  onClick={handleDemo}
                  disabled={loading}
                >
                  Entrar com Conta de Demonstração
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 