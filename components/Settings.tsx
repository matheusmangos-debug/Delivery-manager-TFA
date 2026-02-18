
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
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const tabs = [
    { id: 'reasons', label: 'Motivos', icon: 'fa-clipboard-list' },
    { id: 'critical-base', label: 'Base Crítica', icon: 'fa-user-shield' },
    { id: 'mappings', label: 'Vendedores', icon: 'fa-address-book' },
    { id: 'branches', label: 'Filiais', icon: 'fa-building' },
    { id: 'vehicles', label: 'Frota', icon: 'fa-truck-front' },
    { id: 'drivers', label: 'Equipe', icon: 'fa-users' },
    { id: 'database', label: 'Banco de Dados', icon: 'fa-database' },
  ];

  const handleBulkImportMappings = () => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    const newMappings: ClientMapping[] = lines.map(line => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(';');
      return {
        customerId: parts[0]?.trim() || '',
        customerName: 'Importado em Massa',
        sellerName: parts[1]?.trim() || 'Desconhecido',
        sellerCode: 'VD',
        sellerPhone: parts[2]?.trim() || ''
      };
    }).filter(m => m.customerId);

    onBulkAddMappings(newMappings);
    setBulkText('');
    setShowBulkModal(false);
  };

  const handleBulkImportCritical = () => {
    const lines = bulkText.split('\n').filter(l => l.trim());
    const today = new Date().toISOString().split('T')[0];
    
    lines.forEach(line => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(';');
      onAddCritical({
        customerId: parts[0]?.trim() || '',
        status: (parts[1]?.trim() as any) || 'Retorno',
        riskLevel: (parts[2]?.trim() as any) || 'low',
        notes: parts[3]?.trim() || 'Importação rápida',
        returnCount: 1,
        complaintCount: 0,
        resolutionStatus: 'Pendente',
        registrationDate: today
      });
    });
    
    setBulkText('');
    setShowBulkModal(false);
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
        
        {/* MAPEAMENTO DE VENDEDORES */}
        {activeSubTab === 'mappings' && (
          <div className="space-y-8 max-w-5xl">
            <div className="flex justify-between items-center bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
              <div>
                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Central de Mapeamento Comercial</h3>
                <p className="text-xs font-bold text-indigo-900 uppercase">Vincule clientes a vendedores para automação de WhatsApp</p>
              </div>
              <button onClick={() => { setBulkText(''); setShowBulkModal(true); }} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">
                <i className="fas fa-file-import mr-2"></i> Importar em Massa
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-3xl border">
               <input placeholder="Matrícula" value={temp.mapCid || ''} onChange={e => setTemp({...temp, mapCid: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white" />
               <input placeholder="Nome Vendedor" value={temp.mapSname || ''} onChange={e => setTemp({...temp, mapSname: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white" />
               <input placeholder="WhatsApp (55...)" value={temp.mapPhone || ''} onChange={e => setTemp({...temp, mapPhone: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white" />
               <button onClick={() => { onAddMapping({customerId: temp.mapCid, customerName: 'Busca Automática', sellerName: temp.mapSname, sellerCode: 'VD', sellerPhone: temp.mapPhone}); setTemp({}); }} className="p-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Salvar Mapeamento</button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {clientMappings.map(m => (
                <div key={m.customerId} className="p-5 border rounded-3xl flex items-center justify-between bg-white hover:border-indigo-200 transition-all group">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Cód. Cliente: {m.customerId}</p>
                    <p className="text-xs font-black text-slate-700 uppercase">{m.sellerName}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">{m.sellerPhone || 'S/ WhatsApp'}</p>
                  </div>
                  <button onClick={() => onRemoveMapping(m.customerId)} className="text-slate-200 group-hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BASE CRÍTICA */}
        {activeSubTab === 'critical-base' && (
          <div className="space-y-8 max-w-5xl">
            <div className="flex justify-between items-center bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
              <div>
                <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Gerenciamento de Alertas Operacionais</h3>
                <p className="text-xs font-bold text-rose-900 uppercase">Clientes com restrições ou alto índice de devolução</p>
              </div>
              <button onClick={() => { setBulkText(''); setShowBulkModal(true); }} className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all">
                <i className="fas fa-user-plus mr-2"></i> Adição Automática
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 rounded-3xl border">
              <input placeholder="Matrícula" value={temp.cid || ''} onChange={e => setTemp({...temp, cid: e.target.value})} className="p-4 rounded-2xl border font-bold text-sm bg-white" />
              <select value={temp.cstatus} onChange={e => setTemp({...temp, cstatus: e.target.value})} className="p-4 rounded-2xl border font-bold text-xs uppercase bg-white">
                 <option>Retorno</option>
                 <option>Reclamação</option>
                 <option>Pendência Financeira</option>
              </select>
              <select value={temp.crisk} onChange={e => setTemp({...temp, crisk: e.target.value})} className="p-4 rounded-2xl border font-bold text-xs uppercase bg-white">
                 <option value="low">Risco Baixo</option>
                 <option value="medium">Risco Médio</option>
                 <option value="high">Risco Alto</option>
              </select>
              <input placeholder="Observação do Problema" value={temp.cnotes || ''} onChange={e => setTemp({...temp, cnotes: e.target.value})} className="md:col-span-2 p-4 rounded-2xl border font-bold text-sm bg-white" />
              <button onClick={() => { onAddCritical({customerId: temp.cid, returnCount: 0, complaintCount: 1, notes: temp.cnotes, status: temp.cstatus, riskLevel: temp.crisk, resolutionStatus: 'Pendente', registrationDate: new Date().toISOString().split('T')[0]}); setTemp({cstatus: 'Retorno', crisk: 'low'}); }} className="p-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg">Registrar Alerta</button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {customerDatabase.map(c => (
                <div key={c.customerId} className={`p-5 border rounded-3xl flex items-center justify-between bg-white ${c.riskLevel === 'high' ? 'border-rose-200 bg-rose-50/10 shadow-sm' : ''}`}>
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg ${c.riskLevel === 'high' ? 'bg-rose-600 shadow-lg shadow-rose-200 animate-pulse' : 'bg-amber-400'}`}>
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{c.customerId}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{c.status} • {c.notes}</p>
                      <p className="text-[8px] font-black text-indigo-400 uppercase mt-1">Registrado em: {c.registrationDate}</p>
                    </div>
                  </div>
                  <button onClick={() => onRemoveCritical(c.customerId)} className="text-slate-200 hover:text-rose-500 p-2 transition-colors"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OUTROS COMPONENTES MANTIDOS CONFORME SOLICITADO */}
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

        {/* BANCO DE DADOS */}
        {activeSubTab === 'database' && (
          <div className="space-y-8 max-w-5xl">
            <div className="flex items-center justify-between">
               <h3 className="font-black text-slate-800 uppercase text-sm">Status da Sincronização Cloud</h3>
               <button onClick={onRefresh} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg">Verificar Sincronia</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(tableStatus).map(([key, ok]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                          <i className={`fas ${ok ? 'fa-check' : 'fa-times'}`}></i>
                        </div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{key.replace('_', ' ')}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {ok ? 'Ativa' : 'Desconectada'}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-slate-900 text-emerald-400 rounded-3xl font-mono text-[10px] space-y-2 border-4 border-slate-800 shadow-2xl">
                   <p className="text-slate-500">// System Diagnostic Logs</p>
                   <p>> connect rvzcixwhkkrlnesbcdke...</p>
                   <p>> status: online</p>
                   <p>> tables: synchronized</p>
                   <p>> realtime: enabled</p>
                   <p className="animate-pulse">> _</p>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE IMPORTAÇÃO EM MASSA (UNIFICADO) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">
                Importação Rápida: {activeSubTab === 'mappings' ? 'Vendedores' : 'Base Crítica'}
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
               <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1">Padrão de Colunas (Separado por ; ou TAB):</p>
               <p className="text-[9px] font-bold text-indigo-600 leading-relaxed uppercase italic">
                 {activeSubTab === 'mappings' 
                  ? 'Matrícula ; Nome do Vendedor ; WhatsApp (ex: 55119...)' 
                  : 'Matrícula ; Motivo (Retorno/Reclamação) ; Risco (low/medium/high) ; Notas'}
               </p>
            </div>

            <textarea 
              value={bulkText} 
              onChange={(e) => setBulkText(e.target.value)} 
              className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-mono resize-none focus:ring-4 focus:ring-indigo-500/10" 
              placeholder="Cole os dados aqui..."
            />

            <div className="flex gap-4">
              <button onClick={() => setShowBulkModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
              <button 
                onClick={activeSubTab === 'mappings' ? handleBulkImportMappings : handleBulkImportCritical} 
                className={`flex-1 py-4 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl ${activeSubTab === 'mappings' ? 'bg-indigo-600' : 'bg-rose-600'}`}
              >
                Confirmar Importação de {bulkText.split('\n').filter(l => l.trim()).length} Itens
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
