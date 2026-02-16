
import React, { useMemo } from 'react';
import { BRANCHES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DeliveryStatus, Delivery } from '../types';

interface DashboardProps {
  onNavigate: (tab: any) => void;
  selectedBranch: string;
  deliveries: Delivery[];
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, selectedBranch, deliveries }) => {
  const branchDeliveries = useMemo(() => {
    return deliveries.filter(d => selectedBranch === 'all' || d.branch === selectedBranch);
  }, [selectedBranch, deliveries]);

  const totalBoxes = useMemo(() => {
    return branchDeliveries.reduce((acc, curr) => acc + (curr.boxQuantity || 0), 0);
  }, [branchDeliveries]);

  // Cálculo Dinâmico do Gráfico Operacional dos últimos 7 dias
  const dynamicChartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayDeliveries = deliveries.filter(d => d.date === date);
      const dayName = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' });
      return {
        name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        deliveries: dayDeliveries.length,
        returns: dayDeliveries.filter(d => d.status === DeliveryStatus.RETURNED).length
      };
    });
  }, [deliveries]);

  const driverRanking = useMemo(() => {
    const stats: Record<string, { total: number, completed: number }> = {};
    branchDeliveries.forEach(d => {
      if (!stats[d.driverName]) stats[d.driverName] = { total: 0, completed: 0 };
      stats[d.driverName].total += 1;
      if (d.status === DeliveryStatus.DELIVERED) stats[d.driverName].completed += 1;
    });
    return Object.entries(stats)
      .map(([name, data]) => ({ name, efficiency: (data.completed / data.total) * 100 }))
      .sort((a, b) => b.efficiency - a.efficiency);
  }, [branchDeliveries]);

  const topPerformers = useMemo(() => driverRanking.slice(0, 4), [driverRanking]);
  
  const lowPerformers = useMemo(() => 
    driverRanking
      .filter(d => d.efficiency < 75)
      .sort((a, b) => a.efficiency - b.efficiency)
      .slice(0, 4), 
  [driverRanking]);

  const branchName = useMemo(() => {
    return BRANCHES.find(b => b.id === selectedBranch)?.name || 'Todas as Filiais';
  }, [selectedBranch]);

  const stats = [
    { label: 'Entregas Registradas', value: branchDeliveries.length.toString(), trend: '+12%', icon: 'fa-truck', color: 'bg-emerald-500' },
    { label: 'Total de Caixas', value: totalBoxes.toLocaleString(), trend: 'Volume', icon: 'fa-boxes-stacked', color: 'bg-indigo-600' },
    { label: 'Retornos Operacionais', value: branchDeliveries.filter(d => d.status === DeliveryStatus.RETURNED).length.toString(), trend: 'Sync', icon: 'fa-rotate-left', color: 'bg-slate-900' },
    { label: 'Sucesso Geral', value: branchDeliveries.length > 0 ? `${((branchDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length / branchDeliveries.length) * 100).toFixed(1)}%` : '0%', trend: 'Realtime', icon: 'fa-check-double', color: 'bg-indigo-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-info-circle"></i>
          Delivery Manager Pro: {branchName}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <span className={`text-[10px] font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-widest`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-tight">{stat.label}</h3>
            <p className="text-2xl font-black text-slate-800 mt-1 truncate tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Fluxo Operacional Dinâmico (7 dias)</h3>
            <button onClick={() => onNavigate('analytics')} className="text-xs text-indigo-600 font-black uppercase tracking-widest">Análise Completa</button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="deliveries" name="Entregas" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="returns" name="Devoluções" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Top Performance</h3>
            <button onClick={() => onNavigate('team')} className="text-xs text-indigo-600 font-black uppercase tracking-widest">Equipe</button>
          </div>
          <div className="flex-1 space-y-5">
            {topPerformers.length > 0 ? topPerformers.map((driver, idx) => (
              <div key={driver.name} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center font-black text-[10px] text-emerald-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{driver.name.split(' ')[0]}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                    {driver.efficiency.toFixed(0)}%
                  </span>
                </div>
              </div>
            )) : <p className="text-xs text-slate-400 italic">Dados processando...</p>}
          </div>
          <div className="mt-8 p-5 bg-indigo-600 rounded-[1.5rem] text-white">
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Capacidade Operacional</p>
            <p className="text-3xl font-black">{dynamicChartData.reduce((a,b)=>a+b.deliveries, 0)}</p>
            <p className="text-[10px] text-indigo-300 font-bold uppercase">Volume Total do Período</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
