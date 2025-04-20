'use client'

import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useCongregacoes } from '@/lib/contexts/congregacoes-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { Church } from 'lucide-react';

export default function CongregacaoSelector() {
  const { congregacoes, congregacaoAtual, setCongregacaoAtualById } = useCongregacoes();
  const { userData, isCargo } = useAuth();
  const [visible, setVisible] = useState(false);

  // Só mostra o seletor para administradores ou pastores
  useEffect(() => {
    setVisible(isCargo('administrador') || isCargo('pastor'));
  }, [userData?.cargo, isCargo]);

  // Se não for visível ou se tiver apenas uma congregação, não mostra nada
  if (!visible || congregacoes.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Church className="h-4 w-4 text-gray-500" />
      <Select 
        value={congregacaoAtual?.id || ''} 
        onValueChange={setCongregacaoAtualById}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione uma congregação" />
        </SelectTrigger>
        <SelectContent>
          {congregacoes.map((congregacao) => (
            <SelectItem key={congregacao.id} value={congregacao.id}>
              {congregacao.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 