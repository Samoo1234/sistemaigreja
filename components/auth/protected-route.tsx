'use client'

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { Permissao, Cargo } from '@/lib/types';
import AccessDenied from './access-denied';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: Permissao[];
  requiredCargos?: Cargo[];
  anyPermission?: boolean; // Se true, o usuário precisa de pelo menos uma das permissões requeridas
  checkCongregacao?: boolean; // Se true, verifica se o usuário pertence à congregação especificada
  congregacaoId?: string; // ID específico da congregação a verificar
  accessDeniedMessage?: string;
  accessDeniedBackTo?: string;
  accessDeniedBackLabel?: string;
}

// Componente que protege uma rota, verificando autenticação e permissões
export default function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredCargos = [],
  anyPermission = false,
  checkCongregacao = false,
  congregacaoId,
  accessDeniedMessage,
  accessDeniedBackTo = "/dashboard",
  accessDeniedBackLabel = "Voltar para o Dashboard"
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasAnyPermission, isCargo, userData } = useAuth();
  const router = useRouter();

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Se estiver carregando, mostra um indicador de carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, mostra loading até o redirecionamento
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Se não houver permissões ou cargos obrigatórios e não verificar congregação, 
  // apenas renderiza o conteúdo
  if (requiredPermissions.length === 0 && requiredCargos.length === 0 && !checkCongregacao) {
    return <>{children}</>;
  }

  // Verifica se o usuário tem as permissões requeridas
  const hasRequiredPermissions = requiredPermissions.length === 0 ? true : 
    anyPermission ? hasAnyPermission(requiredPermissions) : requiredPermissions.every(hasPermission);

  // Verifica se o usuário tem algum dos cargos requeridos
  const hasRequiredCargo = requiredCargos.length === 0 ? true :
    requiredCargos.some(cargo => isCargo(cargo));

  // Verifica a congregação se necessário
  let hasCongregacaoAccess = true;
  if (checkCongregacao && congregacaoId && userData) {
    // Administradores têm acesso a todas as congregações
    if (userData.cargo === 'administrador') {
      hasCongregacaoAccess = true;
    } else {
      // Para outros usuários, verifica se a congregação corresponde
      hasCongregacaoAccess = userData.congregacaoId === congregacaoId;
    }
  }

  // Se não tiver as permissões necessárias, mostra uma mensagem de acesso negado
  if (!hasRequiredPermissions || !hasRequiredCargo || !hasCongregacaoAccess) {
    // Determinar a mensagem adequada
    let message = accessDeniedMessage;
    if (!message) {
      if (!hasRequiredPermissions) {
        message = "Você não tem as permissões necessárias para acessar esta página.";
      } else if (!hasRequiredCargo) {
        message = "Seu cargo não permite acessar esta página.";
      } else {
        message = "Você não tem acesso a esta congregação.";
      }
    }

    return (
      <AccessDenied 
        message={message}
        backTo={accessDeniedBackTo}
        backLabel={accessDeniedBackLabel}
      />
    );
  }

  // Se tiver as permissões, renderiza o conteúdo
  return <>{children}</>;
} 