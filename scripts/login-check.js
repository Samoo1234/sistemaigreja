// Script para testar login e verificar permissões
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Configuração do Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'church-e0ff0',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('Inicializando Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Credenciais de login
const email = 'admin@igreja.com';
const password = 'admin123';

async function checkLogin() {
  try {
    console.log(`Tentando fazer login com ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Login bem-sucedido!');
    console.log('UID do usuário:', user.uid);
    
    // Buscar dados do usuário no Firestore
    console.log('Buscando dados do usuário no Firestore...');
    const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('Dados do usuário encontrados:');
      console.log('Nome:', userData.nome);
      console.log('Email:', userData.email);
      console.log('Cargo:', userData.cargo);
      console.log('Congregação ID:', userData.congregacaoId);
      console.log('Permissões:', userData.permissoes);
      
      // Verificar se o usuário é administrador
      if (userData.cargo === 'administrador') {
        console.log('Este usuário é um administrador e deve ter acesso total ao sistema.');
      } else {
        console.log('ATENÇÃO: Este usuário NÃO é um administrador!');
      }
    } else {
      console.log('ERRO: Documento do usuário não encontrado no Firestore!');
      console.log('O usuário existe na Autenticação, mas não tem correspondência no Firestore.');
      console.log('Isso pode causar problemas de permissão, pois as regras dependem dos dados do Firestore.');
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error.code, error.message);
  }
}

checkLogin(); 