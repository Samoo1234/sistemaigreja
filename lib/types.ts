/**
 * Tipos para a aplicação da Igreja
 */

// Tipo para as configurações da igreja
export type IgrejaConfig = {
  nome: string;
  nomeAbreviado: string;
  logo?: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  site?: string;
  pastor?: string;
  cnpj?: string;
  corPrimaria: string;
  corSecundaria: string;
  horarios?: Array<{
    dia: string;
    horario: string;
  }>;
  proximosEventos?: Array<{
    titulo: string;
    data: string;
    horario: string;
  }>;
};

// Tipo para as congregações
export type Congregacao = {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  pastor: string;
  cnpj?: string;
  capacidade?: number; // Mantido para compatibilidade com congregações filiais
  dataFundacao?: string;
  membros: number;
  isMatriz: boolean; // Indica se é a congregação matriz/sede
  status: 'ativa' | 'inativa';
};

// Tipo para os membros
export type Membro = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  dataNascimento?: Date;
  dataBatismo?: Date;
  congregacaoId: string; // ID da congregação a que pertence
  funcao?: string;
  status: 'ativo' | 'inativo' | 'visitante';
  avatar?: string;
};

// Cargos disponíveis no sistema
export type Cargo = 
  | 'administrador'    // Acesso total
  | 'pastor'           // Acesso total à sua congregação
  | 'secretario'       // Acesso à secretaria de sua congregação
  | 'tesoureiro'       // Acesso à tesouraria de sua congregação
  | 'lider_ministerio' // Acesso a funcionalidades específicas
  | 'usuario';         // Acesso básico

// Permissões disponíveis
export type Permissao =
  // Permissões de Membros
  | 'membros.visualizar'
  | 'membros.adicionar'
  | 'membros.editar'
  | 'membros.excluir'
  
  // Permissões de Finanças
  | 'financas.visualizar'
  | 'financas.adicionar'
  | 'financas.editar'
  | 'financas.excluir'
  
  // Permissões de Congregações
  | 'congregacoes.visualizar'
  | 'congregacoes.adicionar'
  | 'congregacoes.editar'
  | 'congregacoes.excluir'
  
  // Permissões de Relatórios
  | 'relatorios.visualizar'
  | 'relatorios.gerar'
  
  // Permissões de Configurações
  | 'configuracoes.visualizar'
  | 'configuracoes.editar'
  
  // Permissões de Usuários
  | 'usuarios.visualizar'
  | 'usuarios.adicionar'
  | 'usuarios.editar'
  | 'usuarios.excluir';

// Tipo para os usuários
export type Usuario = {
  id: string;
  nome: string;
  email: string;
  cargo: Cargo;
  congregacaoId: string; // ID da congregação a que pertence
  permissoes: Permissao[];
  telefone?: string;
  dataCadastro: Date;
  ultimoAcesso: Date;
  status: 'ativo' | 'inativo';
};

// Mapeamento de permissões por cargo
export const permissoesPorCargo: Record<Cargo, Permissao[]> = {
  administrador: [
    'membros.visualizar', 'membros.adicionar', 'membros.editar', 'membros.excluir',
    'financas.visualizar', 'financas.adicionar', 'financas.editar', 'financas.excluir',
    'congregacoes.visualizar', 'congregacoes.adicionar', 'congregacoes.editar', 'congregacoes.excluir',
    'relatorios.visualizar', 'relatorios.gerar',
    'configuracoes.visualizar', 'configuracoes.editar',
    'usuarios.visualizar', 'usuarios.adicionar', 'usuarios.editar', 'usuarios.excluir'
  ],
  
  pastor: [
    'membros.visualizar', 'membros.adicionar', 'membros.editar',
    'financas.visualizar',
    'congregacoes.visualizar',
    'relatorios.visualizar', 'relatorios.gerar',
    'configuracoes.visualizar'
  ],
  
  secretario: [
    'membros.visualizar', 'membros.adicionar', 'membros.editar',
    'relatorios.visualizar', 'relatorios.gerar'
  ],
  
  tesoureiro: [
    'financas.visualizar', 'financas.adicionar', 'financas.editar',
    'relatorios.visualizar', 'relatorios.gerar'
  ],
  
  lider_ministerio: [
    'membros.visualizar'
  ],
  
  usuario: [
    'membros.visualizar'
  ]
}; 