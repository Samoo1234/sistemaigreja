import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase/config';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function POST() {
  console.log('=== SINCRONIZAÇÃO - INÍCIO (SDK Cliente) ===');
  
  try {
    console.log('SINCRONIZAÇÃO - Buscando sede nas congregações...');
    
    // Buscar a sede nas congregações usando SDK do cliente
    const congregacoesRef = collection(db, 'congregacoes');
    const sedeQuery = query(congregacoesRef, where('isMatriz', '==', true));
    const sedeSnapshot = await getDocs(sedeQuery);
    
    if (sedeSnapshot.empty) {
      console.log('SINCRONIZAÇÃO - Nenhuma sede encontrada');
      return NextResponse.json({ 
        error: 'Sede não encontrada',
        details: 'Não foi encontrada uma congregação marcada como sede (isMatriz: true).' 
      }, { status: 404 });
    }
    
    const sedeDoc = sedeSnapshot.docs[0];
    const sedeData = sedeDoc.data();
    
    console.log('SINCRONIZAÇÃO - Dados da sede encontrados:', Object.keys(sedeData));
    
    // Preparar dados para configurações
    const configData = {
      nome: sedeData.nome || '',
      nomeAbreviado: sedeData.nomeAbreviado || '',
      endereco: sedeData.endereco || '',
      cidade: sedeData.cidade || '',
      estado: sedeData.estado || '',
      telefone: sedeData.telefone || '',
      email: sedeData.email || '',
      site: sedeData.site || '',
      pastor: sedeData.pastor || '',
      cnpj: sedeData.cnpj || '',
      // Manter outros campos se existirem
      ...sedeData
    };
    
    console.log('SINCRONIZAÇÃO - Salvando nas configurações...');
    
    // Salvar nas configurações usando SDK do cliente
    const configRef = doc(db, 'configuracoes', 'igreja');
    await setDoc(configRef, configData, { merge: true });
    
    console.log('SINCRONIZAÇÃO - Configurações atualizadas com sucesso');
    
    return NextResponse.json({ 
      message: 'Dados sincronizados com sucesso',
      source: 'sede',
      data: configData
    });
    
  } catch (error) {
    console.error('SINCRONIZAÇÃO - Erro:', error);
    return NextResponse.json({ 
      error: 'Erro ao sincronizar dados',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      details: 'Ocorreu um erro ao tentar sincronizar os dados da sede para as configurações.'
    }, { status: 500 });
  } finally {
    console.log('=== SINCRONIZAÇÃO - FIM ===');
  }
} 