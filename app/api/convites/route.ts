import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { v4 as uuidv4 } from 'uuid';
import * as sgMail from '@sendgrid/mail';

// Definição da interface Convite
interface Convite {
  id: string;
  email: string;
  nome: string;
  perfil: string;
  congregacao: string;
  congregacaoNome: string;
  status: 'pendente' | 'aceito' | 'rejeitado';
  token: string;
  dataCriacao: string;
  dataExpiracao: string;
  criadoPorId?: string;
  criadoPorNome?: string;
}

// Configuração do SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Função para criar um novo convite
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      email, 
      nome, 
      perfil, 
      congregacao, 
      congregacaoNome,
      criadoPorId,
      criadoPorNome
    } = data;

    // Validação dos campos obrigatórios
    if (!email || !nome || !perfil || !congregacao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      );
    }

    // Verificar se o adminDb está inicializado
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }

    // Verificar se já existe um convite pendente para este email
    const convitesRef = adminDb.collection('convites');
    const querySnapshot = await convitesRef
      .where('email', '==', email)
      .where('status', '==', 'pendente')
      .get();

    if (!querySnapshot.empty) {
      return NextResponse.json(
        { error: 'Já existe um convite pendente para este email' },
        { status: 409 }
      );
    }

    // Criar um token único
    const token = uuidv4();
    
    // Data de expiração (7 dias a partir de agora)
    const hoje = new Date();
    const dataExpiracao = new Date(hoje);
    dataExpiracao.setDate(hoje.getDate() + 7);

    // Dados do convite
    const conviteData = {
      email,
      nome,
      perfil,
      congregacao,
      congregacaoNome,
      status: 'pendente',
      token,
      dataCriacao: hoje.toISOString(),
      dataExpiracao: dataExpiracao.toISOString(),
      criadoPorId,
      criadoPorNome
    };

    // Salvar no Firestore
    const docRef = await convitesRef.add(conviteData);
    
    // Construir URL de aceitação
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/aceitar-convite?token=${token}`;

    // Enviar email com SendGrid
    try {
      const msg = {
        to: email,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@igreja.com',
        subject: 'Convite para o Sistema de Gestão da Igreja',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333; margin-bottom: 20px;">Olá, ${nome}!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">Você foi convidado para participar do Sistema de Gestão da Igreja como <strong>${perfil}</strong> na congregação <strong>${congregacaoNome}</strong>.</p>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">Para aceitar este convite, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Aceitar Convite</a>
            </div>
            <p style="color: #555; font-size: 14px;">Este convite expirará em 7 dias (${dataExpiracao.toLocaleDateString()}).</p>
            <p style="color: #777; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">Este é um email automático, por favor não responda.</p>
          </div>
        `,
      };
      await sgMail.send(msg);
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Não falhar o processo se o email falhar, apenas registrar o erro
    }

    return NextResponse.json({ id: docRef.id, ...conviteData }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar convite:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Função para listar todos os convites
export async function GET() {
  try {
    // Verificar se o adminDb está inicializado
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }

    const convitesRef = adminDb.collection('convites');
    const snapshot = await convitesRef.get();
    
    const convites: Convite[] = [];
    snapshot.forEach((doc) => {
      convites.push({ id: doc.id, ...doc.data() } as Convite);
    });
    
    return NextResponse.json(convites);
  } catch (error) {
    console.error('Erro ao listar convites:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Função para atualizar o status de um convite
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, status } = data;
    
    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID e status são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (!['pendente', 'aceito', 'rejeitado'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se o adminDb está inicializado
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }
    
    const conviteRef = adminDb.collection('convites').doc(id);
    const doc = await conviteRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      );
    }
    
    await conviteRef.update({ status });
    
    return NextResponse.json({ id, status });
  } catch (error) {
    console.error('Erro ao atualizar convite:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

// Função para excluir um convite
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se o adminDb está inicializado
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      );
    }
    
    const conviteRef = adminDb.collection('convites').doc(id);
    const doc = await conviteRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Convite não encontrado' },
        { status: 404 }
      );
    }
    
    await conviteRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir convite:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 