'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Congregacao } from '@/lib/types';
import { useAuth } from './auth-context';

interface CongregacoesContextType {
  congregacoes: Congregacao[];
  congregacaoAtual: Congregacao | null;
  setCongregacaoAtualById: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const CongregacoesContext = createContext<CongregacoesContextType | undefined>(undefined);

export const CongregacoesProvider = ({ children }: { children: ReactNode }) => {
  const [congregacoes, setCongregacoes] = useState<Congregacao[]>([]);
  const [congregacaoAtual, setCongregacaoAtual] = useState<Congregacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { congregacaoId, userData, isAuthenticated } = useAuth();

  // Função para carregar as congregações
  const loadCongregacoes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Se não estiver autenticado, não carrega nada
      if (!isAuthenticated) {
        setCongregacoes([]);
        setCongregacaoAtual(null);
        return;
      }
      
      // Se for administrador, carrega todas as congregações
      // Caso contrário, carrega apenas a congregação do usuário
      const congregacoesRef = collection(db, 'congregacoes');
      
      // Agora sempre carregamos todas as congregações, 
      // independente do cargo do usuário
      const q = query(congregacoesRef);
      
      const querySnapshot = await getDocs(q);
      const congregacoesData: Congregacao[] = [];
      
      querySnapshot.forEach((doc) => {
        congregacoesData.push({ id: doc.id, ...doc.data() } as Congregacao);
      });
      
      setCongregacoes(congregacoesData);
      console.log('Congregações carregadas:', congregacoesData);
      
      // Define a congregação atual como a do usuário logado ou a primeira da lista
      if (congregacaoId) {
        const userCongregacao = congregacoesData.find((c) => c.id === congregacaoId);
        if (userCongregacao) {
          setCongregacaoAtual(userCongregacao);
        } else if (congregacoesData.length > 0) {
          setCongregacaoAtual(congregacoesData[0]);
        }
      } else if (congregacoesData.length > 0) {
        setCongregacaoAtual(congregacoesData[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar congregações:', err);
      setError('Erro ao carregar congregações. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega as congregações quando o componente é montado ou quando o usuário muda
  useEffect(() => {
    console.log('CongregacoesProvider: isAuthenticated =', isAuthenticated);
    console.log('CongregacoesProvider: userData =', userData);
    console.log('CongregacoesProvider: congregacaoId =', congregacaoId);
    
    if (isAuthenticated) {
      loadCongregacoes();
    }
  }, [isAuthenticated, congregacaoId]);

  // Função para definir a congregação atual pelo ID
  const setCongregacaoAtualById = (id: string) => {
    const congregacao = congregacoes.find((c) => c.id === id);
    if (congregacao) {
      setCongregacaoAtual(congregacao);
    }
  };

  return (
    <CongregacoesContext.Provider
      value={{
        congregacoes,
        congregacaoAtual,
        setCongregacaoAtualById,
        isLoading,
        error,
        reload: loadCongregacoes,
      }}
    >
      {children}
    </CongregacoesContext.Provider>
  );
};

// Hook para usar o contexto de congregações
export const useCongregacoes = () => {
  const context = useContext(CongregacoesContext);
  if (context === undefined) {
    throw new Error('useCongregacoes deve ser usado dentro de um CongregacoesProvider');
  }
  return context;
}; 