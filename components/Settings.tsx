
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
  const [activeSubTab, setActiveSubTab] = useState<'reasons' | 'critical-base' | 'branches' | 'vehicles' | 'drivers' | 'mappings'>('reasons');
  const [mappingMode, setMappingMode] = useState<'individual' | 'bulk'>('individual');
  const [temp, setTemp] = useState<any>({});

  const handleBulkMappings = () => {
    if (!temp.bulkText?.trim()) return;
    const lines = temp.bulkText.split('\n').filter((l: string) => l.trim());
    const newMappings = lines.map((line: string) => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(';');
      return {
        customerId: parts[0]?.trim() || `MAT-${Math.floor(Math.random() * 90000)}`,
        customerName: parts[1]?.trim() || 'N/I',
        sellerCode: parts[2]?.trim() || 'VD-00',
        sellerName: parts[3]?.trim() || 'Vendedor Manual',
        sellerPhone: parts[4]?.trim() || ''
      };
    });
    onBulkAddMappings(newMappings);
    setTemp({});
  };

  const tabs = [
    { id: 'reasons', label: 'Motivos', icon: 'fa-clipboard-list' },
    { id: 'critical-base', label: 'Base Crítica', icon: 'fa-user-shield' },
    { id: 'mappings', label: 'Vendedores', icon: 'fa-address-book' },
    { id: 'branches', label: 'Filiais', icon: 'fa-building' },
    { id: 'vehicles', label: 'Frota', icon: 'fa-truck-front' },
    { id: 'drivers', label: 'Equipe', icon: 'fa-users' },
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
        
        {/* TAB: MOTIVOS */}
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
                  <button onClick={() => { if(window.confirm("Remover?")) onRemoveReason(r.id); }} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: BASE CRÍTICA */}
        {activeSubTab === 'critical-base' && (
          <div className="space-y-8 max-w-5xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 grid grid-cols-3 gap-6 items-end shadow-inner">
              <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Matrícula Cliente</label><input value={temp.cid || ''} onChange={e => setTemp({...temp, cid: e.target.value})} className="w-full p-4 rounded-2xl border font-bold uppercase text-sm bg-white" placeholder="MAT-100" /></div>
              <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Status de Risco</label>
                <select value={temp.cstatus || 'Retorno'} onChange={e => setTemp({...temp, cstatus: e.target.value})} className="w-full p-4 rounded-2xl border font-bold uppercase text-xs bg-white">
                  <option value="Retorno">Retorno Recorrente</option>
                  <option value="Pendência">Pendência Financeira</option>
                  <option value="Reclamação">Reclamação Constante</option>
                  <option value="Restrição de Horário">Restrição de Horário</option>
                </select>
              </div>
              <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Nível de Risco</label>
                <select value={temp.crisk || 'medium'} onChange={e => setTemp({...temp, crisk: e.target.value})} className="w-full p-4 rounded-2xl border font-bold uppercase text-xs bg-white">
                  <option value="low">Baixo</option>
                  <option value="medium">Médio</option>
                  <option value="high">Alto</option>
                </select>
              </div>
              <div className="col-span-3"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Notas Críticas</label><input value={temp.cnotes || ''} onChange={e => setTemp({...temp, cnotes: e.target.value})} className="w-full p-4 rounded-2xl border font-bold text-sm bg-white" placeholder="Ex: Cliente recusa descarga sem ajudante" /></div>
              <button onClick={() => { onAddCritical({customerId: temp.cid, status: temp.cstatus || 'Retorno', notes: temp.cnotes, riskLevel: temp.crisk || 'medium', returnCount: 0, complaintCount: 0, resolutionStatus: 'Pendente', registrationDate: new Date().toLocaleDateString('pt-BR')}); setTemp({}); }} className="col-span-3 h-14 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-rose-700 transition-all">Salvar Cliente Crítico</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {customerDatabase.map(c => (
                <div key={c.customerId} className={`p-6 border-2 rounded-3xl flex flex-col justify-between bg-white ${c.riskLevel === 'high' ? 'border-rose-100' : 'border-slate-50'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-black text-slate-800 uppercase">{c.customerId}</span>
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${c.riskLevel === 'high' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>{c.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 italic font-medium">"{c.notes}"</p>
                  </div>
                  <div className="mt-4 flex justify-between items-center border-t pt-4">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{c.registrationDate}</span>
                    <button onClick={() => { if(window.confirm("Remover?")) onRemoveCritical(c.customerId); }} className="text-rose-300 hover:text-rose-600"><i className="fas fa-trash-can"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: VENDEDORES */}
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
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Layout de Planilha (Copiar e Colar)</label>
                    <span className="text-[9px] font-bold text-indigo-400">MATRÍCULA ; NOME_CLIENTE ; CÓD.VENDEDOR ; NOME_VENDEDOR ; WHATSAPP</span>
                  </div>
                  <textarea value={temp.bulkText || ''} onChange={e => setTemp({...temp, bulkText: e.target.value})} className="w-full h-48 p-4 rounded-2xl border font-mono text-xs bg-white resize-none" placeholder="MAT-101 ; João Silva ; VD-01 ; Pedro Rocha ; 5511999999999" />
                  <button onClick={handleBulkMappings} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Processar Inserção em Massa</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {clientMappings.map(m => (
                <div key={m.customerId} className="p-6 border rounded-3xl flex justify-between items-center bg-white shadow-sm">
                  <div>
                    <p className="font-black text-indigo-600 text-[10px] uppercase">CLIENTE: {m.customerId}</p>
                    <p className="font-bold text-slate-800 uppercase text-xs mt-1">{m.sellerName}</p>
                    <p className="text-[9px] font-black text-emerald-500 mt-1">{m.sellerPhone}</p>
                  </div>
                  <button onClick={() => { if(window.confirm("Remover?")) onRemoveMapping(m.customerId); }} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: FILIAIS */}
        {activeSubTab === 'branches' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 flex gap-4 items-end shadow-inner">
               <div className="flex-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Nome da Filial</label>
                 <input value={temp.bname || ''} onChange={e => setTemp({...temp, bname: e.target.value})} className="w-full p-4 rounded-2xl border font-bold uppercase text-sm bg-white" placeholder="Ex: Filial Curitiba" />
               </div>
               <button onClick={() => { onAddBranch({id: `B-${Date.now()}`, name: temp.bname, location: 'BR'}); setTemp({}); }} disabled={!temp.bname} className="h-14 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Adicionar</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {branches.map(b => (
                <div key={b.id} className="p-6 border rounded-3xl flex items-center justify-between bg-white group hover:border-indigo-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black"><i className="fas fa-building text-xs"></i></div>
                    <span className="font-black uppercase text-xs text-slate-800">{b.name}</span>
                  </div>
                  <button onClick={() => { if(window.confirm("Remover?")) onRemoveBranch(b.id); }} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: FROTA */}
        {activeSubTab === 'vehicles' && (
          <div className="space-y-6 max-w-4xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-6 items-end">
              <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Placa</label><input value={temp.vplate || ''} onChange={e => setTemp({...temp, vplate: e.target.value})} className="w-full p-4 rounded-2xl border uppercase font-bold text-sm bg-white" placeholder="ABC-1234" /></div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Filial</label>
                <select value={temp.vbranch || ''} onChange={e => setTemp({...temp, vbranch: e.target.value})} className="w-full p-4 rounded-2xl border font-bold uppercase text-xs bg-white">
                  <option value="">Selecione...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <button onClick={() => { onAddVehicle({id: `V-${Date.now()}`, plate: temp.vplate, branchId: temp.vbranch, model: 'Logística', capacity: 'G'}); setTemp({}); }} className="col-span-2 h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Cadastrar Veículo</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map(v => (
                <div key={v.id} className="p-6 border rounded-3xl flex items-center justify-between bg-white shadow-sm hover:border-indigo-100">
                  <div>
                    <p className="font-black text-slate-800 uppercase text-xs">{v.plate}</p>
                    <p className="text-[9px] font-black text-indigo-500 uppercase mt-1">{branches.find(b => b.id === v.branchId)?.name || 'N/I'}</p>
                  </div>
                  <button onClick={() => { if(window.confirm("Remover?")) onRemoveVehicle(v.id); }} className="text-slate-200 hover:text-rose-500 p-2"><i className="fas fa-trash-can"></i></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: EQUIPE */}
        {activeSubTab === 'drivers' && (
          <div className="space-y-6 max-w-5xl">
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 grid grid-cols-2 gap-6 items-end shadow-inner">
              <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Nome do Motorista</label><input value={temp.dname || ''} onChange={e => setTemp({...temp, dname: e.target.value})} className="w-full p-4 rounded-2xl border font-bold uppercase text-sm bg-white" /></div>
              <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Filial</label>
                <select value={temp.dbranch || ''} onChange={e => setTemp({...temp, dbranch: e.target.value})} className="w-full p-4 rounded-2xl border font-bold uppercase text-xs bg-white">
                  <option value="">Selecione...</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <button onClick={() => { onAddDriver({id: `DRV-${Date.now()}`, name: temp.dname, branchId: temp.dbranch, status: 'Ativo', licenseType: 'D'}); setTemp({}); }} className="col-span-2 h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Registrar Motorista</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {drivers.map(d => (
                <div key={d.id} className="p-6 border rounded-3xl flex items-center justify-between bg-white shadow-sm hover:border-indigo-100 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs">{d.name.charAt(0)}</div>
                    <div>
                      <p className="font-black text-slate-800 uppercase text-xs">{d.name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{branches.find(b => b.id === d.branchId)?.name || 'N/I'}</p>
                    </div>
                  </div>
                  <button onClick={() => { if(window.confirm("Remover?")) onRemoveDriver(d.id); }} className="text-slate-200 hover:text-rose-500 p-2 opacity-0 group-hover:opacity-100"><i className="fas fa-trash-can"></i></button>
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
