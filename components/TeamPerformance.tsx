
import React, { useMemo, useState } from 'react';
import { BRANCHES } from '../constants';
import { DeliveryStatus, Delivery, Driver } from '../types';

interface TeamPerformanceProps {
  selectedBranch: string;
  deliveries: Delivery[];
  drivers: Driver[];
  onBulkUpdateStatus: (ids: string[], status: 'base' | 'rota' | 'patio') => void;
}

const TeamPerformance: React.FC<TeamPerformanceProps> = ({ selectedBranch, deliveries, drivers, onBulkUpdateStatus }) => {
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);

  const branchDeliveries = useMemo(() => {
    return deliveries.filter(d => selectedBranch === 'all' || d.branch === selectedBranch);
  }, [selectedBranch, deliveries]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => selectedBranch === 'all' || d.branchId === selectedBranch);
  }, [selectedBranch, drivers]);

  const teamData = useMemo(() => {
    return filteredDrivers.map(driver => {
      const driverDeliveries = branchDeliveries.filter(d => d.driverName === driver.name);
      
      const stats = {
        total: driverDeliveries.length,
        completed: driverDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length,
        pending: driverDeliveries.filter(d => [DeliveryStatus.PENDING, DeliveryStatus.IN_TRANSIT].includes(d.status)).length,
        inTransit: driverDeliveries.filter(d => d.status === DeliveryStatus.IN_TRANSIT).length,
        efficiency: driverDeliveries.length > 0 ? (driverDeliveries.filter(d => d.status === DeliveryStatus.DELIVERED).length / driverDeliveries.length) * 100 : 0,
        plate: driverDeliveries[0]?.licensePlate || 'S/ Veículo'
      };

      // Lógica de Status Automático caso não definido manualmente
      let calculatedStatus: 'base' | 'rota' | 'patio' = driver.manualStatus || 'patio';
      if (!driver.manualStatus && stats.total > 0) {
          if (stats.pending === 0) calculatedStatus = 'base';
          else if (stats.inTransit > 0 || (stats.completed > 0 && stats.pending > 0)) calculatedStatus = 'rota';
          else calculatedStatus = 'patio';
      }

      return {
        id: driver.id,
        name: driver.name,
        plate: stats.plate,
        total: stats.total,
        completed: stats.completed,
        efficiency: stats.efficiency,
        status: calculatedStatus,
        branchId: driver.branchId
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [branchDeliveries, filteredDrivers]);

  const summary = useMemo(() => {
    return {
      rota: teamData.filter(t => t.status === 'rota').length,
      base: teamData.filter(t => t.status === 'base').length,
      patio: teamData.filter(t => t.status === 'patio').length,
      criticos: teamData.filter(t => t.efficiency < 75 && t.total > 0).length
    };
  }, [teamData]);

  const handleBulkStatusChange = (status: 'base' | 'rota' | 'patio') => {
    onBulkUpdateStatus(selectedDriverIds, status);
    setSelectedDriverIds([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Resumo de Frota em Tempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-200 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Veículos em Rota</p>
            <p className="text-3xl font-black text-amber-600">{summary.rota}</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-amber-100/20">
            <i className="fas fa-truck-fast"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Na Unidade (Base)</p>
            <p className="text-3xl font-black text-emerald-600">{summary.base}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-100/20">
            <i className="fas fa-warehouse"></i>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">No Pátio (Pendente)</p>
            <p className="text-3xl font-black text-slate-600">{summary.patio}</p>
          </div>
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-xl">
            <i className="fas fa-square-parking"></i>
          </div>
        </div>

        <div className="bg-rose-600 p-6 rounded-3xl shadow-lg flex items-center justify-between group">
          <div>
            <p className="text-[10px] font-black text-rose-200 uppercase tracking-widest mb-1">Alertas de Risco</p>
            <p className="text-3xl font-black text-white">{summary.criticos}</p>
          </div>
          <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center text-xl">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-users-gear"></i> 
          Equipes de {BRANCHES.find(b => b.id === selectedBranch)?.name || 'Todas as Unidades'}
        </h2>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedDriverIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 border border-slate-700">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 pr-8 border-r border-slate-700">{selectedDriverIds.length} Selecionados</span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkStatusChange('base')} className="px-5 py-2.5 bg-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700">Set Base</button>
              <button onClick={() => handleBulkStatusChange('rota')} className="px-5 py-2.5 bg-amber-600 rounded-xl text-[10px] font-black uppercase hover:bg-amber-700">Set Rota</button>
              <button onClick={() => handleBulkStatusChange('patio')} className="px-5 py-2.5 bg-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-700">Set Pátio</button>
            </div>
            <button onClick={() => setSelectedDriverIds([])} className="text-slate-400 hover:text-white p-2 transition-colors"><i className="fas fa-times text-lg"></i></button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
           <div>
             <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Painel de Status das Equipes</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Sincronização em tempo real por unidade operacional</p>
           </div>
           <div className="flex items-center gap-2">
             <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase bg-white border border-slate-100 px-4 py-2 rounded-xl">
               <i className="fas fa-filter text-indigo-500"></i> {teamData.length} Motoristas Ativos
             </span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4 w-10">
                   <input type="checkbox" checked={selectedDriverIds.length === teamData.length && teamData.length > 0} onChange={() => setSelectedDriverIds(selectedDriverIds.length === teamData.length ? [] : teamData.map(t => t.id))} />
                </th>
                <th className="px-8 py-4">Motorista / Unidade</th>
                <th className="px-8 py-4">Progresso Atual</th>
                <th className="px-8 py-4">Localização / Status</th>
                <th className="px-8 py-4 text-right">Eficiência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamData.map((member) => (
                <tr key={member.id} className={`hover:bg-slate-50 transition-colors ${selectedDriverIds.includes(member.id) ? 'bg-indigo-50/30' : ''} ${member.efficiency < 75 && member.total > 0 ? 'bg-rose-50/10' : ''}`}>
                  <td className="px-8 py-5">
                    <input type="checkbox" checked={selectedDriverIds.includes(member.id)} onChange={() => setSelectedDriverIds(prev => prev.includes(member.id) ? prev.filter(i => i !== member.id) : [...prev, member.id])} />
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-sm ${member.efficiency < 75 && member.total > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{member.name}</p>
                        <div className="flex gap-2 items-center">
                          <span className="text-[9px] font-black text-indigo-500 uppercase">{member.plate}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                            {BRANCHES.find(b => b.id === member.branchId)?.name.split(' - ')[1] || 'S/ Filial'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="w-32">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{member.completed}/{member.total} CX</span>
                        <span className={`text-[10px] font-black ${member.efficiency < 75 && member.total > 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                          {Math.round(member.efficiency)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${member.efficiency < 75 && member.total > 0 ? 'bg-rose-500' : 'bg-indigo-600'}`} style={{ width: `${member.efficiency}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {member.status === 'base' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100 shadow-sm"><i className="fas fa-house-circle-check"></i> Na Unidade</span>}
                    {member.status === 'rota' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase rounded-lg border border-amber-100 shadow-sm"><i className="fas fa-truck-moving animate-pulse"></i> Em Entrega</span>}
                    {member.status === 'patio' && <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-500 text-[9px] font-black uppercase rounded-lg border border-slate-200 shadow-sm"><i className="fas fa-square-parking"></i> No Pátio</span>}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`text-sm font-black ${member.efficiency < 75 && member.total > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {member.efficiency.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {teamData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center opacity-40">
                    <i className="fas fa-users-slash text-4xl mb-4 block"></i>
                    <p className="text-sm font-black uppercase tracking-widest italic">Nenhuma equipe ativa nesta unidade.</p>
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

export default TeamPerformance;
