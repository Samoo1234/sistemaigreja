'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useIgrejaConfig } from '@/lib/contexts/igreja-config'
import Image from 'next/image'
import { Church, Upload } from 'lucide-react'
import EventosHorarios from './eventos-horarios'

// Função para validar CNPJ
function validarCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
  
  // Verifica se tem 14 dígitos
  if (cnpjLimpo.length !== 14) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false
  
  // Validação dos dígitos verificadores
  let soma = 0
  let peso = 2
  
  // Primeiro dígito verificador
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  
  let digito = 11 - (soma % 11)
  if (digito > 9) digito = 0
  
  if (parseInt(cnpjLimpo.charAt(12)) !== digito) return false
  
  // Segundo dígito verificador
  soma = 0
  peso = 2
  
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso
    peso = peso === 9 ? 2 : peso + 1
  }
  
  digito = 11 - (soma % 11)
  if (digito > 9) digito = 0
  
  return parseInt(cnpjLimpo.charAt(13)) === digito
}

// Função para formatar CNPJ
function formatarCNPJ(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
  return cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export default function ConfiguracoesPage() {
  const { config, salvarConfig, recarregarConfig } = useIgrejaConfig()
  const [darkMode, setDarkMode] = useState(false)
  const [notificacoes, setNotificacoes] = useState(true)
  const [idiomaApp, setIdiomaApp] = useState("pt-BR")
  
  // Estado local que será sincronizado com o contexto
  const [igrejaConfig, setIgrejaConfig] = useState({
    nome: config.nome || '',
    nomeAbreviado: config.nomeAbreviado || '',
    logo: config.logo || '',
    endereco: config.endereco || '',
    cidade: config.cidade || '',
    estado: config.estado || '',
    cep: config.cep || '',
    telefone: config.telefone || '',
    email: config.email || '',
    site: config.site || '',
    pastor: config.pastor || '',
    cnpj: config.cnpj || '',
    corPrimaria: config.corPrimaria || '#000000',
    corSecundaria: config.corSecundaria || '#000000'
  })
  
  const [logoPreview, setLogoPreview] = useState<string | null>(config.logo || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar estado local com o contexto quando config mudar
  useEffect(() => {
    setIgrejaConfig({
      nome: config.nome || '',
      nomeAbreviado: config.nomeAbreviado || '',
      logo: config.logo || '',
      endereco: config.endereco || '',
      cidade: config.cidade || '',
      estado: config.estado || '',
      cep: config.cep || '',
      telefone: config.telefone || '',
      email: config.email || '',
      site: config.site || '',
      pastor: config.pastor || '',
      cnpj: config.cnpj || '',
      corPrimaria: config.corPrimaria || '#000000',
      corSecundaria: config.corSecundaria || '#000000'
    })
    setLogoPreview(config.logo || null)
  }, [config])

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode)
    toast(!darkMode ? "Modo escuro ativado" : "Modo claro ativado", {
      description: "A preferência foi salva com sucesso."
    })
  }

  const handleToggleNotificacoes = () => {
    setNotificacoes(!notificacoes)
    toast(!notificacoes ? "Notificações ativadas" : "Notificações desativadas", {
      description: "A preferência foi salva com sucesso."
    })
  }

  const handleIdiomaChange = (value: string) => {
    setIdiomaApp(value)
    toast("Idioma alterado", {
      description: `O idioma da aplicação foi alterado para ${value}.`
    })
  }

  const handleIgrejaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setIgrejaConfig(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Verifica o tamanho do arquivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast("Arquivo muito grande", {
          description: "O tamanho máximo permitido é 2MB. Por favor, escolha uma imagem menor."
        })
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setLogoPreview(result)
        setIgrejaConfig(prev => ({
          ...prev,
          logo: result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const handleSalvar = async () => {
    try {
      // Verifica campos obrigatórios
      if (!igrejaConfig.nome || !igrejaConfig.nomeAbreviado) {
        toast("Erro de validação", {
          description: "Nome da igreja e nome abreviado são obrigatórios."
        });
        return;
      }
      
      // Adiciona estado de carregamento
      const btnSalvar = document.getElementById('btn-salvar-igreja');
      if (btnSalvar) {
        btnSalvar.textContent = 'Salvando...';
        btnSalvar.setAttribute('disabled', 'true');
      }
      
      console.log('Iniciando salvamento das configurações', igrejaConfig);
      
      // Salva diretamente no Firestore
      try {
        console.log('Salvando diretamente no Firestore...');
        
        // Importar funções do Firestore
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/config');
        
        // Salvar no Firestore
        const configRef = doc(db, 'configuracoes', 'igreja');
        await setDoc(configRef, igrejaConfig, { merge: true });
        
        console.log('Configurações salvas no Firestore');
        
        // INTEGRAÇÃO: Atualizar a sede nas congregações
        console.log('Atualizando sede nas congregações...');
        
        // Buscar a sede existente
        const { collection, query, where, getDocs, updateDoc } = await import('firebase/firestore');
        const congregacoesRef = collection(db, 'congregacoes');
        const sedeQuery = query(congregacoesRef, where('isMatriz', '==', true));
        const sedeSnapshot = await getDocs(sedeQuery);
        
        if (!sedeSnapshot.empty) {
          // Atualizar sede existente
          const sedeDoc = sedeSnapshot.docs[0];
          const dadosAtualizacao = {
            nome: igrejaConfig.nome || '',
            nomeAbreviado: igrejaConfig.nomeAbreviado || '',
            endereco: igrejaConfig.endereco || '',
            cidade: igrejaConfig.cidade || '',
            estado: igrejaConfig.estado || '',
            telefone: igrejaConfig.telefone || '',
            email: igrejaConfig.email || '',
            site: igrejaConfig.site || '',
            pastor: igrejaConfig.pastor || '',
            cnpj: igrejaConfig.cnpj || '',
            // Manter outros campos existentes
            membros: sedeDoc.data().membros || 0,
            capacidade: sedeDoc.data().capacidade || 0,
            status: sedeDoc.data().status || 'ativa',
            isMatriz: true,
            dataFundacao: sedeDoc.data().dataFundacao || new Date().toISOString().split('T')[0],
          };
          
          await updateDoc(sedeDoc.ref, dadosAtualizacao);
          console.log('Sede atualizada com sucesso');
        } else {
          // Criar nova sede se não existir
          const { addDoc } = await import('firebase/firestore');
          const novaSede = {
            nome: igrejaConfig.nome || '',
            nomeAbreviado: igrejaConfig.nomeAbreviado || '',
            endereco: igrejaConfig.endereco || '',
            cidade: igrejaConfig.cidade || '',
            estado: igrejaConfig.estado || '',
            telefone: igrejaConfig.telefone || '',
            email: igrejaConfig.email || '',
            site: igrejaConfig.site || '',
            pastor: igrejaConfig.pastor || '',
            cnpj: igrejaConfig.cnpj || '',
            membros: 0,
            capacidade: 0,
            status: 'ativa',
            isMatriz: true,
            dataFundacao: new Date().toISOString().split('T')[0],
          };
          
          await addDoc(congregacoesRef, novaSede);
          console.log('Nova sede criada com sucesso');
        }
        
        // Salva também no contexto local
        await salvarConfig(igrejaConfig);
        
        // Recarrega os dados do Firestore para garantir consistência
        setTimeout(async () => {
          await recarregarConfig();
        }, 500);
        
        toast("Configurações salvas", {
          description: "As configurações da igreja foram atualizadas com sucesso."
        });
      } catch (error) {
        console.error('Erro ao salvar no Firestore:', error);
        throw error; // Propaga o erro para ser tratado no catch externo
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      let mensagemErro = "Ocorreu um erro ao salvar as configurações.";
      
      if (error instanceof Error) {
        mensagemErro = `Erro: ${error.message}`;
      }
      
      toast("Erro ao salvar", {
        description: mensagemErro,
      });
    } finally {
      // Reativa o botão
      const btnSalvar = document.getElementById('btn-salvar-igreja');
      if (btnSalvar) {
        btnSalvar.textContent = 'Salvar Configurações';
        btnSalvar.removeAttribute('disabled');
      }
    }
  };

  const handleSincronizar = async () => {
    try {
      // Adiciona estado de carregamento
      const btnSincronizar = document.getElementById('btn-sincronizar');
      if (btnSincronizar) {
        btnSincronizar.textContent = 'Sincronizando...';
        btnSincronizar.setAttribute('disabled', 'true');
      }
      
      console.log('Iniciando sincronização dos dados da sede...');
      
      // Importar funções do Firestore
      const { collection, query, where, getDocs, doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      
      // Buscar a sede nas congregações
      const congregacoesRef = collection(db, 'congregacoes');
      const sedeQuery = query(congregacoesRef, where('isMatriz', '==', true));
      const sedeSnapshot = await getDocs(sedeQuery);
      
      if (sedeSnapshot.empty) {
        throw new Error('Nenhuma sede encontrada. Verifique se existe uma congregação marcada como sede.');
      }
      
      const sedeDoc = sedeSnapshot.docs[0];
      const sedeData = sedeDoc.data();
      
      console.log('Dados da sede encontrados:', Object.keys(sedeData));
      
      // Preparar dados para configurações (apenas campos que existem na sede)
      const configData = {
        nome: sedeData.nome || igrejaConfig.nome,
        nomeAbreviado: sedeData.nomeAbreviado || igrejaConfig.nomeAbreviado,
        logo: sedeData.logo || igrejaConfig.logo,
        endereco: sedeData.endereco || igrejaConfig.endereco,
        cidade: sedeData.cidade || igrejaConfig.cidade,
        estado: sedeData.estado || igrejaConfig.estado,
        cep: sedeData.cep || igrejaConfig.cep,
        telefone: sedeData.telefone || igrejaConfig.telefone,
        email: sedeData.email || igrejaConfig.email,
        site: sedeData.site || igrejaConfig.site,
        pastor: sedeData.pastor || igrejaConfig.pastor,
        cnpj: sedeData.cnpj || igrejaConfig.cnpj,
        // Manter cores atuais das configurações
        corPrimaria: igrejaConfig.corPrimaria,
        corSecundaria: igrejaConfig.corSecundaria
      };
      
      console.log('Salvando nas configurações...');
      
      // Salvar nas configurações
      const configRef = doc(db, 'configuracoes', 'igreja');
      await setDoc(configRef, configData, { merge: true });
      
      console.log('Configurações atualizadas com sucesso');
      
      // Atualiza o estado local com os dados sincronizados
      setIgrejaConfig(configData);
      
      // Recarrega os dados do Firestore
      setTimeout(async () => {
        await recarregarConfig();
      }, 500);
      
      toast("Dados sincronizados", {
        description: "Os dados da sede foram sincronizados com as configurações."
      });
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      let mensagemErro = "Ocorreu um erro ao sincronizar os dados.";
      
      if (error instanceof Error) {
        mensagemErro = `Erro: ${error.message}`;
      }
      
      toast("Erro ao sincronizar", {
        description: mensagemErro,
      });
    } finally {
      // Reativa o botão
      const btnSincronizar = document.getElementById('btn-sincronizar');
      if (btnSincronizar) {
        btnSincronizar.textContent = 'Sincronizar da Sede';
        btnSincronizar.removeAttribute('disabled');
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Personalize a aplicação de acordo com suas preferências</p>
      </div>

      <Tabs defaultValue="igreja">
        <TabsList className="mb-4">
          <TabsTrigger value="igreja">Igreja</TabsTrigger>
          <TabsTrigger value="eventos-horarios">Eventos e Horários</TabsTrigger>
          <TabsTrigger value="aparencia">Aparência</TabsTrigger>
          <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
          <TabsTrigger value="sobre">Sobre</TabsTrigger>
        </TabsList>

        <TabsContent value="igreja">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Igreja</CardTitle>
              <CardDescription>
                Configure as informações gerais da sua igreja. 
                <span className="block mt-1 text-sm text-blue-600 font-medium">
                  💡 Dica: Estas informações serão automaticamente sincronizadas com a sede nas congregações.
                </span>
                <span className="block mt-1 text-sm text-orange-600 font-medium">
                  ⚠️ Se você atualizou os dados pela página de Congregações, use o botão "Sincronizar da Sede" para trazer os dados atualizados.
                </span>
                <span className="block mt-1 text-sm text-green-600 font-medium">
                  ✅ Ao salvar, a sede será atualizada automaticamente (não criará duplicatas).
                </span>
                <span className="block mt-1 text-sm text-purple-600 font-medium">
                  🎨 Cores e configurações visuais são preservadas ao sincronizar.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80" onClick={handleClickUpload}>
                    {logoPreview ? (
                      <Image 
                        src={logoPreview} 
                        alt="Logo da igreja"
                        width={96}
                        height={96}
                        className="object-cover"
                      />
                    ) : (
                      <Church className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <button 
                    onClick={handleClickUpload}
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1 cursor-pointer shadow-md hover:bg-primary/90"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleLogoChange}
                  />
                </div>
                <p className="text-sm text-muted-foreground">Clique para adicionar um logotipo</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo da Igreja</Label>
                  <Input 
                    id="nome" 
                    name="nome" 
                    value={igrejaConfig.nome} 
                    onChange={handleIgrejaChange} 
                    placeholder="Nome completo da igreja" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nomeAbreviado">Nome Abreviado</Label>
                  <Input 
                    id="nomeAbreviado" 
                    name="nomeAbreviado" 
                    value={igrejaConfig.nomeAbreviado} 
                    onChange={handleIgrejaChange} 
                    placeholder="Nome para exibição no sistema" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pastor">Pastor Principal</Label>
                  <Input 
                    id="pastor" 
                    name="pastor" 
                    value={igrejaConfig.pastor} 
                    onChange={handleIgrejaChange} 
                    placeholder="Nome do pastor principal" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ da Igreja</Label>
                  <Input 
                    id="cnpj" 
                    name="cnpj" 
                    value={igrejaConfig.cnpj} 
                    onChange={handleIgrejaChange}
                    placeholder="00.000.000/0000-00" 
                    maxLength={18}
                  />
                  {igrejaConfig.cnpj && igrejaConfig.cnpj.replace(/[^\d]/g, '').length === 14 && (
                    <div className={`text-xs ${validarCNPJ(igrejaConfig.cnpj) ? 'text-green-600' : 'text-red-600'}`}>
                      {validarCNPJ(igrejaConfig.cnpj) ? '✓ CNPJ válido' : '✗ CNPJ inválido'}
                    </div>
                  )}
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input 
                  id="endereco" 
                  name="endereco" 
                  value={igrejaConfig.endereco} 
                  onChange={handleIgrejaChange} 
                  placeholder="Endereço completo" 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input 
                    id="cidade" 
                    name="cidade" 
                    value={igrejaConfig.cidade} 
                    onChange={handleIgrejaChange} 
                    placeholder="Cidade" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input 
                    id="estado" 
                    name="estado" 
                    value={igrejaConfig.estado} 
                    onChange={handleIgrejaChange} 
                    placeholder="UF" 
                    maxLength={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input 
                    id="cep" 
                    name="cep" 
                    value={igrejaConfig.cep} 
                    onChange={handleIgrejaChange} 
                    placeholder="00000-000" 
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input 
                    id="telefone" 
                    name="telefone" 
                    value={igrejaConfig.telefone} 
                    onChange={handleIgrejaChange} 
                    placeholder="(00) 0000-0000" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    value={igrejaConfig.email} 
                    onChange={handleIgrejaChange} 
                    placeholder="contato@example.com" 
                    type="email"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Input 
                  id="site" 
                  name="site" 
                  value={igrejaConfig.site || ''} 
                  onChange={handleIgrejaChange} 
                  placeholder="www.example.com" 
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="corPrimaria">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="corPrimaria" 
                      name="corPrimaria" 
                      value={igrejaConfig.corPrimaria} 
                      onChange={handleIgrejaChange} 
                      placeholder="#000000" 
                    />
                    <div className="w-10 h-10 rounded border" style={{ backgroundColor: igrejaConfig.corPrimaria }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="corSecundaria">Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="corSecundaria" 
                      name="corSecundaria" 
                      value={igrejaConfig.corSecundaria} 
                      onChange={handleIgrejaChange} 
                      placeholder="#000000" 
                    />
                    <div className="w-10 h-10 rounded border" style={{ backgroundColor: igrejaConfig.corSecundaria }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button id="btn-salvar-igreja" onClick={handleSalvar}>Salvar Configurações</Button>
              <Button id="btn-sincronizar" variant="outline" onClick={handleSincronizar}>
                Sincronizar da Sede
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="eventos-horarios">
          <EventosHorarios />
        </TabsContent>

        <TabsContent value="aparencia">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Configure como o sistema deve ser exibido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Modo Escuro</Label>
                  <p className="text-sm text-muted-foreground">Ative o modo escuro para reduzir o cansaço visual</p>
                </div>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleToggleDarkMode} />
              </div>
              
              <Separator />
              
              <div>
                <Label htmlFor="idioma">Idioma da Aplicação</Label>
                <Select value={idiomaApp} onValueChange={handleIdiomaChange}>
                  <SelectTrigger id="idioma" className="mt-2">
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (United States)</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Gerencie como você recebe notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificacoes">Ativar Notificações</Label>
                  <p className="text-sm text-muted-foreground">Receba notificações sobre atividades importantes</p>
                </div>
                <Switch id="notificacoes" checked={notificacoes} onCheckedChange={handleToggleNotificacoes} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conta">
          <Card>
            <CardHeader>
              <CardTitle>Conta de Usuário</CardTitle>
              <CardDescription>Gerencie suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>As configurações de conta estão disponíveis em breve.</p>
                <Button variant="outline">Alterar Senha</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sobre">
          <Card>
            <CardHeader>
              <CardTitle>Sobre o Sistema</CardTitle>
              <CardDescription>Informações sobre o sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Nome:</strong> Sistema de Gestão da Igreja</p>
                <p><strong>Versão:</strong> 1.0.0</p>
                <p><strong>Desenvolvido por:</strong> Equipe de Desenvolvimento</p>
                <p><strong>Contato:</strong> suporte@example.com</p>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">© 2023 Todos os direitos reservados</p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 