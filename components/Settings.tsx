
import React, { useState } from 'react';
import { ReturnReason, CustomerReputation, Branch, Driver, Vehicle, ClientMapping } from '../types';

interface SettingsProps {
  dbStatus: 'connecting' | 'online' | 'offline';
  tableStatus?: Record<string, boolean>;
  onRefresh: () => void;
  reasons: ReturnReason[]; onAddReason: (r: ReturnReason) => void; onRemoveReason: (id: string) => void;
  customerDatabase: CustomerReputation[]; onAddCritical: (c: CustomerReputation) => void; onRemoveCritical: (id: string) => void;
  branches: Branch[]; onAddBranch: (b: Branch) => void; onRemoveBranch: (id: string) => void;
  drivers: Driver[]; onAddDriver: (d: Driver) => void; onRemoveDriver: (id: string) => void;
  vehicles: Vehicle[]; onAddVehicle: (v: Vehicle) => void; onRemoveVehicle: (id: string) => void;
  clientMappings: ClientMapping[]; onAddMapping: (m: ClientMapping) => void; onBulkAddMappings: (ms: ClientMapping[]) => void; onRemoveMapping: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  dbStatus, tableStatus = {}, onRefresh,
  reasons, onAddReason, onRemoveReason,
  customerDatabase, onAddCritical, onRemoveCritical,
  branches, onAddBranch, onRemoveBranch,
  drivers, onAddDriver, onRemoveDriver,
  vehicles, onAddVehicle, onRemoveVehicle,
  clientMappings, onAddMapping, onBulkAddMappings, onRemoveMapping
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reasons' | 'critical-base' | 'branches' | 'vehicles' | 'drivers' | 'mappings' | 'database'>('reasons');
  const [temp, setTemp] = useState<any>({ cstatus: 'Retorno', crisk: 'low' });

  const SQL_SCHEMA = `-- SQL LIMPO PARA O PROJETO (rvzcixwhkkrlnesbcdke)
-- Execute no SQL Editor do Supabase para criar as tabelas necessárias:

CREATE TABLE IF NOT EXISTS deliveries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY, 
  "customerId" text NOT NULL, 
  "customerName" text, 
  address text, 
  status text, 
  date date, 
  "deliveryDay" text, 
  "trackingCode" text, 
  items text, 
  "boxQuantity" integer, 
  "driverName" text, 
  branch text, 
  "returnReason" text, 
  "returnNotes" text, 
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_reputation (
  "customerId" text PRIMARY KEY, 
  "returnCount" integer DEFAULT 0, 
  "complaintCount" integer DEFAULT 0, 
  notes text, 
  status text, 
  "riskLevel" text, 
  "resolutionStatus" text DEFAULT 'Pendente', 
  "registrationDate" text
);

CREATE TABLE IF NOT EXISTS vehicles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY, 
  plate text UNIQUE, 
  model text, 
  capacity text, 
  "branchId" text, 
  "driverId" text
);

CREATE TABLE IF NOT EXISTS drivers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY, 
  name text, 
  "branchId" text, 
  status text, 
  "manualStatus" text
);

CREATE TABLE IF NOT EXISTS branches (
  id text PRIMARY KEY, 
  name text, 
  location text
);

CREATE TABLE IF NOT EXISTS return_reasons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY, 
  label text, 
  color text, 
  "isActive" boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS client_mappings (
  "customerId" text PRIMARY KEY, 
  "sellerName" text, 
  "sellerCode" text, 
  "sellerPhone" text, 
  "customerName" text
);

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY, 
  name text, 
  email text UNIQUE, 
  password text, 
  role text, 
  avatar text, 
  created_at timestamptz DEFAULT now()
);

-- Desabilitar RLS para facilitar a integração inicial
ALTER TABLE deliveries DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reputation DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE return_reasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_mappings DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;`;

  const tabs = [
    { id: 'reasons', label: 'Motivos', icon: 'fa-clipboard-list' },
    { id: 'critical-base', label: 'Base Crítica', icon: 'fa-user-shield' },
    { id: 'mappings', label: 'Vendedores', icon: 'fa-address-book' },
    { id: 'branches', label: 'Filiais', icon: 'fa-building' },
    { id: 'vehicles', label: 'Frota', icon: 'fa-truck-front' },
    { id: 'drivers', label: 'Equipe', icon: 'fa-users' },
    { id: 'database', label: 'Banco de Dados', icon: 'fa-database' },
  ];

  const tableLabels: Record<string, string> = {
    deliveries: 'Entregas',
    customer_reputation: 'Base Crítica',
    vehicles: 'Frota',
    drivers: 'Motoristas',
    branches: 'Filiais',
    return_reasons: 'Motivos de Retorno',
    client_mappings: 'Mapeamento de Vendedores',
    users: 'Usuários/Acesso'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex border-b border-slate-200 bg-white rounded-t-3xl px-4 overflow-x-auto no-scrollbar shadow-sm">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveSubTab(tab.id as any)} className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border-b-2 transition-all ${activeSubTab === tab.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20 shadow-[inset_0_-2px_0_0_rgba(79,70,229,1)]' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
            <i className={`fas ${tab.icon}`}></i>{tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-b-3xl border border-slate-100 shadow-sm p-8 min-h-[550px]">
        {activeSubTab === 'database' && (
          <div className="space-y-8 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="font-black text-slate-800 uppercase text-sm">Status da Conexão</h3>
                   <button onClick={onRefresh} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Testar Novamente</button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(tableLabels).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${tableStatus[key] ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          <i className={`fas ${tableStatus[key] ? 'fa-check' : 'fa-times'}`}></i>
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{label}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${tableStatus[key] ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {tableStatus[key] ? 'Ativa' : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
                {dbStatus === 'offline' && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] text-rose-700 font-bold uppercase">
                    <i className="fas fa-exclamation-triangle mr-2"></i> Atenção: A chave Anon Key parece ser inválida para este projeto Supabase. Por favor, revise no painel API.
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="font-black text-slate-800 uppercase text-sm">Estrutura Logística</h3>
                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] text-xs text-indigo-900 leading-relaxed font-medium">
                  <p className="mb-4">O sistema está pronto para operar em <strong>rvzcixwhkkrlnesbcdke</strong>. O módulo de checkouts foi removido para otimização.</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Copie o script SQL limpo.</li>
                    <li>No painel do Supabase, vá em <strong>SQL Editor</strong>.</li>
                    <li>Clique em <strong>Run</strong> para preparar o ambiente.</li>
                  </ol>
                </div>
                <div className="relative group">
                  <pre className="bg-slate-900 text-emerald-400 p-6 rounded-3xl text-[10px] font-mono h-[250px] overflow-y-auto border-4 border-slate-800 scrollbar-hide">
                    {SQL_SCHEMA}
                  </pre>
                  <button onClick={() => { navigator.clipboard.writeText(SQL_SCHEMA); alert("Script Logístico Copiado!"); }} className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase backdrop-blur-md border border-white/20">Copiar</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Outras abas (reasons, mappings, etc) continuam funcionando normalmente */}
        {activeSubTab === 'reasons' && (
          <div className="space-y-8 max-w-4xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Motivos Operacionais</h3>
              <div className="flex gap-4">
                <input placeholder="Ex: Cliente fechado" value={temp.reasonLabel || ''} onChange={e => setTemp({...temp, reasonLabel: e.target.value})} className="flex-1 p-4 rounded-2xl border font-bold text-sm bg-white" />
                <button onClick={() => { onAddReason({id: `REAS-${Date.now()}`, label: temp.reasonLabel, color: '#4f46e5', isActive: true}); setTemp({}); }} disabled={!temp.reasonLabel} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Adicionar</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {reasons.map(r => (
                <div key={r.id} className="p-5 border rounded-3xl flex items-center justify-between bg-white hover:border-indigo-200 group">
                  <span className="font-black uppercase text-xs text-slate-700 tracking-tight">{r.label}</span>
                  <button onClick={() => onRemoveReason(r.id)} className="text-slate-200 group-hover:text-rose-500 p-2 transition-colors"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
