'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/secretaria');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">Redirecionando...</h1>
        <p className="mt-2 text-gray-600">Por favor, aguarde enquanto você é redirecionado para a página principal.</p>
      </div>
    </div>
  );
} 