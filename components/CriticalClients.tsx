
import React, { useMemo, useState } from 'react';
import { CustomerReputation, Delivery, ClientMapping } from '../types';

interface CriticalClientsProps {
  deliveries: Delivery[];
  customerHistory: CustomerReputation[];
  clientMappings: ClientMapping[];
  onAddMapping: (mapping: ClientMapping) => void;
  onBulkAddMappings: (mappings: ClientMapping[]) => void;
  selectedBranch: string;
  filterDate: string;
  onUpdateClient?: (customerId: string, updates: Partial<CustomerReputation>) => void;
}

const CriticalClients: React.FC<CriticalClientsProps> = ({ 
  deliveries, customerHistory, clientMappings, onAddMapping, onBulkAddMappings, 
  selectedBranch, filterDate, onUpdateClient 
}) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'individual' | 'bulk'>('individual');
  const [formData, setFormData] = useState({ cid: '', cname: '', scode: '', sname: '', sphone: '' });
  const [bulkText, setBulkText] = useState('');

  const formattedFilterDate = useMemo(() => {
    if (!filterDate) return new Date().toLocaleDateString('pt-BR');
    const [y, m, d] = filterDate.split('-');
    return `${d}/${m}/${y}`;
  }, [filterDate]);

  const criticalList = useMemo(() => {
    return customerHistory
      .filter(h => statusFilter === 'all' || h.status === statusFilter)
      .map(history => {
        const deliveryToday = deliveries.find(d => 
          d.customerId === history.customerId && 
          (d.date === formattedFilterDate || d.date === filterDate)
        );
        
        return {
          ...history,
          activeDelivery: deliveryToday,
          driverName: deliveryToday?.driverName || null,
          tracking: deliveryToday?.trackingCode || 'N/A'
        };
      });
  }, [deliveries, customerHistory, formattedFilterDate, filterDate, statusFilter]);

  const handleSaveIndividual = () => {
    if (!formData.cid || !formData.cname) { alert("Preencha matrícula e nome do cliente."); return; }
    onAddMapping({
      customerId: formData.cid.toUpperCase(),
      customerName: formData.cname.toUpperCase(),
      sellerCode: formData.scode.toUpperCase() || 'VD-00',
      sellerName: formData.sname.toUpperCase() || 'VENDEDOR PADRÃO',
      sellerPhone: formData.sphone
    });
    setFormData({ cid: '', cname: '', scode: '', sname: '', sphone: '' });
    setShowAddModal(false);
  };

  const handleSaveBulk = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').filter(l => l.trim());
    const newMappings: ClientMapping[] = lines.map(line => {
      const p = line.split(';').map(v => v.trim());
      return {
        customerId: p[0]?.toUpperCase() || `MAT-${Math.floor(Math.random()*1000)}`,
        customerName: p[1]?.toUpperCase() || 'CLIENTE S/N',
        sellerCode: p[2]?.toUpperCase() || 'VD-00',
        sellerName: p[3]?.toUpperCase() || 'VENDEDOR',
        sellerPhone: p[4] || ''
      };
    });
    onBulkAddMappings(newMappings);
    setBulkText('');
    setShowAddModal(false);
  };

  const toggleResolution = (customerId: string, current: 'Pendente' | 'Resolvido') => {
    if (onUpdateClient) {
      onUpdateClient(customerId, { resolutionStatus: current === 'Pendente' ? 'Resolvido' : 'Pendente' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Controle de Carteira</h2>
          <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">Clientes & Vendedores</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
          <i className="fas fa-user-plus"></i> Cadastrar Cliente
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Painel de Alertas de Retorno</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">Clientes Críticos mapeados na base</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white border border-slate-200 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {['all', 'Retorno', 'Pendência', 'Reclamação', 'Restrição de Horário'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${
                    statusFilter === s ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {s === 'all' ? 'Todos' : s}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Data Registro</th>
                <th className="px-8 py-4">Matrícula</th>
                <th className="px-8 py-4">Status Base</th>
                <th className="px-8 py-4">Motivo / Notas</th>
                <th className="px-8 py-4 text-center">Resolução</th>
                <th className="px-8 py-4 text-center">Status Hoje (Motorista)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalList.map((client) => (
                <tr key={client.customerId} className={`hover:bg-slate-50 transition-colors ${client.riskLevel === 'high' ? 'bg-rose-50/5' : ''}`}>
                  <td className="px-8 py-5 text-xs font-black text-slate-400 uppercase">{client.registrationDate}</td>
                  <td className="px-8 py-5 text-sm font-black uppercase text-slate-800">{client.customerId}</td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-1 text-[9px] font-black uppercase rounded ${
                      client.status === 'Restrição de Horário' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>{client.status}</span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs text-slate-600 font-medium italic">"{client.notes}"</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <button 
                      onClick={() => toggleResolution(client.customerId, client.resolutionStatus)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border ${
                        client.resolutionStatus === 'Resolvido' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}
                    >
                      {client.resolutionStatus}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {client.driverName ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-lg border border-amber-100 flex items-center gap-1.5">
                          <i className="fas fa-truck-moving animate-pulse"></i> {client.driverName}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Carga: {client.tracking}</span>
                      </div>
                    ) : (
                      <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[9px] font-black uppercase rounded-lg border border-slate-100">Sem Entrega</span>
                    )}
                  </td>
                </tr>
              ))}
              {criticalList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-slate-400 text-xs font-bold uppercase italic">
                    Nenhum cliente crítico encontrado para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO DE CLIENTE */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b pb-4">
               <div className="flex gap-6">
                 <button onClick={() => setAddMode('individual')} className={`text-[11px] font-black uppercase pb-2 border-b-2 transition-all ${addMode === 'individual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Individual</button>
                 <button onClick={() => setAddMode('bulk')} className={`text-[11px] font-black uppercase pb-2 border-b-2 transition-all ${addMode === 'bulk' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Em Massa (Planilha)</button>
               </div>
               <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>

            {addMode === 'individual' ? (
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Matrícula Cliente</label>
                  <input value={formData.cid} onChange={e => setFormData({...formData, cid: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" placeholder="Ex: MAT-100" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Cód. Vendedor</label>
                  <input value={formData.scode} onChange={e => setFormData({...formData, scode: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" placeholder="Ex: VD-22" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Nome do Cliente</label>
                  <input value={formData.cname} onChange={e => setFormData({...formData, cname: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" placeholder="NOME COMPLETO" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Nome do Vendedor</label>
                  <input value={formData.sname} onChange={e => setFormData({...formData, sname: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" placeholder="VENDEDOR" />
                </div>
                <div className="col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">WhatsApp Vendedor</label>
                  <input value={formData.sphone} onChange={e => setFormData({...formData, sphone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="5511..." />
                </div>
                <button onClick={handleSaveIndividual} className="col-span-2 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl mt-4">Salvar Cadastro</button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-[10px] font-black uppercase text-slate-500">
                  <span>Delimitador: PONTO E VÍRGULA ( ; )</span>
                  <span className="text-indigo-600">Matrícula ; Nome ; Cód.Vend ; Nome.Vend ; WhatsApp</span>
                </div>
                <textarea 
                  value={bulkText} 
                  onChange={e => setBulkText(e.target.value)} 
                  className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-mono resize-none" 
                  placeholder="MAT-101 ; João Silva ; VD-01 ; Pedro Rocha ; 5511999999999" 
                />
                <button onClick={handleSaveBulk} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Processar Massa</button>
              </div>
            )}
            <p className="text-[9px] font-bold text-slate-400 uppercase text-center italic">Os dados serão vinculados à tabela de mapeamento de vendedores.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalClients;
