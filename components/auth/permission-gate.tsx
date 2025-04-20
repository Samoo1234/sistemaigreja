'use client'

import { ReactNode } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { Permissao, Cargo } from '@/lib/types';
import { useCongregacoes } from '@/lib/contexts/congregacoes-context';

interface PermissionGateProps {
  children: ReactNode;
  permissions?: Permissao[];
  cargos?: Cargo[];
  anyPermission?: boolean;
  congregacaoId?: string;  // ID da congregação que queremos verificar
  checkCongregacao?: boolean; // Se true, verifica se o usuário pertence à congregação
  fallback?: ReactNode;
}

/**
 * Componente que exibe conteúdo apenas se o usuário tiver as permissões necessárias
 * Útil para mostrar/esconder botões, menus, etc. baseado em permissões
 */
export default function PermissionGate({
  children,
  permissions = [],
  cargos = [],
  anyPermission = true,
  congregacaoId,
  checkCongregacao = false,
  fallback = null
}: PermissionGateProps) {
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
    // Administradores têm acesso a todas as congregações
    if (userData?.cargo === 'administrador') {
      hasCongregacaoAccess = true;
    } else {
      // Para outros usuários, verifica se a congregação corresponde
      hasCongregacaoAccess = userData?.congregacaoId === congregacaoId;
    }
  } else if (checkCongregacao && !congregacaoId && congregacaoAtual) {
    // Se não foi especificado uma congregação, usa a atual do contexto
    if (userData?.cargo === 'administrador') {
      hasCongregacaoAccess = true;
    } else {
      hasCongregacaoAccess = userData?.congregacaoId === congregacaoAtual.id;
    }
  }

  // Se tiver todas as condições, mostra o conteúdo
  if (hasRequiredPermissions && hasRequiredCargo && hasCongregacaoAccess) {
    return <>{children}</>;
  }

  // Caso contrário, mostra o fallback (ou nada)
  return <>{fallback}</>;
} 