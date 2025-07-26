import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('=== TESTE FIREBASE ADMIN ===');
  
  try {
    // Verificar se o adminDb está disponível
    if (!adminDb) {
      console.error('TESTE - adminDb é null/undefined');
      return NextResponse.json({ 
        status: 'erro',
        message: 'adminDb não está inicializado',
        details: 'Verifique as variáveis de ambiente do Firebase'
      }, { status: 500 });
    }

    console.log('TESTE - adminDb está disponível');
    
    // Tentar fazer uma operação simples
    const testRef = adminDb.collection('teste').doc('ping');
    await testRef.set({ 
      timestamp: new Date().toISOString(),
      message: 'Teste de conexão'
    });
    
    console.log('TESTE - Operação de escrita bem-sucedida');
    
    // Ler o documento
    const doc = await testRef.get();
    console.log('TESTE - Operação de leitura bem-sucedida');
    
    // Limpar o documento de teste
    await testRef.delete();
    console.log('TESTE - Documento de teste removido');
    
    return NextResponse.json({ 
      status: 'sucesso',
      message: 'Firebase Admin SDK está funcionando corretamente',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('TESTE - Erro:', error);
    return NextResponse.json({ 
      status: 'erro',
      message: 'Erro ao testar Firebase Admin SDK',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const data = await request.json();
  
  return NextResponse.json({
    message: 'Dados recebidos com sucesso',
    data,
    timestamp: new Date().toISOString(),
  });
} 