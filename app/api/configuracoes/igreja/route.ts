import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase/admin';

export const dynamic = 'force-dynamic';

// Função auxiliar para log de erros
function logError(prefix: string, error: unknown) {
  console.error(`${prefix} - Erro:`, error);
  if (error instanceof Error) {
    console.error(`${prefix} - Mensagem:`, error.message);
    console.error(`${prefix} - Stack:`, error.stack);
    // Verifica se existe cause no erro (comum em erros do Firebase)
    if ('cause' in error) {
      console.error(`${prefix} - Cause:`, (error as any).cause);
    }
  }
}

export async function GET() {
  console.log('API GET - Iniciando busca de configurações com Admin SDK');
  
  try {
    // Verificar se o adminDb foi inicializado corretamente
    if (!adminDb) {
      console.error('API GET - Admin DB não inicializado - Verificar credenciais Firebase');
      return NextResponse.json({ 
        error: 'Serviço indisponível', 
        details: 'Não foi possível conectar ao Firebase Admin SDK. Verifique as variáveis de ambiente.' 
      }, { status: 500 });
    }

    console.log('API GET - Obtendo referência do documento');
    const configRef = adminDb.collection('configuracoes').doc('igreja');
    
    console.log('API GET - Buscando documento');
    const configDoc = await configRef.get();
    
    console.log('API GET - Documento encontrado?', configDoc.exists);
    
    if (!configDoc.exists) {
      console.log('API GET - Documento não encontrado - Criando configuração padrão');
      
      // Configuração padrão que poderia ser criada se necessário
      // Comentado para não criar automaticamente
      /*
      const configPadrao = {
        nome: 'Igreja Evangélica Nacional',
        nomeAbreviado: 'Sistema Igreja',
        // ... outros campos ...
      };
      
      await configRef.set(configPadrao);
      return NextResponse.json(configPadrao);
      */
      
      return NextResponse.json({ 
        error: 'Configuração não encontrada',
        details: 'O documento de configuração não existe no Firestore.' 
      }, { status: 404 });
    }
    
    const data = configDoc.data();
    console.log('API GET - Retornando dados');
    return NextResponse.json(data);
  } catch (error) {
    logError('API GET', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar configurações',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('API POST - Iniciando salvamento de configurações com Admin SDK');
  
  try {
    // Verificar se o adminDb foi inicializado corretamente
    if (!adminDb) {
      console.error('API POST - Admin DB não inicializado - Verificar credenciais Firebase');
      return NextResponse.json({ 
        error: 'Serviço indisponível', 
        details: 'Não foi possível conectar ao Firebase Admin SDK. Verifique as variáveis de ambiente.' 
      }, { status: 500 });
    }

    // Verificar se o request body é válido
    let data;
    try {
      console.log('API POST - Lendo corpo da requisição');
      data = await request.json();
      console.log('API POST - Dados recebidos');
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
    
    console.log('API POST - Obtendo referência do documento');
    const configRef = adminDb.collection('configuracoes').doc('igreja');
    
    console.log('API POST - Salvando documento');
    await configRef.set(data, { merge: true });
    
    console.log('API POST - Documento salvo com sucesso');
    return NextResponse.json({ 
      message: 'Configurações atualizadas com sucesso',
      data
    });
  } catch (error) {
    logError('API POST', error);
    return NextResponse.json({ 
      error: 'Erro ao atualizar configurações',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : null) : undefined,
      details: 'Ocorreu um erro ao tentar salvar as configurações no Firestore.'
    }, { status: 500 });
  }
} 