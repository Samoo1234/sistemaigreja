'use client'

import { ReactNode } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Permissao, Cargo } from '@/lib/types';
import { useCongregacoes } from '@/lib/contexts/congregacoes-context';

interface ProtectedContentProps {
  children: ReactNode;
  permissions?: Permissao[];
  cargos?: Cargo[];
  anyPermission?: boolean;
  congregacaoId?: string;
  checkCongregacao?: boolean;
  fallback?: ReactNode;
}

/**
 * Componente que protege áreas específicas de conteúdo baseado em permissões e congregações
 * Similar ao PermissionGate, mas com um fallback mais elaborado para conteúdo
 */
export default function ProtectedContent({
  children,
  permissions = [],
  cargos = [],
  anyPermission = true,
  congregacaoId,
  checkCongregacao = false,
  fallback = (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <p className="text-red-600 font-medium">Acesso restrito</p>
      <p className="text-gray-600 text-sm mt-1">Você não tem permissão para visualizar este conteúdo.</p>
    </div>
  )
}: ProtectedContentProps) {
  const { hasPermission, hasAnyPermission, isCargo, userData } = useAuth();
  const { congregacaoAtual } = useCongregacoes();

  // Verifica as permissões
  const hasRequiredPermissions = permissions.length > 0
    ? (anyPermission 
        ? hasAnyPermission(permissions) 
        : permissions.every(hasPermission))
    : true;

  // Verifica os cargos
  const hasRequiredCargo = cargos.length > 0
    ? cargos.some(isCargo)
    : true;

  // Verifica a congregação se necessário
  let hasCongregacaoAccess = true;
  if (checkCongregacao && congregacaoId) {
    // Cargos que têm acesso a todas as congregações
    const cargosGerais = ['super_admin', 'administrador', 'secretario_geral', 'tesoureiro_geral'];
    if (userData?.cargo && cargosGerais.includes(userData.cargo)) {
      hasCongregacaoAccess = true;
    } else {
      // Para outros usuários, verifica se a congregação corresponde
      hasCongregacaoAccess = userData?.congregacaoId === congregacaoId;
    }
  } else if (checkCongregacao && !congregacaoId && congregacaoAtual) {
    // Se não foi especificado uma congregação, usa a atual do contexto
    const cargosGerais = ['super_admin', 'administrador', 'secretario_geral', 'tesoureiro_geral'];
    if (userData?.cargo && cargosGerais.includes(userData.cargo)) {
      hasCongregacaoAccess = true;
    } else {
      hasCongregacaoAccess = userData?.congregacaoId === congregacaoAtual.id;
    }
  }

  // Se tiver todas as condições, mostra o conteúdo
  if (hasRequiredPermissions && hasRequiredCargo && hasCongregacaoAccess) {
    return <>{children}</>;
  }

  // Caso contrário, mostra o fallback
  return <>{fallback}</>;
} 