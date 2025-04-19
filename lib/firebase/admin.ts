import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Inicializa o app Firebase Admin apenas uma vez
let adminApp;
let adminDb = null;

// Função para inicializar o Firebase Admin SDK com tratamento melhorado para chaves privadas
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    console.log('Firebase Admin já está inicializado');
    adminApp = getApps()[0];
    adminDb = getFirestore();
    return;
  }

  try {
    // Configurações para o Firebase Admin SDK
    const firebaseAdminConfig: any = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Tratamento da chave privada
    if (process.env.FIREBASE_PRIVATE_KEY) {
      // Certifique-se de que as quebras de linha sejam processadas corretamente
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // Se a chave contiver \n literais, substituir por quebras de linha reais
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      firebaseAdminConfig.privateKey = privateKey;
      console.log('Chave privada processada');
    } else {
      console.error('FIREBASE_PRIVATE_KEY não encontrada nas variáveis de ambiente');
    }

    // Tentar carregar da variável codificada em base64 se disponível
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      try {
        console.log('Tentando decodificar credenciais do Firebase de base64');
        const decodedServiceAccount = JSON.parse(
          Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
        );
        
        // Usar as credenciais decodificadas
        adminApp = initializeApp({
          credential: cert(decodedServiceAccount),
        });
        console.log('Firebase Admin inicializado com credenciais base64');
      } catch (error) {
        console.error('Erro ao decodificar credenciais base64:', error);
        throw error;
      }
    } 
    // Se não tivermos base64, usar as configurações normais
    else if (firebaseAdminConfig.projectId && firebaseAdminConfig.clientEmail && firebaseAdminConfig.privateKey) {
      adminApp = initializeApp({
        credential: cert(firebaseAdminConfig),
      });
      console.log('Firebase Admin inicializado com variáveis de ambiente');
    } else {
      throw new Error('Credenciais Firebase Admin incompletas nas variáveis de ambiente');
    }

    // Inicializa o serviço Firestore
    adminDb = getFirestore();
    console.log('Firebase Admin inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
    throw error;
  }
}

// Inicializa o Firebase Admin
try {
  initializeFirebaseAdmin();
} catch (error) {
  console.error('Falha ao inicializar Firebase Admin:', error);
}

export { adminDb }; 