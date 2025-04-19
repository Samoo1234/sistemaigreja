'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase/config'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateDemoUser() {
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleCreateUser = async () => {
    try {
      setLoading(true)
      setMessage(null)
      setSuccess(false)
      
      // Criar usuário de demonstração no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, 'admin@igreja.com', 'admin123')
      const user = userCredential.user
      
      // Atualiza o perfil com um nome de exibição
      await updateProfile(user, {
        displayName: 'Administrador'
      })
      
      // Criar dados do usuário no Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: 'Administrador',
        email: 'admin@igreja.com',
        cargo: 'Administrador',
        telefone: '(11) 99999-9999',
        permissoes: ['admin', 'secretaria', 'tesouraria', 'membros', 'redes_sociais'],
        dataCadastro: new Date(),
        ultimoAcesso: new Date()
      })
      
      // Criar alguns registros iniciais para demonstração
      await criarDadosDemonstracao(user.uid)
      
      setSuccess(true)
      setMessage('Usuário de demonstração criado com sucesso! Email: admin@igreja.com, Senha: admin123')
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      
      if (error.code === 'auth/email-already-in-use') {
        setMessage('O usuário de demonstração já existe. Você pode usá-lo para fazer login.')
        setSuccess(true)
      } else {
        setMessage(`Erro ao criar usuário: ${error.message}`)
        setSuccess(false)
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Função para criar dados de demonstração
  const criarDadosDemonstracao = async (userId: string) => {
    try {
      // Cria uma coleção para registrar as ações do usuário
      await setDoc(doc(db, 'logs', Date.now().toString()), {
        acao: 'criação de usuário demo',
        data: new Date(),
        usuarioId: userId,
        detalhes: 'Criação de usuário e dados iniciais de demonstração'
      })
    } catch (error) {
      console.error('Erro ao criar dados de demonstração:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Criar Usuário Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Esta página cria um usuário de demonstração para testar o sistema. 
            Em um ambiente de produção, você usaria um processo seguro para criação de usuários.
          </p>
          
          {message && (
            <div className={`p-3 rounded-md ${success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}
          
          <Button 
            onClick={handleCreateUser} 
            className="w-full" 
            disabled={loading || success}
          >
            {loading ? 'Criando...' : 'Criar Usuário Demo'}
          </Button>
          
          {success && (
            <div className="text-center">
              <a href="/login" className="text-blue-600 hover:underline">
                Ir para o login
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 