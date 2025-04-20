'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

interface AccessDeniedProps {
  message?: string
  backTo?: string
  backLabel?: string
}

/**
 * Componente para exibir uma mensagem de acesso negado
 * Usado quando um usuário tenta acessar uma área que não tem permissão
 */
export default function AccessDenied({
  message = "Você não tem permissões para acessar esta área.",
  backTo = "/dashboard",
  backLabel = "Voltar para o Dashboard"
}: AccessDeniedProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full text-center shadow-sm">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-red-700 mb-2">Acesso Negado</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <Button 
          onClick={() => router.push(backTo)}
          variant="outline"
          className="border-red-200 hover:bg-red-100 hover:text-red-700"
        >
          {backLabel}
        </Button>
      </div>
    </div>
  )
} 