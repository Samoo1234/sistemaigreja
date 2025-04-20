import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

// Endpoint para criar uma nova congregação
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validar dados mínimos
    if (!data.nome || !data.endereco || !data.cidade || !data.estado || !data.pastor) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }
    
    // Criar registro usando o Admin SDK (ignora regras de segurança)
    if (!adminDb) {
      throw new Error('Firebase Admin não está inicializado');
    }
    
    const docRef = await adminDb.collection('congregacoes').add({
      ...data,
      membros: data.membros || 0,
      status: data.status || 'ativa',
      isMatriz: data.isMatriz || false,
      dataCriacao: new Date().toISOString()
    });
    
    // Retornar o novo ID
    return NextResponse.json({ 
      id: docRef.id,
      ...data,
      status: data.status || 'ativa',
      isMatriz: data.isMatriz || false
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar congregação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Endpoint para atualizar uma congregação existente
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da congregação é obrigatório' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Validar dados mínimos
    if (!data.nome || !data.endereco || !data.cidade || !data.estado || !data.pastor) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }
    
    // Atualizar registro usando o Admin SDK (ignora regras de segurança)
    if (!adminDb) {
      throw new Error('Firebase Admin não está inicializado');
    }
    
    await adminDb.collection('congregacoes').doc(id).update({
      ...data,
      dataAtualizacao: new Date().toISOString()
    });
    
    // Retornar sucesso
    return NextResponse.json({ 
      id,
      ...data
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar congregação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 