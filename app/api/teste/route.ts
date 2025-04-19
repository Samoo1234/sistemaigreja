import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'API funcionando corretamente' }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    return NextResponse.json({ 
      message: 'Dados recebidos com sucesso',
      data
    }, { status: 200 });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({ 
      message: error instanceof Error ? error.message : 'Erro ao processar dados'
    }, { status: 500 });
  }
} 