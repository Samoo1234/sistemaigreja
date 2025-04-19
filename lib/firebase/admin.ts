import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Configurações para o Firebase Admin SDK
const firebaseAdminConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined,
};

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