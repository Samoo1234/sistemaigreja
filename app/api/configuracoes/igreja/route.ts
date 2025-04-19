import { NextRequest, NextResponse } from 'next/server';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Tipo para as configurações da igreja
type IgrejaConfig = {
  nome: string;
  nomeAbreviado: string;
  logo?: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  site?: string;
  corPrimaria: string;
  corSecundaria: string;
};

// Handler da API para método POST
export async function POST(request: NextRequest) {
  try {
    // Obtém os dados da requisição
    const data = await request.json() as IgrejaConfig;
    
    // Salva os dados no Firestore
    const configRef = doc(db, 'configuracoes', 'igreja');
    await setDoc(configRef, data);

    // Retorna sucesso
    return NextResponse.json({ 
      success: true,
      message: 'Configurações salvas com sucesso no Firestore',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na API:', error);
    
    // Retorna erro
    return NextResponse.json({ 
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 