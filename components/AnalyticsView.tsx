
import React, { useMemo } from 'react';
import { BRANCHES } from '../constants';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { DeliveryStatus, Delivery } from '../types';

interface AnalyticsViewProps {
  selectedBranch: string;
  deliveries: Delivery[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ selectedBranch, deliveries }) => {
  const branchDeliveries = useMemo(() => {
    return deliveries.filter(d => selectedBranch === 'all' || d.branch === selectedBranch);
  }, [selectedBranch, deliveries]);

  const stats = useMemo(() => {
    const totalDeliveries = branchDeliveries.length;
    const deliveredItems = branchDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED);
    const failedItems = branchDeliveries.filter(d => d.status === DeliveryStatus.FAILED || d.status === DeliveryStatus.RETURNED);
    const totalBoxes = branchDeliveries.reduce((acc, curr) => acc + (curr.boxQuantity || 0), 0);
    const deliveredBoxes = deliveredItems.reduce((acc, curr) => acc + (curr.boxQuantity || 0), 0);

    return {
      totalCustomers: totalDeliveries,
      deliveredCustomers: deliveredItems.length,
      failedItems: failedItems.length,
      efficiencyPercent: totalDeliveries > 0 ? (deliveredItems.length / totalDeliveries) * 100 : 0,
      totalBoxes,
      deliveredBoxes,
      effectivenessPercent: totalBoxes > 0 ? (deliveredBoxes / totalBoxes) * 100 : 0,
    };
  }, [branchDeliveries]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Dashboards de Auditoria Operacional</h2>
          <p className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
            {BRANCHES.find(b => b.id === selectedBranch)?.name || 'Consolidado Geral'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl text-white">
          <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2">Total de Clientes</p>
          <p className="text-3xl font-black">{stats.totalCustomers}</p>
          <div className="mt-4 text-[9px] text-indigo-300 font-bold uppercase">Volume Total Carregado</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Sucesso na Entrega</p>
          <p className="text-3xl font-black text-emerald-600">{stats.deliveredCustomers}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Tickets Finalizados</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Devoluções / Falhas</p>
          <p className="text-3xl font-black text-rose-600">{stats.failedItems}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Ocorrências</span>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Aproveitamento de Carga</p>
          <p className="text-3xl font-black">{stats.effectivenessPercent.toFixed(1)}%</p>
          <div className="mt-4 text-[9px] text-slate-500 font-bold uppercase">Meta Logística: 95%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-8 tracking-widest border-l-4 border-emerald-400 pl-4">Indicadores de Performance</h3>
          <div className="space-y-10">
            <div>
              <div className="flex justify-between mb-3">
                <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Efetividade por Volume (Caixas Entregues)</span>
                <span className="text-xs font-black text-emerald-600">{stats.effectivenessPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: `${stats.effectivenessPercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-3">
                <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Eficiência por Ticket (Clientes Atendidos)</span>
                <span className="text-xs font-black text-indigo-600">{stats.efficiencyPercent.toFixed(1)}%</span>
              </div>
              <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className="h-full bg-indigo-600 transition-all duration-1000 shadow-[0_0_10px_rgba(79,70,229,0.3)]" style={{ width: `${stats.efficiencyPercent}%` }}></div>
              </div>
            </div>
          </div>
          <p className="mt-10 text-[10px] text-slate-400 font-bold uppercase text-center italic tracking-widest">Dados sincronizados em tempo real com rvzcixwhkkrlnesbcdke</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
