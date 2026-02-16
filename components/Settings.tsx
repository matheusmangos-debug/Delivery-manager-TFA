
import React, { useState } from 'react';
import { ReturnReason, CustomerReputation, Branch, Driver, Vehicle, ClientMapping } from '../types';

interface SettingsProps {
  reasons: ReturnReason[]; onAddReason: (r: ReturnReason) => void; onRemoveReason: (id: string) => void;
  customerDatabase: CustomerReputation[]; onAddCritical: (c: CustomerReputation) => void; onRemoveCritical: (id: string) => void;
  branches: Branch[]; onAddBranch: (b: Branch) => void; onRemoveBranch: (id: string) => void;
  drivers: Driver[]; onAddDriver: (d: Driver) => void; onRemoveDriver: (id: string) => void;
  vehicles: Vehicle[]; onAddVehicle: (v: Vehicle) => void; onRemoveVehicle: (id: string) => void;
  clientMappings: ClientMapping[]; onAddMapping: (m: ClientMapping) => void; onBulkAddMappings: (ms: ClientMapping[]) => void; onRemoveMapping: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  reasons, onAddReason, onRemoveReason,
  customerDatabase, onAddCritical, onRemoveCritical,
  branches, onAddBranch, onRemoveBranch,
  drivers, onAddDriver, onRemoveDriver,
  vehicles, onAddVehicle, onRemoveVehicle,
  clientMappings, onAddMapping, onBulkAddMappings, onRemoveMapping
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reasons' | 'critical-base' | 'branches' | 'vehicles' | 'drivers' | 'mappings' | 'database'>('reasons');
  const [mappingMode, setMappingMode] = useState<'individual' | 'bulk'>('individual');
  const [temp, setTemp] = useState<any>({});

  const SQL_SCHEMA = `
-- COLE ESTE SQL NO 'SQL EDITOR' DO SEU SUPABASE PARA CRIAR AS TABELAS CORRETAMENTE

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

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  email text UNIQUE,
  password text,
  role text,
  avatar text
);

CREATE TABLE IF NOT EXISTS branches (
  id text PRIMARY KEY,
  name text,
  location text
);

CREATE TABLE IF NOT EXISTS drivers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text,
  "branchId" text,
  status text,
  "manualStatus" text
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
  `;

  const tabs = [
    { id: 'reasons', label: 'Motivos', icon: 'fa-clipboard-list' },
    { id: 'critical-base', label: 'Base Crítica', icon: 'fa-user-shield' },
    { id: 'mappings', label: 'Vendedores', icon: 'fa-address-book' },
    { id: 'branches', label: 'Filiais', icon: 'fa-building' },
    { id: 'vehicles', label: 'Frota', icon: 'fa-truck-front' },
    { id: 'drivers', label: 'Equipe', icon: 'fa-users' },
    { id: 'database', label: 'Banco de Dados', icon: 'fa-database' },
  ];

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
          <div className="space-y-6 max-w-4xl">
            <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-[2rem] flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center text-xl shrink-0">
                <i className="fas fa-triangle-exclamation"></i>
              </div>
              <div>
                <h3 className="font-black text-amber-800 uppercase text-sm mb-1">Evite o Erro 400 (Bad Request)</h3>
                <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Certifique-se que seu banco Supabase possui as tabelas abaixo. Se notar erros ao salvar, execute este script no SQL Editor.
                </p>
              </div>
            </div>
            <div className="relative">
              <pre className="bg-slate-900 text-emerald-400 p-6 rounded-3xl text-[10px] font-mono overflow-x-auto h-[350px] border-4 border-slate-800">
                {SQL_SCHEMA}
              </pre>
              <button 
                onClick={() => { navigator.clipboard.writeText(SQL_SCHEMA); alert("SQL Copiado!"); }}
                className="absolute top-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase backdrop-blur-md border border-white/20"
              >
                Copiar SQL
              </button>
            </div>
          </div>
        )}

        {/* CADASTRO DE MOTIVOS */}
        {activeSubTab === 'reasons' && (
          <div className="space-y-8 max-w-4xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Novo Motivo Operacional</h3>
              <div className="flex gap-4">
                <input placeholder="Ex: Cliente ausente" value={temp.reasonLabel || ''} onChange={e => setTemp({...temp, reasonLabel: e.target.value})} className="flex-1 p-4 rounded-2xl border font-bold text-sm bg-white" />
                <button onClick={() => { onAddReason({id: `REAS-${Date.now()}`, label: temp.reasonLabel, color: '#4f46e5', isActive: true}); setTemp({}); }} disabled={!temp.reasonLabel} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Adicionar</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {reasons.map(r => (
                <div key={r.id} className="p-5 border rounded-3xl flex items-center justify-between bg-white hover:border-indigo-200">
                  <span className="font-black uppercase text-xs text-slate-700 tracking-tight">{r.label}</span>
                  <button onClick={() => onRemoveReason(r.id)} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CADASTRO DE FILIAIS */}
        {activeSubTab === 'branches' && (
          <div className="space-y-8 max-w-4xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1"><input placeholder="ID (ex: sp-01)" value={temp.bid || ''} onChange={e => setTemp({...temp, bid: e.target.value})} className="w-full p-4 rounded-2xl border font-bold text-sm bg-white" /></div>
                <div className="col-span-1"><input placeholder="Nome da Unidade" value={temp.bname || ''} onChange={e => setTemp({...temp, bname: e.target.value})} className="w-full p-4 rounded-2xl border font-bold text-sm bg-white" /></div>
                <div className="col-span-2"><input placeholder="Localização / Endereço" value={temp.bloc || ''} onChange={e => setTemp({...temp, bloc: e.target.value})} className="w-full p-4 rounded-2xl border font-bold text-sm bg-white" /></div>
                <button onClick={() => { onAddBranch({id: temp.bid, name: temp.bname, location: temp.bloc}); setTemp({}); }} className="col-span-2 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Cadastrar Filial</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {branches.map(b => (
                <div key={b.id} className="p-5 border rounded-3xl flex items-center justify-between bg-white">
                  <div>
                    <p className="font-black uppercase text-xs text-indigo-600">{b.id}</p>
                    <p className="font-bold text-sm text-slate-800">{b.name}</p>
                  </div>
                  <button onClick={() => onRemoveBranch(b.id)} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CADASTRO DE FROTA (VEÍCULOS) */}
        {activeSubTab === 'vehicles' && (
          <div className="space-y-8 max-w-4xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="grid grid-cols-3 gap-4">
                <input placeholder="Placa" value={temp.vplate || ''} onChange={e => setTemp({...temp, vplate: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white uppercase" />
                <input placeholder="Modelo" value={temp.vmodel || ''} onChange={e => setTemp({...temp, vmodel: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white" />
                <select value={temp.vbranch || ''} onChange={e => setTemp({...temp, vbranch: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white">
                  <option value="">Filial...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button onClick={() => { onAddVehicle({id: `VEC-${Date.now()}`, plate: temp.vplate, model: temp.vmodel, capacity: 'N/I', branchId: temp.vbranch}); setTemp({}); }} className="col-span-3 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Cadastrar Veículo</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {vehicles.map(v => (
                <div key={v.id} className="p-5 border rounded-3xl flex items-center justify-between bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs uppercase">{v.plate.slice(-2)}</div>
                    <div>
                      <p className="font-black uppercase text-xs text-slate-800">{v.plate}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{v.model}</p>
                    </div>
                  </div>
                  <button onClick={() => onRemoveVehicle(v.id)} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CADASTRO DE EQUIPE (MOTORISTAS) */}
        {activeSubTab === 'drivers' && (
          <div className="space-y-8 max-w-4xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nome Completo" value={temp.dname || ''} onChange={e => setTemp({...temp, dname: e.target.value})} className="col-span-2 p-4 rounded-2xl border font-bold text-sm bg-white uppercase" />
                <select value={temp.dbranch || ''} onChange={e => setTemp({...temp, dbranch: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white">
                  <option value="">Filial...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input placeholder="Tipo CNH (ex: D)" value={temp.dcnh || ''} onChange={e => setTemp({...temp, dcnh: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white uppercase" />
                <button onClick={() => { onAddDriver({id: `DRV-${Date.now()}`, name: temp.dname, branchId: temp.dbranch, licenseType: temp.dcnh || 'D', status: 'Ativo'}); setTemp({}); }} className="col-span-2 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Adicionar Motorista</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {drivers.map(d => (
                <div key={d.id} className="p-5 border rounded-3xl flex items-center justify-between bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-black text-xs uppercase">{d.name.charAt(0)}</div>
                    <div>
                      <p className="font-black uppercase text-xs text-slate-800">{d.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">CNH {d.licenseType} • {branches.find(b => b.id === d.branchId)?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => onRemoveDriver(d.id)} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CADASTRO DE CLIENTES CRÍTICOS */}
        {activeSubTab === 'critical-base' && (
          <div className="space-y-8 max-w-5xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <div className="grid grid-cols-4 gap-4">
                <input placeholder="Matrícula" value={temp.ccid || ''} onChange={e => setTemp({...temp, ccid: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white uppercase" />
                <select value={temp.cstatus || ''} onChange={e => setTemp({...temp, cstatus: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white">
                  <option value="Retorno">Retorno</option>
                  <option value="Pendência">Pendência</option>
                  <option value="Reclamação">Reclamação</option>
                </select>
                <select value={temp.crisk || 'low'} onChange={e => setTemp({...temp, crisk: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white">
                  <option value="low">Risco Baixo</option>
                  <option value="medium">Risco Médio</option>
                  <option value="high">Risco Alto</option>
                </select>
                <button onClick={() => { onAddCritical({customerId: temp.ccid, returnCount: 0, complaintCount: 0, notes: temp.cnotes, status: temp.cstatus as any, riskLevel: temp.crisk as any, resolutionStatus: 'Pendente', registrationDate: new Date().toLocaleDateString('pt-BR')}); setTemp({}); }} className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Cadastrar</button>
                <textarea placeholder="Notas e Histórico do Cliente..." value={temp.cnotes || ''} onChange={e => setTemp({...temp, cnotes: e.target.value})} className="col-span-4 h-24 p-4 rounded-2xl border font-bold text-sm bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {customerDatabase.map(c => (
                <div key={c.customerId} className={`p-5 border rounded-3xl flex items-center justify-between bg-white ${c.riskLevel === 'high' ? 'border-l-4 border-rose-500' : ''}`}>
                  <div>
                    <p className="font-black uppercase text-xs text-indigo-600">{c.customerId}</p>
                    <p className="font-bold text-sm text-slate-800">{c.status}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{c.notes?.slice(0, 50)}...</p>
                  </div>
                  <button onClick={() => onRemoveCritical(c.customerId)} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CADASTRO DE VENDEDORES (MAPPINGS) */}
        {activeSubTab === 'mappings' && (
          <div className="space-y-8 max-w-5xl">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setMappingMode('individual')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mappingMode === 'individual' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Inserir Manual</button>
              <button onClick={() => setMappingMode('bulk')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mappingMode === 'bulk' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Inserir Massa (Planilha)</button>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
              {mappingMode === 'individual' ? (
                <div className="grid grid-cols-3 gap-6 items-end">
                  <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Matrícula Cliente</label><input value={temp.cid || ''} onChange={e => setTemp({...temp, cid: e.target.value})} className="w-full p-4 rounded-2xl border font-bold uppercase text-sm bg-white" placeholder="MAT-100" /></div>
                  <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Cód. Vendedor</label><input value={temp.scode || ''} onChange={e => setTemp({...temp, scode: e.target.value})} className="w-full p-4 rounded-2xl border font-bold text-sm bg-white uppercase" /></div>
                  <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">WhatsApp Vendedor</label><input value={temp.sphone || ''} onChange={e => setTemp({...temp, sphone: e.target.value})} className="w-full p-4 rounded-2xl border font-bold text-sm bg-white" placeholder="5511..." /></div>
                  <div className="col-span-3"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Nome do Vendedor</label><input value={temp.sname || ''} onChange={e => setTemp({...temp, sname: e.target.value})} className="w-full p-4 rounded-2xl border font-bold uppercase text-sm bg-white" /></div>
                  <button onClick={() => { onAddMapping({customerId: temp.cid, sellerCode: temp.scode, sellerName: temp.sname, sellerPhone: temp.sphone, customerName: 'N/I'}); setTemp({}); }} className="col-span-3 h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Vincular Vendedor</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea value={temp.bulkText || ''} onChange={e => setTemp({...temp, bulkText: e.target.value})} className="w-full h-48 p-4 rounded-2xl border font-mono text-xs bg-white resize-none" placeholder="MAT-101 ; João Silva ; VD-01 ; Pedro Rocha ; 5511999999999" />
                  <button onClick={()=>{
                    if(!temp.bulkText) return;
                    const lines = temp.bulkText.split('\n').filter((l:string)=>l.trim());
                    const mappings = lines.map((l:string)=>{
                      const p = l.split(';').map(v=>v.trim());
                      return { customerId: p[0], sellerCode: p[2] || 'VD-00', sellerName: p[3] || 'Vendedor', sellerPhone: p[4] || '', customerName: p[1] || 'Cliente' };
                    });
                    onBulkAddMappings(mappings);
                    setTemp({});
                  }} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Processar Massa</button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {clientMappings.map(m => (
                <div key={m.customerId} className="p-6 border rounded-3xl flex justify-between items-center bg-white shadow-sm">
                  <div>
                    <p className="font-black text-indigo-600 text-[10px] uppercase">CLIENTE: {m.customerId}</p>
                    <p className="font-bold text-slate-800 uppercase text-xs mt-1">{m.sellerName}</p>
                  </div>
                  <button onClick={() => onRemoveMapping(m.customerId)} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
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
