import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    message: 'API está funcionando!',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const data = await request.json();
  
  return NextResponse.json({
    message: 'Dados recebidos com sucesso',
    data,
    timestamp: new Date().toISOString(),
  });
} 