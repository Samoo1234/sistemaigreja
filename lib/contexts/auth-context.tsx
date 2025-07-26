'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Usuario, Permissao, Cargo, permissoesPorCargo } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  userData: Partial<Usuario> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  congregacaoId: string | null;
  hasPermission: (permission: Permissao) => boolean;
  hasAnyPermission: (permissions: Permissao[]) => boolean;
  isCargo: (cargo: Cargo) => boolean;
  isCargoGeral: () => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<Partial<Usuario> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Função para buscar dados do usuário no Firestore
  const fetchUserData = async (userId: string) => {
    try {
      const userRef = doc(db, 'usuarios', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data() as Partial<Usuario>;
        setUserData(data);

        // Atualiza último acesso
        await updateDoc(userRef, { ultimoAcesso: new Date() });
      } else {
        console.log('Usuário não encontrado no Firestore. Criando...');
        
        // Se não existir no Firestore, cria um documento com valores padrão
        if (user) {
          // Assumimos congregação matriz por padrão para novos usuários
          // Em produção, isso seria feito de forma diferente (por convite, por exemplo)
          const defaultUserData: Partial<Usuario> = {
            nome: user.displayName || 'Usuário',
            email: user.email || '',
            cargo: 'usuario',
            congregacaoId: 'matriz', // ID da congregação matriz
            permissoes: permissoesPorCargo['usuario'],
            dataCadastro: new Date(),
            ultimoAcesso: new Date(),
            status: 'ativo'
          };
          
          await setDoc(userRef, defaultUserData);
          setUserData(defaultUserData);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Monitora alterações no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUserData(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Função para verificar se o usuário tem uma permissão específica
  const hasPermission = (permission: Permissao): boolean => {
    if (!userData?.permissoes) return false;
    return userData.permissoes.includes(permission);
  };

  // Função para verificar se o usuário tem qualquer uma das permissões especificadas
  const hasAnyPermission = (permissions: Permissao[]): boolean => {
    if (!userData?.permissoes) return false;
    return permissions.some(permission => userData.permissoes?.includes(permission));
  };

  // Função para verificar o cargo do usuário
  const isCargo = (cargo: Cargo): boolean => {
    return userData?.cargo === cargo;
  };

  // Função para verificar se o usuário tem cargo geral (acesso a todas as congregações)
  const isCargoGeral = (): boolean => {
    const cargosGerais = ['super_admin', 'administrador', 'secretario_geral', 'tesoureiro_geral'];
    return userData?.cargo ? cargosGerais.includes(userData.cargo) : false;
  };

  // Função para fazer logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        isLoading,
        isAuthenticated: !!user,
        congregacaoId: userData?.congregacaoId || null,
        hasPermission,
        hasAnyPermission,
        isCargo,
        isCargoGeral,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 