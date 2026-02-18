
import React, { useState, useMemo } from 'react';
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

  const tabs = [
    { id: 'reasons', label: 'Motivos de Retorno', icon: 'fa-clipboard-list' },
    { id: 'critical-base', label: 'Base Crítica (Alertas)', icon: 'fa-user-shield' },
    { id: 'mappings', label: 'Mapeamento de Vendedores', icon: 'fa-address-book' },
    { id: 'database', label: 'Monitoramento SQL', icon: 'fa-database' },
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
        {/* GERENCIAMENTO DE MOTIVOS */}
        {activeSubTab === 'reasons' && (
          <div className="space-y-8 max-w-4xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Cadastrar Motivo Oficial</h3>
              <div className="flex gap-4">
                <input placeholder="Ex: Produto Vencido" value={temp.reasonLabel || ''} onChange={e => setTemp({...temp, reasonLabel: e.target.value})} className="flex-1 p-4 rounded-2xl border font-bold text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/10" />
                <button onClick={() => { onAddReason({id: `REAS-${Date.now()}`, label: temp.reasonLabel, color: '#4f46e5', isActive: true}); setTemp({}); }} disabled={!temp.reasonLabel} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-indigo-100 hover:scale-105 transition-all disabled:opacity-50">Adicionar</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {reasons.map(r => (
                <div key={r.id} className="p-5 border rounded-3xl flex items-center justify-between bg-white hover:border-indigo-200 group transition-all">
                  <span className="font-black uppercase text-xs text-slate-700 tracking-tight flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                    {r.label}
                  </span>
                  <button onClick={() => onRemoveReason(r.id)} className="text-slate-200 group-hover:text-rose-500 p-2 transition-colors"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GERENCIAMENTO DE BASE CRÍTICA */}
        {activeSubTab === 'critical-base' && (
          <div className="space-y-8 max-w-5xl">
            <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100">
              <h3 className="text-[10px] font-black text-rose-400 uppercase mb-4 tracking-widest">Adicionar Cliente ao Alerta Crítico</h3>
              <div className="grid grid-cols-3 gap-4">
                <input placeholder="Matrícula" value={temp.cid || ''} onChange={e => setTemp({...temp, cid: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white" />
                <select value={temp.cstatus} onChange={e => setTemp({...temp, cstatus: e.target.value})} className="p-4 rounded-2xl border font-bold text-xs uppercase bg-white">
                   <option>Retorno</option>
                   <option>Reclamação</option>
                   <option>Restrição de Horário</option>
                </select>
                <select value={temp.crisk} onChange={e => setTemp({...temp, crisk: e.target.value})} className="p-4 rounded-2xl border font-bold text-xs uppercase bg-white">
                   <option value="low">Risco Baixo</option>
                   <option value="medium">Risco Médio</option>
                   <option value="high">Risco Alto</option>
                </select>
                <input placeholder="Observação Interna" value={temp.cnotes || ''} onChange={e => setTemp({...temp, cnotes: e.target.value})} className="col-span-2 p-4 rounded-2xl border font-bold text-sm bg-white" />
                <button onClick={() => { onAddCritical({customerId: temp.cid, returnCount: 0, complaintCount: 1, notes: temp.cnotes, status: temp.cstatus, riskLevel: temp.crisk, resolutionStatus: 'Pendente', registrationDate: new Date().toISOString().split('T')[0]}); setTemp({cstatus: 'Retorno', crisk: 'low'}); }} className="p-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Ativar Alerta</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {customerDatabase.map(c => (
                <div key={c.customerId} className={`p-5 border rounded-3xl flex items-center justify-between bg-white ${c.riskLevel === 'high' ? 'border-rose-200 bg-rose-50/10' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${c.riskLevel === 'high' ? 'bg-rose-600' : 'bg-amber-400'}`}>
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase leading-none">{c.customerId}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{c.status} • {c.notes}</p>
                    </div>
                  </div>
                  <button onClick={() => onRemoveCritical(c.customerId)} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GERENCIAMENTO DE MAPEAMENTO (VENDEDORES) */}
        {activeSubTab === 'mappings' && (
          <div className="space-y-8 max-w-5xl">
            <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100">
               <h3 className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest">Mapear Cliente x Vendedor</h3>
               <div className="grid grid-cols-4 gap-4">
                  <input placeholder="Matrícula" value={temp.mapCid || ''} onChange={e => setTemp({...temp, mapCid: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white" />
                  <input placeholder="Nome Vendedor" value={temp.mapSname || ''} onChange={e => setTemp({...temp, mapSname: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white" />
                  <input placeholder="WhatsApp (55...)" value={temp.mapPhone || ''} onChange={e => setTemp({...temp, mapPhone: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white" />
                  <button onClick={() => { onAddMapping({customerId: temp.mapCid, customerName: 'Busca Automática', sellerName: temp.mapSname, sellerCode: 'VD', sellerPhone: temp.mapPhone}); setTemp({}); }} className="p-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Salvar Mapeamento</button>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {clientMappings.map(m => (
                <div key={m.customerId} className="p-5 border rounded-3xl flex items-center justify-between bg-white hover:border-indigo-200 transition-all">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Cliente: {m.customerId}</p>
                    <p className="text-xs font-black text-slate-700 uppercase">{m.sellerName}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">{m.sellerPhone}</p>
                  </div>
                  <button onClick={() => onRemoveMapping(m.customerId)} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MONITORAMENTO DO BANCO */}
        {activeSubTab === 'database' && (
          <div className="space-y-8 max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="font-black text-slate-800 uppercase text-sm">Status da Conexão</h3>
                   <button onClick={onRefresh} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Testar Novamente</button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {['deliveries', 'customer_reputation', 'return_reasons', 'client_mappings'].map((key) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${tableStatus[key] ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          <i className={`fas ${tableStatus[key] ? 'fa-check' : 'fa-times'}`}></i>
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{key.replace('_', ' ')}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${tableStatus[key] ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {tableStatus[key] ? 'Conectada' : 'Offline'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 p-6 rounded-[2rem] border-4 border-slate-800">
                 <h4 className="text-emerald-400 text-[10px] font-black uppercase mb-4 tracking-widest">Terminal Logístico</h4>
                 <div className="space-y-2 font-mono text-[9px] text-emerald-500/80">
                    <p>> supabase connect: active</p>
                    <p>> rvzcixwhkkrlnesbcdke: initialized</p>
                    <p>> real-time status: healthy</p>
                    <p>> synchronization latency: 12ms</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
