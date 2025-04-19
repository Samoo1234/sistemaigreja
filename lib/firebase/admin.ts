import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Variáveis para armazenar as instâncias
let adminApp;
let adminDb = null;

// Função para processar corretamente a chave privada
function processPrivateKey(key: string | undefined): string {
  if (!key) return '';
  
  // Se a chave estiver codificada com \n literais, substituir por quebras de linha reais
  if (key.includes('\\n')) {
    return key.replace(/\\n/g, '\n');
  }
  
  return key;
}

// Função para inicializar o Firebase Admin
function initializeFirebaseAdmin() {
  // Evitar inicialização duplicada
  if (getApps().length > 0) {
    console.log('Firebase Admin já inicializado');
    adminApp = getApps()[0];
    adminDb = getFirestore();
    return;
  }

  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = processPrivateKey(process.env.FIREBASE_PRIVATE_KEY);
    
    if (!projectId || !clientEmail || !privateKey) {
      console.error('Credenciais Firebase Admin incompletas:',
        !projectId ? 'Falta projectId' : '',
        !clientEmail ? 'Falta clientEmail' : '',
        !privateKey ? 'Falta privateKey' : '');
      return;
    }
    
    // Log dos primeiros caracteres da chave para debug (sem expor a chave completa)
    console.log(`Inicializando Firebase Admin com projectId: ${projectId}`);
    console.log(`Chave privada começa com: ${privateKey.substring(0, 10)}...`);
    console.log(`Chave privada tem ${privateKey.length} caracteres`);
    
    // Inicializar o app com as credenciais processadas
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    
    // Inicializar Firestore
    adminDb = getFirestore();
    console.log('Firebase Admin inicializado com sucesso');
  } catch (error) {
    // Log detalhado do erro para diagnóstico
    console.error('Erro ao inicializar Firebase Admin:', error);
    if (error instanceof Error) {
      console.error('Mensagem de erro:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Não vamos lançar o erro, mas deixar adminDb como null para indicar falha
    adminDb = null;
  }
}

// Inicializar o SDK
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.error('Erro fatal na inicialização do Firebase Admin:', error);
}

export { adminDb }; 