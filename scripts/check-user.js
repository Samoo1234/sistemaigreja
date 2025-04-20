// Script para verificar usuários no Firestore usando o Firebase Client em vez do Admin
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' }); // Carrega variáveis de ambiente do .env.local

// Configuração do Firebase Client
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'church-e0ff0',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

console.log('Inicializando Firebase com projectId:', firebaseConfig.projectId);

// Inicialização do Firebase Client
try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  // Função para verificar usuário específico
  async function checkUser() {
    try {
      console.log('Buscando usuário com email: admin@igreja.com');
      
      // Buscar o usuário com o email específico
      const usersRef = collection(db, 'usuarios');
      const q = query(usersRef, where('email', '==', 'admin@igreja.com'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('Nenhum usuário encontrado com o email admin@igreja.com');
      } else {
        snapshot.forEach(doc => {
          console.log('Usuário encontrado:');
          console.log(`ID: ${doc.id}`);
          console.log(`Dados: ${JSON.stringify(doc.data(), null, 2)}`);
        });
      }
      
      // Buscar todos os usuários para comparação
      console.log('\nListando todos os usuários:');
      const allUsersSnapshot = await getDocs(collection(db, 'usuarios'));
      
      if (allUsersSnapshot.empty) {
        console.log('Nenhum usuário encontrado na coleção');
      } else {
        allUsersSnapshot.forEach(doc => {
          const userData = doc.data();
          console.log(`ID: ${doc.id}, Email: ${userData.email}, Cargo: ${userData.cargo}`);
        });
      }
    } catch (error) {
      console.error('Erro ao verificar usuários:', error);
    }
  }

  // Executar a verificação
  checkUser();
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
} 