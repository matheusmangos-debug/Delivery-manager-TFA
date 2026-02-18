
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
        
        const sellerMapping = clientMappings.find(m => m.customerId === history.customerId);
        
        return {
          ...history,
          activeDelivery: deliveryToday,
          driverName: deliveryToday?.driverName || null,
          tracking: deliveryToday?.trackingCode || 'N/A',
          sellerName: sellerMapping?.sellerName || 'S/ Vendedor'
        };
      });
  }, [deliveries, customerHistory, formattedFilterDate, filterDate, statusFilter, clientMappings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Painel de Alertas Operacionais</h2>
          <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">Gestão de Risco & Vendedores</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
          <i className="fas fa-address-book"></i> Novo Mapeamento
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Carteira Crítica</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">Interligação automática entre Logística e Comercial</p>
          </div>
          
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
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Matrícula</th>
                <th className="px-8 py-4">Vendedor Responsável</th>
                <th className="px-8 py-4">Status / Risco</th>
                <th className="px-8 py-4">Histórico de Ocorrência</th>
                <th className="px-8 py-4 text-center">Status Hoje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalList.map((client) => (
                <tr key={client.customerId} className={`hover:bg-slate-50 transition-colors ${client.riskLevel === 'high' ? 'bg-rose-50/5' : ''}`}>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black uppercase text-slate-800">{client.customerId}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Reg: {client.registrationDate}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-lg border border-indigo-100">
                      {client.sellerName}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${client.riskLevel === 'high' ? 'bg-rose-500 animate-pulse' : client.riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                       <span className="text-[10px] font-black uppercase text-slate-700">{client.status}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs text-slate-500 font-medium italic leading-relaxed">"{client.notes}"</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {client.driverName ? (
                      <div className="inline-flex flex-col items-center p-2 bg-amber-50 rounded-xl border border-amber-100">
                        <span className="text-[9px] font-black text-amber-700 uppercase tracking-tighter">Em Rota c/ {client.driverName}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 uppercase">Sem Movimento</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE CADASTRO UNIFICADO */}
      {showAddModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
               <h3 className="text-lg font-black uppercase text-slate-800 tracking-tight">Novo Mapeamento Logístico</h3>
               <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-600 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Matrícula Cliente</label>
                <input value={formData.cid} onChange={e => setFormData({...formData, cid: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" placeholder="Ex: MAT-100" />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">Vendedor</label>
                <input value={formData.sname} onChange={e => setFormData({...formData, sname: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase" placeholder="Nome Vendedor" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block ml-1">WhatsApp de Contato (Vendedor)</label>
                <input value={formData.sphone} onChange={e => setFormData({...formData, sphone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" placeholder="5511999999999" />
              </div>
              <button onClick={() => { onAddMapping({customerId: formData.cid.toUpperCase(), customerName: 'Cadastrado', sellerCode: 'VD', sellerName: formData.sname.toUpperCase(), sellerPhone: formData.sphone}); setShowAddModal(false); setFormData({cid:'', cname:'', scode:'', sname:'', sphone:''}); }} className="col-span-2 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl mt-4">Vincular Vendedor ao Cliente</button>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase text-center italic">Isso habilitará o botão de WhatsApp automático no registro de retornos.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalClients;
