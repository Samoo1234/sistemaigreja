import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('API GET - Iniciando busca de configurações com SDK Cliente');
  
  try {
    console.log('API GET - Obtendo referência do documento');
    const configRef = doc(db, 'configuracoes', 'igreja');
    
    console.log('API GET - Buscando documento');
    const configDoc = await getDoc(configRef);
    
    console.log('API GET - Documento encontrado?', configDoc.exists());
    
    if (!configDoc.exists()) {
      console.log('API GET - Documento não encontrado');
      return NextResponse.json({ 
        error: 'Configuração não encontrada',
        details: 'O documento de configuração não existe no Firestore.' 
      }, { status: 404 });
    }
    
    const data = configDoc.data();
    console.log('API GET - Retornando dados');
    return NextResponse.json(data);
  } catch (error) {
    console.error('API GET - Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar configurações',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('=== API POST - INÍCIO (SDK Cliente) ===');
  
  try {
    // Verificar se o request body é válido
    let data;
    try {
      console.log('API POST - Lendo corpo da requisição...');
      data = await request.json();
      console.log('API POST - Dados recebidos com sucesso');
      console.log('API POST - Estrutura dos dados:', Object.keys(data));
    } catch (jsonError) {
      console.error('API POST - Erro ao analisar JSON da requisição:', jsonError);
      return NextResponse.json({ 
        error: 'Corpo da requisição inválido',
        details: 'O corpo da requisição não contém um JSON válido'
      }, { status: 400 });
    }
    
    // Validação básica dos dados
    if (!data || typeof data !== 'object') {
      console.error('API POST - Dados inválidos recebidos');
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: 'O corpo da requisição não contém um objeto válido'
      }, { status: 400 });
    }
    
    console.log('API POST - Obtendo referência do documento...');
    const configRef = doc(db, 'configuracoes', 'igreja');
    console.log('API POST - Referência obtida');
    
    console.log('API POST - Salvando configurações da igreja...');
    await setDoc(configRef, data, { merge: true });
    console.log('API POST - Configurações salvas com sucesso');
    
    console.log('API POST - Retornando resposta de sucesso');
    return NextResponse.json({ 
      message: 'Configurações atualizadas com sucesso',
      data
    });
    
  } catch (error) {
    console.error('=== API POST - ERRO CRÍTICO ===');
    console.error('API POST - Erro:', error);
    
    // Retornar erro mais detalhado
    return NextResponse.json({ 
      error: 'Erro ao salvar configurações',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      details: 'Ocorreu um erro interno no servidor ao tentar salvar as configurações.'
    }, { status: 500 });
  } finally {
    console.log('=== API POST - FIM ===');
  }
} 