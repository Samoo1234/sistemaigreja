import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase/config';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const configRef = doc(db, 'configuracoes', 'igreja');
    const configDoc = await getDoc(configRef);
    
    if (!configDoc.exists()) {
      return NextResponse.json({ error: 'Configuração não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json(configDoc.data());
  } catch (error) {
    console.error('Erro ao buscar configurações da igreja:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const configRef = doc(db, 'configuracoes', 'igreja');
    
    await setDoc(configRef, data, { merge: true });
    
    return NextResponse.json({ 
      message: 'Configurações atualizadas com sucesso',
      data 
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações da igreja:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
  }
} 