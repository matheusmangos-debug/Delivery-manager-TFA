
import React, { useState, useMemo } from 'react';
import { Delivery, DeliveryStatus, ReturnReason, CustomerReputation, ClientMapping } from '../types';
import { GeminiService } from '../services/geminiService';

interface DeliveryListProps {
  selectedBranch: string;
  deliveries: Delivery[];
  onUpdate: (id: string, updates: Partial<Delivery>) => void;
  onBulkUpdate: (ids: string[], status: DeliveryStatus) => void;
  onAddDeliveries: (deliveries: any[]) => void;
  onDeleteDeliveries: (ids: string[]) => void;
  returnReasons: ReturnReason[];
  customerHistory: CustomerReputation[];
  clientMappings: ClientMapping[];
}

const DeliveryList: React.FC<DeliveryListProps> = ({ 
  selectedBranch, deliveries, onUpdate, onBulkUpdate, onAddDeliveries, onDeleteDeliveries, 
  returnReasons, customerHistory, clientMappings
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'excel' | 'ai'>('excel');
  const [importText, setImportText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  const [returnModalTarget, setReturnModalTarget] = useState<Delivery | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const [whatsappModalTarget, setWhatsappModalTarget] = useState<Delivery | null>(null);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const isCritical = customerHistory.some(h => h.customerId === d.customerId);
      const matchesBranch = selectedBranch === 'all' || d.branch === selectedBranch;
      const matchesStatus = filter === 'all' || d.status === filter;
      const matchesCritical = !onlyCritical || isCritical;
      
      const searchTerm = search.toLowerCase();
      const matchesSearch = search === '' || 
        d.customerName.toLowerCase().includes(searchTerm) || 
        d.customerId.toLowerCase().includes(searchTerm);
        
      return matchesBranch && matchesStatus && matchesSearch && matchesCritical;
    });
  }, [deliveries, selectedBranch, filter, search, onlyCritical, customerHistory]);

  const handleExcelImport = () => {
    if (!importText.trim()) return;
    
    const lines = importText.split('\n').filter(l => l.trim() !== '');
    const today = new Date().toISOString().split('T')[0];
    
    const extractedData = lines.map(line => {
      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(';');
      
      // Ignora linhas que pareçam ser cabeçalhos
      if (parts[0]?.toLowerCase().includes('matrícula') || parts[0]?.toLowerCase().includes('id')) return null;
      if (parts.length < 2) return null;
      
      return {
        customerId: parts[0]?.trim() || `MAT-${Math.floor(Math.random()*1000)}`,
        customerName: parts[1]?.trim() || 'Cliente Novo',
        address: parts[2]?.trim() || 'Endereço não informado',
        driverName: parts[3]?.trim() || 'A definir',
        boxQuantity: parseInt(parts[4]) || 1,
        status: DeliveryStatus.PENDING,
        branch: selectedBranch === 'all' ? 'sp-01' : selectedBranch,
        date: today,
        trackingCode: `TR-${Math.floor(1000 + Math.random() * 9000)}`
      };
    }).filter(Boolean);

    if (extractedData.length > 0) {
      onAddDeliveries(extractedData);
      setImportText('');
      setShowImportModal(false);
    } else {
      alert("Formato inválido. Certifique-se de copiar os dados da planilha corretamente.");
    }
  };

  const handleAiImport = async () => {
    if (!importText.trim()) return;
    setIsAiProcessing(true);
    try {
      const data = await GeminiService.parseSpreadsheetText(importText);
      if (data && data.length > 0) {
        onAddDeliveries(data);
        setShowImportModal(false);
        setImportText('');
      } else {
        alert("A IA não conseguiu identificar os dados. Tente o modo Planilha.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao processar com IA.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSendWhatsapp = () => {
    if (!whatsappModalTarget) return;
    const mapping = clientMappings.find(m => m.customerId === whatsappModalTarget.customerId);
    
    if (mapping && mapping.sellerPhone) {
      const cleanPhone = mapping.sellerPhone.replace(/\D/g, '');
      const message = `*SwiftLog:* Ocorreu um retorno do pedido para o cliente *${whatsappModalTarget.customerName}* (Cód: ${whatsappModalTarget.customerId}).\n\n*Motivo:* ${whatsappModalTarget.returnReason || 'Não especificado'}\n*Volumes:* ${whatsappModalTarget.boxQuantity} CX\n\nFavor verificar urgentemente.`;
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setWhatsappModalTarget(null);
    } else {
      alert("Vendedor ou Telefone não encontrado para este cliente. Verifique o Mapeamento Comercial.");
    }
  };

  const saveReturn = () => {
    if (!returnModalTarget) return;
    onUpdate(returnModalTarget.id!, { 
      status: DeliveryStatus.RETURNED, 
      returnReason, 
      returnNotes 
    });
    setReturnModalTarget(null);
    setReturnReason('');
    setReturnNotes('');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredDeliveries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredDeliveries.map(d => d.id!));
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      
      {/* Barra de Ações em Massa (Floating) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 border border-slate-700">
            <div className="flex items-center gap-3 pr-8 border-r border-slate-700">
              <span className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-black">{selectedIds.length}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Itens Selecionados</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { onBulkUpdate(selectedIds, DeliveryStatus.DELIVERED); setSelectedIds([]); }} className="px-5 py-2.5 bg-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700">Entregue</button>
              <button onClick={() => { onBulkUpdate(selectedIds, DeliveryStatus.IN_TRANSIT); setSelectedIds([]); }} className="px-5 py-2.5 bg-amber-600 rounded-xl text-[10px] font-black uppercase hover:bg-amber-700">Em Rota</button>
              <button onClick={() => { onBulkUpdate(selectedIds, DeliveryStatus.RETURNED); setSelectedIds([]); }} className="px-5 py-2.5 bg-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-700">Retornado</button>
              <button onClick={() => { if(window.confirm(`Excluir ${selectedIds.length} entregas?`)) { onDeleteDeliveries(selectedIds); setSelectedIds([]); } }} className="px-5 py-2.5 bg-slate-700 rounded-xl text-[10px] font-black uppercase">Excluir</button>
            </div>
            <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white p-2 transition-colors"><i className="fas fa-times text-lg"></i></button>
          </div>
        </div>
      )}

      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative w-full max-w-md">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Buscar por matrícula ou cliente..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            {['all', DeliveryStatus.PENDING, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.RETURNED, DeliveryStatus.D_PLUS_1].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${filter === s ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>{s === 'all' ? 'Todos' : s}</button>
            ))}
          </div>
          <button onClick={() => setOnlyCritical(!onlyCritical)} className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase border transition-all flex items-center gap-2 ${onlyCritical ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-md scale-105' : 'bg-white border-slate-200 text-slate-400 hover:border-rose-200'}`}>
            <i className="fas fa-user-shield text-sm"></i> Clientes Críticos
          </button>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setShowImportModal(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-indigo-100 flex items-center gap-3 hover:bg-indigo-700 hover:scale-105 transition-all">
            <i className="fas fa-file-import text-lg"></i> Importar em Massa
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 w-10 text-center"><input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === filteredDeliveries.length} onChange={toggleSelectAll} className="w-4 h-4 rounded border-slate-300 text-indigo-600" /></th>
              <th className="px-8 py-5">Matrícula</th>
              <th className="px-8 py-5">Cliente</th>
              <th className="px-8 py-5">Motorista</th>
              <th className="px-8 py-5 text-center">Volumes</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDeliveries.map((delivery) => {
              const reputation = customerHistory.find(h => h.customerId === delivery.customerId);
              const isSelected = selectedIds.includes(delivery.id!);
              return (
                <tr key={delivery.id} className={`group hover:bg-slate-50/80 transition-all ${isSelected ? 'bg-indigo-50/30' : ''} ${reputation ? 'border-l-4 border-rose-500' : ''}`}>
                  <td className="px-8 py-5 w-10 text-center"><input type="checkbox" checked={isSelected} onChange={() => setSelectedIds(prev => isSelected ? prev.filter(i => i !== delivery.id) : [...prev, delivery.id!])} className="w-4 h-4 rounded border-slate-300 text-indigo-600" /></td>
                  <td className="px-8 py-5 text-xs font-black text-indigo-600 uppercase tracking-tighter">{delivery.customerId}</td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1.5">{delivery.customerName}</p>
                    {reputation && (
                      <div className="flex items-center gap-1.5">
                        <i className="fas fa-triangle-exclamation text-rose-500 text-[10px]"></i>
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Base Crítica</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-600 uppercase italic opacity-70">{delivery.driverName || '---'}</td>
                  <td className="px-8 py-5 text-xs font-black text-center text-slate-800">{delivery.boxQuantity} CX</td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      delivery.status === DeliveryStatus.DELIVERED ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 
                      delivery.status === DeliveryStatus.RETURNED ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      delivery.status === DeliveryStatus.D_PLUS_1 ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm' :
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>{delivery.status}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {delivery.status === DeliveryStatus.RETURNED && (
                        <button onClick={() => setWhatsappModalTarget(delivery)} className="text-emerald-500 hover:scale-125 p-2 transition-all hover:bg-emerald-50 rounded-lg" title="Notificar Vendedor"><i className="fab fa-whatsapp text-lg"></i></button>
                      )}
                      <button onClick={() => setReturnModalTarget(delivery)} className="text-slate-300 hover:text-rose-600 p-2 transition-all hover:bg-rose-50 rounded-lg" title="Registrar Retorno"><i className="fas fa-rotate-left"></i></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DE IMPORTAÇÃO (SISTEMA EXCEL-LIKE) */}
      {showImportModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex gap-8">
                <button onClick={() => setImportMode('excel')} className={`text-[10px] font-black uppercase pb-3 border-b-2 transition-all tracking-widest ${importMode === 'excel' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Importação por Planilha</button>
                <button onClick={() => setImportMode('ai')} className={`text-[10px] font-black uppercase pb-3 border-b-2 transition-all tracking-widest ${importMode === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>IA Inteligente</button>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 transition-all p-2"><i className="fas fa-times text-xl"></i></button>
            </div>

            <div className="p-10 space-y-8">
              {importMode === 'excel' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><i className="fas fa-table-list text-xl"></i></div>
                    <div>
                       <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1">Como lançar em massa:</p>
                       <p className="text-[11px] font-bold text-indigo-600 leading-relaxed">Selecione suas colunas no Excel e cole abaixo. Ordem recomendada:<br/><span className="italic">MATRÍCULA ; NOME ; ENDEREÇO ; MOTORISTA ; VOLUMES</span></p>
                    </div>
                  </div>
                  <textarea 
                    value={importText} 
                    onChange={(e) => setImportText(e.target.value)} 
                    className="w-full h-80 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-xs font-mono resize-none focus:ring-8 focus:ring-indigo-500/10 transition-all outline-none" 
                    placeholder="Cole os dados aqui..." 
                  />
                  <button onClick={handleExcelImport} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Sincronizar Lote no Sistema</button>
                </div>
              )}
              {importMode === 'ai' && (
                <div className="space-y-6">
                  <textarea 
                    value={importText} 
                    onChange={(e) => setImportText(e.target.value)} 
                    className="w-full h-56 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-xs font-mono resize-none" 
                    placeholder="Cole texto bruto ou fragmentos de PDF aqui..." 
                  />
                  <button onClick={handleAiImport} disabled={isAiProcessing} className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-100 flex items-center justify-center gap-4 hover:bg-emerald-700 transition-all disabled:opacity-50">
                    {isAiProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-magic"></i>}
                    Processar com Inteligência Artificial
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO WHATSAPP */}
      {whatsappModalTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
               <i className="fab fa-whatsapp"></i>
            </div>
            <div>
               <h3 className="text-2xl font-black uppercase text-slate-800 tracking-tight mb-2">Notificar Vendedor</h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aviso de Devolução Operacional</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left">
               <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Destinatário Com mapeamento:</p>
               <p className="text-sm font-black text-slate-800 uppercase mb-1">{clientMappings.find(m => m.customerId === whatsappModalTarget.customerId)?.sellerName || 'Vendedor não definido'}</p>
               <p className="text-xs font-bold text-indigo-600">{clientMappings.find(m => m.customerId === whatsappModalTarget.customerId)?.sellerPhone || 'S/ telefone cadastrado'}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setWhatsappModalTarget(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200">Cancelar</button>
              <button onClick={handleSendWhatsapp} className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700">Enviar Aviso</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RETORNO */}
      {returnModalTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <div>
               <h3 className="text-2xl font-black uppercase text-slate-800 tracking-tight mb-2">Registrar Devolução</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ocorrência de Campo</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <p className="text-sm font-black text-slate-800 uppercase leading-none mb-1">{returnModalTarget.customerName}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volumes: {returnModalTarget.boxQuantity} CX</p>
            </div>
            <div className="space-y-4">
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full p-5 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase">
                <option value="">Selecione o motivo oficial...</option>
                {returnReasons.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
              </select>
              <textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold h-32 resize-none" placeholder="Detalhes adicionais do retorno..." />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setReturnModalTarget(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={saveReturn} disabled={!returnReason} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-100 disabled:opacity-50">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryList;
