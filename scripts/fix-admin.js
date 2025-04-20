// Script para corrigir o documento do usuário administrador
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');
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

// Função para obter todas as permissões do administrador
function getAdminPermissions() {
  return [
    'membros.visualizar', 'membros.adicionar', 'membros.editar', 'membros.excluir',
    'financas.visualizar', 'financas.adicionar', 'financas.editar', 'financas.excluir',
    'congregacoes.visualizar', 'congregacoes.adicionar', 'congregacoes.editar', 'congregacoes.excluir',
    'relatorios.visualizar', 'relatorios.gerar',
    'configuracoes.visualizar', 'configuracoes.editar',
    'usuarios.visualizar', 'usuarios.adicionar', 'usuarios.editar', 'usuarios.excluir'
  ];
}

async function fixAdminUser() {
  try {
    console.log(`Tentando fazer login com ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Login bem-sucedido!');
    console.log('UID do usuário:', user.uid);
    
    // Atualizar dados do usuário no Firestore
    console.log('Atualizando dados do usuário no Firestore...');
    
    const updateData = {
      // Corrigir o cargo para minúsculo conforme esperado pelo sistema
      cargo: 'administrador',
      // Adicionar ID da congregação (vamos usar 'matriz' como padrão)
      congregacaoId: 'matriz',
      // Adicionar todas as permissões de administrador
      permissoes: getAdminPermissions(),
      // Garantir que o status esteja ativo
      status: 'ativo',
      // Atualizar último acesso
      ultimoAcesso: new Date()
    };
    
    const userRef = doc(db, 'usuarios', user.uid);
    await updateDoc(userRef, updateData);
    console.log('Documento do usuário atualizado com sucesso!');
    console.log('Dados atualizados:', updateData);
    console.log('\nAgora seu usuário deve ter acesso total ao sistema como administrador.');
    
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error.code, error.message);
  }
}

fixAdminUser(); 