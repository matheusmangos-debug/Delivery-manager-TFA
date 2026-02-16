
import React, { useMemo } from 'react';
import { BRANCHES } from '../constants';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
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

  // Estatísticas Dinâmicas a partir da base de dados
  const stats = useMemo(() => {
    const totalDeliveries = branchDeliveries.length;
    const deliveredItems = branchDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED);
    const totalBoxes = branchDeliveries.reduce((acc, curr) => acc + (curr.boxQuantity || 0), 0);
    const deliveredBoxes = deliveredItems.reduce((acc, curr) => acc + (curr.boxQuantity || 0), 0);

    return {
      totalCustomers: totalDeliveries,
      deliveredCustomers: deliveredItems.length,
      efficiencyPercent: totalDeliveries > 0 ? (deliveredItems.length / totalDeliveries) * 100 : 0,
      totalBoxes,
      deliveredBoxes,
      effectivenessPercent: totalBoxes > 0 ? (deliveredBoxes / totalBoxes) * 100 : 0,
    };
  }, [branchDeliveries]);

  // Processamento Diário dos Dados Reais para os Gráficos
  const dailyPerformanceData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayDeliveries = deliveries.filter(d => d.date === date);
      const dayName = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
      const delivered = dayDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length;
      const total = dayDeliveries.length;
      
      const boxesTotal = dayDeliveries.reduce((a,b)=>a+b.boxQuantity, 0);
      const boxesDelivered = dayDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED).reduce((a,b)=>a+b.boxQuantity, 0);

      return {
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        deliveries: total,
        efficiency: total > 0 ? (delivered / total) * 100 : 0,
        effectiveness: boxesTotal > 0 ? (boxesDelivered / boxesTotal) * 100 : 0,
        returnedCustomers: dayDeliveries.filter(d => d.status === DeliveryStatus.RETURNED).length,
        returnedBoxes: dayDeliveries.filter(d => d.status === DeliveryStatus.RETURNED).reduce((a,b)=>a+b.boxQuantity, 0),
        boxes: boxesTotal
      };
    });
  }, [deliveries]);

  const branchName = useMemo(() => {
    return BRANCHES.find(b => b.id === selectedBranch)?.name || 'Consolidado Geral';
  }, [selectedBranch]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Dashboards de Auditoria Operacional Realtime</h2>
          <p className="text-2xl font-black text-slate-800">{branchName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Eficiência (Clientes)</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-800">{stats.deliveredCustomers}</p>
            <p className="text-sm text-slate-400 mb-1">/ {stats.totalCustomers} Entregues</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600" style={{ width: `${stats.efficiencyPercent}%` }}></div></div>
            <span className="text-[10px] font-black text-indigo-600">{stats.efficiencyPercent.toFixed(1)}%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Efetividade (Caixas)</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-slate-800">{stats.deliveredBoxes.toLocaleString()}</p>
            <p className="text-sm text-slate-400 mb-1">/ {stats.totalBoxes.toLocaleString()} CX</p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${stats.effectivenessPercent}%` }}></div></div>
            <span className="text-[10px] font-black text-emerald-600">{stats.effectivenessPercent.toFixed(1)}%</span>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Ocorrências de Retorno</p>
          <p className="text-3xl font-black">{branchDeliveries.filter(d=>d.status === DeliveryStatus.RETURNED).length}</p>
          <div className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Sincronizado com central de devoluções</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-8 tracking-widest border-l-4 border-indigo-600 pl-4">Volume Operacional (7 dias)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="deliveries" name="Clientes" stroke="#4f46e5" fill="#4f46e510" strokeWidth={3} />
                <Area type="monotone" dataKey="boxes" name="Caixas" stroke="#10b981" fill="#10b98110" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase mb-8 tracking-widest border-l-4 border-emerald-400 pl-4">Eficiência e Efetividade (%)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} domain={[0, 100]} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="efficiency" name="Clientes %" fill="#818cf8" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="effectiveness" name="Caixas %" fill="#34d399" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
