
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
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Relatório de Gestão de Risco</h2>
          <p className="text-2xl font-black text-slate-800 uppercase tracking-tight">Interligação Logística x Comercial</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {['all', 'Retorno', 'Pendência', 'Reclamação'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${
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
                <th className="px-8 py-4">Cliente (Matrícula)</th>
                <th className="px-8 py-4">Vendedor Responsável</th>
                <th className="px-8 py-4">Motivo / Gravidade</th>
                <th className="px-8 py-4">Observações</th>
                <th className="px-8 py-4 text-center">Status Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalList.map((client) => (
                <tr key={client.customerId} className={`hover:bg-slate-50 transition-colors ${client.riskLevel === 'high' ? 'bg-rose-50/20' : ''}`}>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black uppercase text-indigo-600">{client.customerId}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Auditado em: {client.registrationDate}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase rounded-lg border border-indigo-100">
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
                        <span className="text-[9px] font-black text-amber-700 uppercase">Em Rota c/ {client.driverName.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 uppercase italic">Sem Carga Hoje</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CriticalClients;
