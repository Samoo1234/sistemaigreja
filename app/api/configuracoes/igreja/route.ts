import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase/config';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('API GET - Iniciando busca de configurações');
  try {
    console.log('API GET - Obtendo referência do documento', { db });
    const configRef = doc(db, 'configuracoes', 'igreja');
    
    console.log('API GET - Buscando documento');
    const configDoc = await getDoc(configRef);
    
    console.log('API GET - Documento encontrado?', configDoc.exists());
    
    if (!configDoc.exists()) {
      console.log('API GET - Documento não encontrado');
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 });
    }
    
    console.log('API GET - Retornando dados', configDoc.data());
    return NextResponse.json(configDoc.data());
  } catch (error) {
    console.error('API GET - Erro ao buscar configurações da igreja:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar configurações',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('API POST - Iniciando salvamento de configurações');
  try {
    console.log('API POST - Lendo corpo da requisição');
    const data = await request.json();
    console.log('API POST - Dados recebidos:', data);
    
    console.log('API POST - Obtendo referência do documento');
    const configRef = doc(db, 'configuracoes', 'igreja');
    
    console.log('API POST - Salvando documento');
    await setDoc(configRef, data, { merge: true });
    
    console.log('API POST - Documento salvo com sucesso');
    return NextResponse.json({ 
      message: 'Configurações atualizadas com sucesso',
      data 
    });
  } catch (error) {
    console.error('API POST - Erro ao atualizar configurações da igreja:', error);
    return NextResponse.json({ 
      error: 'Erro ao atualizar configurações',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 