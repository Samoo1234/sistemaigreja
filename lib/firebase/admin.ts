import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Configurações para o Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Correção para o erro "error:1E08010C:DECODER routines::unsupported" no Vercel
  privateKey: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/\n/g, '\n') 
    : undefined,
};

// Se estiver usando JSON codificado em base64
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const decodedServiceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString()
    );
    Object.assign(firebaseAdminConfig, decodedServiceAccount);
    console.log('Credenciais decodificadas com sucesso de base64');
  } catch (error) {
    console.error('Erro ao decodificar credenciais base64:', error);
  }
}

// Inicializa o app Firebase Admin apenas uma vez
let adminApp;
if (!getApps().length) {
  try {
    adminApp = initializeApp({
      credential: cert(firebaseAdminConfig),
    });
    console.log('Firebase Admin inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin:', error);
  }
} else {
  adminApp = getApps()[0];
}

// Inicializa o serviço Firestore
const adminDb = adminApp ? getFirestore() : null;

export { adminDb }; 