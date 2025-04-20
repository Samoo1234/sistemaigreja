'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

// Componentes de alerta personalizados que usam os componentes importados
const SuccessAlert = ({ message }: { message: string }) => (
  <Alert className="border-green-500 bg-green-50">
    <div className="flex items-center gap-2">
      <Check className="h-4 w-4 text-green-500" />
      <AlertTitle>Sucesso</AlertTitle>
    </div>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

const ErrorAlert = ({ message }: { message: string }) => (
  <Alert className="border-red-500 bg-red-50">
    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4 text-red-500" />
      <AlertTitle>Erro</AlertTitle>
    </div>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

// Ícones
const Icons = {
  spinner: Loader2,
  check: Check,
  alert: AlertCircle
};

function AceitarConviteConteudo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [convite, setConvite] = useState<any>(null);
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Verificar o token quando a página carregar
  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        setError('Token de convite não fornecido');
        setLoading(false);
        return;
      }
      
      try {
        // Buscar convite pelo token
        const response = await fetch(`/api/convites/validar?token=${token}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Erro ao validar o convite');
        }
        
        if (data.status !== 'pendente') {
          if (data.status === 'aceito') {
            setError('Este convite já foi aceito');
          } else {
            setError('Este convite não está mais disponível');
          }
          setLoading(false);
          return;
        }
        
        // Verificar se o convite expirou
        const dataExpiracao = new Date(data.dataExpiracao);
        if (dataExpiracao < new Date()) {
          setError('Este convite expirou');
          setLoading(false);
          return;
        }
        
        // Configurar o estado com os dados do convite
        setConvite(data);
        setEmail(data.email);
        setLoading(false);
      } catch (err) {
        console.error('Erro ao validar token:', err);
        setError('Erro ao validar o convite. Por favor, tente novamente ou solicite um novo convite.');
        setLoading(false);
      }
    };
    
    validarToken();
  }, [token]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!convite) {
      setError('Convite não encontrado');
      return;
    }
    
    if (senha !== confirmSenha) {
      setError('As senhas não coincidem');
      return;
    }
    
    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      
      // Atualizar perfil do usuário
      await updateProfile(user, {
        displayName: convite.nome,
      });
      
      // Adicionar usuário ao Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        nome: convite.nome,
        email: convite.email,
        perfil: convite.perfil,
        congregacao: convite.congregacao,
        congregacaoNome: convite.congregacaoNome,
        dataCriacao: new Date().toISOString(),
        uid: user.uid,
        ativo: true,
      });
      
      // Atualizar status do convite para 'aceito'
      await fetch('/api/convites', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: convite.id,
          status: 'aceito',
        }),
      });
      
      setSuccess(true);
      
      // Redirecionar para o dashboard após 3 segundos
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      console.error('Erro ao criar conta:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email já está em uso. Por favor, faça login ou use outro email.');
      } else {
        setError(`Erro ao criar sua conta: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Icons.spinner className="h-8 w-8 animate-spin" />
          <p className="text-lg text-muted-foreground">Verificando convite...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container flex h-screen flex-col items-center justify-center max-w-md">
        <ErrorAlert message={error} />
        <Button variant="outline" onClick={() => router.push('/')}>
          Voltar para a página inicial
        </Button>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="container flex h-screen flex-col items-center justify-center max-w-md">
        <SuccessAlert message="Conta criada com sucesso!" />
        <Button variant="default" onClick={() => router.push('/')}>
          Ir para o sistema agora
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container flex h-screen flex-col items-center justify-center max-w-md">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Aceitar Convite</CardTitle>
          <CardDescription>
            Complete seu cadastro para acessar o sistema como {convite?.perfil} na congregação {convite?.congregacaoNome}.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={email} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input 
                id="senha" 
                type="password" 
                value={senha} 
                onChange={(e) => setSenha(e.target.value)} 
                required 
                placeholder="Crie uma senha segura"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmSenha">Confirmar Senha</Label>
              <Input 
                id="confirmSenha" 
                type="password" 
                value={confirmSenha} 
                onChange={(e) => setConfirmSenha(e.target.value)} 
                required 
                placeholder="Repita sua senha"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> 
                  Processando...
                </>
              ) : (
                'Criar minha conta'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function AceitarConvite() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-lg text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <AceitarConviteConteudo />
    </Suspense>
  );
} 