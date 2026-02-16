
import React, { useMemo, useState } from 'react';
import { CustomerReputation, Delivery, DeliveryStatus } from '../types';

interface CriticalClientsProps {
  deliveries: Delivery[];
  customerHistory: CustomerReputation[];
  selectedBranch: string;
  filterDate: string;
  onUpdateClient?: (customerId: string, updates: Partial<CustomerReputation>) => void;
}

const CriticalClients: React.FC<CriticalClientsProps> = ({ deliveries, customerHistory, selectedBranch, filterDate, onUpdateClient }) => {
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
          d.date === formattedFilterDate
        );
        
        return {
          ...history,
          activeDelivery: deliveryToday,
          driverName: deliveryToday?.driverName || null,
          tracking: deliveryToday?.trackingCode || 'N/A'
        };
      });
  }, [deliveries, customerHistory, formattedFilterDate, statusFilter]);

  const toggleResolution = (customerId: string, current: 'Pendente' | 'Resolvido') => {
    if (onUpdateClient) {
      onUpdateClient(customerId, { resolutionStatus: current === 'Pendente' ? 'Resolvido' : 'Pendente' });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Painel de Clientes Críticos</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sincronizado com entregas de: {formattedFilterDate}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por Status:</span>
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
    </div>
  );
};

export default CriticalClients;
