
import React, { useState, useMemo } from 'react';
import { Delivery, DeliveryStatus, ReturnReason, CustomerReputation, ClientMapping } from '../types';
import { GeminiService } from '../services/geminiService';

interface DeliveryListProps {
  selectedBranch: string;
  deliveries: Delivery[];
  onUpdate: (id: string, updates: Partial<Delivery>) => void;
  onBulkUpdate: (ids: string[], status: DeliveryStatus) => void;
  onBulkUpdateDate?: (ids: string[], date: string) => void;
  onAddDeliveries: (deliveries: any[]) => void;
  onDeleteDeliveries: (ids: string[]) => void;
  returnReasons: ReturnReason[];
  customerHistory: CustomerReputation[];
  clientMappings: ClientMapping[];
}

const DeliveryList: React.FC<DeliveryListProps> = ({ 
  selectedBranch, deliveries, onUpdate, onBulkUpdate, onBulkUpdateDate, onAddDeliveries, onDeleteDeliveries, 
  returnReasons, customerHistory, clientMappings
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'bulk' | 'individual' | 'ai' | 'pdf'>('ai');
  const [importText, setImportText] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  // Edit & Individual Form states
  const [editTarget, setEditTarget] = useState<Delivery | null>(null);
  const [individualForm, setIndividualForm] = useState<Partial<Delivery>>({
    customerId: '', customerName: '', driverName: '', boxQuantity: 1
  });
  
  const [returnModalTarget, setReturnModalTarget] = useState<Delivery | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      const isCritical = customerHistory.some(h => h.customerId === d.customerId);
      const matchesBranch = selectedBranch === 'all' || d.branch === selectedBranch;
      const matchesStatus = filter === 'all' || d.status === filter;
      const matchesCritical = !onlyCritical || isCritical;
      
      const searchTerm = search.toLowerCase();
      const matchesSearch = search === '' || 
        d.customerName.toLowerCase().includes(searchTerm) || 
        d.customerId.toLowerCase().includes(searchTerm) ||
        d.driverName.toLowerCase().includes(searchTerm);
        
      return matchesBranch && matchesStatus && matchesSearch && matchesCritical;
    });
  }, [deliveries, selectedBranch, filter, search, onlyCritical, customerHistory]);

  const handleAiImport = async () => {
    if (!importText.trim()) return;
    setIsAiProcessing(true);
    try {
      const extractedData = await GeminiService.parseSpreadsheetText(importText);
      processExtractedData(extractedData);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar com IA.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handlePdfImport = async () => {
    if (!pdfFile) return;
    setIsAiProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const extractedData = await GeminiService.parseCustomerFile(base64, pdfFile.type);
        processExtractedData(extractedData);
      };
      reader.readAsDataURL(pdfFile);
    } catch (err) {
      console.error(err);
      alert("Erro ao processar PDF.");
    } finally {
      setIsAiProcessing(false);
    }
  };

  const processExtractedData = (data: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    if (data && data.length > 0) {
      const formatted = data.map((item: any) => ({
        ...item,
        customerId: item.customerId || `MAT-${Math.floor(Math.random() * 10000)}`,
        customerName: item.customerName || 'Cliente Importado',
        status: DeliveryStatus.PENDING,
        branch: selectedBranch === 'all' ? 'sp-01' : selectedBranch,
        date: today, // Força data de hoje
        boxQuantity: parseInt(item.boxQuantity || 1),
        address: item.address || 'Endereço não identificado'
      }));
      onAddDeliveries(formatted);
      setShowImportModal(false);
      setImportText('');
      setPdfFile(null);
    } else {
      alert("A IA não conseguiu identificar dados válidos no arquivo/texto.");
    }
  };

  const handleManualImport = () => {
    const today = new Date().toISOString().split('T')[0];
    if (importMode === 'bulk') {
      if (!importText.trim()) return;
      const lines = importText.split('\n').filter(l => l.trim());
      const newItems = lines.map(line => {
        const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(';');
        return {
          customerId: parts[0]?.trim() || `MAT-${Math.floor(Math.random() * 1000)}`,
          customerName: parts[1]?.trim() || 'Cliente Manual',
          driverName: parts[2]?.trim() || 'Motorista N/I',
          boxQuantity: parseInt(parts[3]) || 1,
          date: today, // Força data de hoje
          status: DeliveryStatus.PENDING,
          trackingCode: `MN-${Math.floor(1000 + Math.random() * 9000)}`,
          address: 'Endereço Manual',
          branch: selectedBranch === 'all' ? 'sp-01' : selectedBranch
        };
      });
      onAddDeliveries(newItems);
    } else {
      if (!individualForm.customerId || !individualForm.customerName) {
        alert("Preencha ao menos matrícula e nome.");
        return;
      }
      const newItem = {
        ...individualForm,
        status: DeliveryStatus.PENDING,
        date: today, // Força data de hoje
        trackingCode: `MN-${Math.floor(1000 + Math.random() * 9000)}`,
        address: individualForm.address || 'Endereço Manual',
        branch: selectedBranch === 'all' ? 'sp-01' : selectedBranch
      };
      onAddDeliveries([newItem as Delivery]);
    }
    setShowImportModal(false);
    setImportText('');
    setIndividualForm({ customerId: '', customerName: '', driverName: '', boxQuantity: 1 });
  };

  const handleBulkStatus = (status: DeliveryStatus) => {
    onBulkUpdate(selectedIds, status);
    setSelectedIds([]);
  };

  const handleBulkDateChange = (date: string) => {
    if (onBulkUpdateDate && date) {
      onBulkUpdateDate(selectedIds, date);
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Deseja excluir permanentemente ${selectedIds.length} registros?`)) {
      onDeleteDeliveries(selectedIds);
      setSelectedIds([]);
    }
  };

  const notifySeller = (delivery: Delivery) => {
    const mapping = clientMappings.find(m => m.customerId === delivery.customerId);
    if (!mapping || !mapping.sellerPhone) {
      alert("Nenhum vendedor vinculado a este cliente nas configurações.");
      return;
    }
    const message = `🚨 *AVISO DE RETORNO - SWIFTLOG*\n\n` +
                    `*Matrícula:* ${delivery.customerId}\n` +
                    `*Cliente:* ${delivery.customerName}\n` +
                    `*Motorista:* ${delivery.driverName}\n` +
                    `*Volumes:* ${delivery.boxQuantity} CX\n\n` +
                    `*Motivo do Retorno:* ${delivery.returnReason || 'Não informado'}\n` +
                    `*Obs:* ${delivery.returnNotes || '---'}\n\n` +
                    `_Por favor, entrar em contato com o cliente._`;
                    
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${mapping.sellerPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  const saveReturn = () => {
    if (!returnModalTarget || !returnReason) return;
    onUpdate(returnModalTarget.id, { status: DeliveryStatus.RETURNED, returnReason, returnNotes });
    setReturnModalTarget(null); setReturnReason(''); setReturnNotes('');
  };

  const saveEdit = () => {
    if (!editTarget) return;
    onUpdate(editTarget.id, editTarget);
    setEditTarget(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative">
      {/* Barra de Ações em Massa */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-slate-900 text-white px-8 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-6 border border-slate-700">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 pr-6 border-r border-slate-700">{selectedIds.length} Selecionados</span>
            <div className="flex gap-2 items-center">
              <button onClick={() => handleBulkStatus(DeliveryStatus.DELIVERED)} className="px-4 py-2 bg-emerald-600 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700">Entregue</button>
              <button onClick={() => handleBulkStatus(DeliveryStatus.IN_TRANSIT)} className="px-4 py-2 bg-amber-600 rounded-xl text-[10px] font-black uppercase hover:bg-amber-700">Rota</button>
              <button onClick={() => handleBulkStatus(DeliveryStatus.PENDING)} className="px-4 py-2 bg-slate-700 rounded-xl text-[10px] font-black uppercase hover:bg-slate-600">Pendente</button>
              
              <div className="flex items-center gap-2 border-l border-slate-700 pl-4 ml-2">
                <span className="text-[9px] font-black uppercase text-slate-400">Alterar Data:</span>
                <input 
                  type="date" 
                  className="bg-slate-800 text-white text-[10px] font-bold rounded-lg border-none px-2 py-1 outline-none" 
                  onChange={(e) => handleBulkDateChange(e.target.value)}
                />
              </div>

              <button onClick={handleBulkDelete} className="px-4 py-2 bg-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-700 ml-4">Excluir</button>
            </div>
            <button onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white p-2"><i className="fas fa-times"></i></button>
          </div>
        </div>
      )}

      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full max-w-sm">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" placeholder="Matrícula, cliente ou motorista..." className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             {['all', DeliveryStatus.PENDING, DeliveryStatus.IN_TRANSIT, DeliveryStatus.DELIVERED, DeliveryStatus.RETURNED].map(s => (
               <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>{s === 'all' ? 'Todos' : s}</button>
             ))}
          </div>
          <button onClick={() => setOnlyCritical(!onlyCritical)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center gap-2 ${onlyCritical ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-400'}`}>
            <i className="fas fa-user-shield"></i> Críticos
          </button>
        </div>
        <button onClick={() => setShowImportModal(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
          <i className="fas fa-plus-circle"></i> Inserir Clientes
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4 w-10"><input type="checkbox" checked={selectedIds.length === filteredDeliveries.length && filteredDeliveries.length > 0} onChange={() => setSelectedIds(selectedIds.length === filteredDeliveries.length ? [] : filteredDeliveries.map(d => d.id))} /></th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Matrícula</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Motorista</th>
              <th className="px-6 py-4 text-center">Volumes</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDeliveries.map((delivery) => {
              const reputation = customerHistory.find(h => h.customerId === delivery.customerId);
              return (
                <tr key={delivery.id} className={`hover:bg-slate-50 transition-colors ${reputation ? 'border-l-4 border-rose-500 bg-rose-50/10' : ''}`}>
                  <td className="px-6 py-4 w-10"><input type="checkbox" checked={selectedIds.includes(delivery.id)} onChange={() => setSelectedIds(prev => prev.includes(delivery.id) ? prev.filter(i => i !== delivery.id) : [...prev, delivery.id])} /></td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{delivery.date}</td>
                  <td className="px-6 py-4 text-xs font-black text-indigo-600 uppercase">{delivery.customerId}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-800 uppercase">{delivery.customerName}</p>
                      {reputation && <i className={`fas fa-triangle-exclamation ${reputation.riskLevel === 'high' ? 'text-rose-500' : 'text-amber-500'} animate-pulse text-[10px]`}></i>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">{delivery.driverName}</td>
                  <td className="px-6 py-4 text-xs font-black text-center">{delivery.boxQuantity} cx</td>
                  <td className="px-6 py-4">
                    <span onClick={() => { if(delivery.status !== DeliveryStatus.RETURNED) setReturnModalTarget(delivery) }} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase cursor-pointer ${delivery.status === DeliveryStatus.RETURNED ? 'bg-slate-900 text-white' : delivery.status === DeliveryStatus.DELIVERED ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>{delivery.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                    {delivery.status === DeliveryStatus.RETURNED && (
                      <button onClick={() => notifySeller(delivery)} className="text-emerald-500 hover:text-emerald-600 p-2 transition-transform hover:scale-110">
                        <i className="fab fa-whatsapp text-lg"></i>
                      </button>
                    )}
                    <button onClick={() => setEditTarget(delivery)} className="text-slate-400 hover:text-indigo-600 p-2" title="Editar"><i className="fas fa-edit"></i></button>
                    <button onClick={() => { if(window.confirm("Excluir?")) onDeleteDeliveries([delivery.id]) }} className="text-slate-300 hover:text-rose-600 p-2"><i className="fas fa-trash-can"></i></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: IMPORTAÇÃO E INSERÇÃO */}
      {showImportModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                <button onClick={() => setImportMode('ai')} className={`text-[10px] font-black uppercase border-b-2 pb-2 transition-all tracking-widest whitespace-nowrap ${importMode === 'ai' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}>IA Smart Import</button>
                <button onClick={() => setImportMode('pdf')} className={`text-[10px] font-black uppercase border-b-2 pb-2 transition-all tracking-widest whitespace-nowrap ${importMode === 'pdf' ? 'border-rose-500 text-rose-500' : 'border-transparent text-slate-400'}`}>PDF Import</button>
                <button onClick={() => setImportMode('bulk')} className={`text-[10px] font-black uppercase border-b-2 pb-2 transition-all tracking-widest whitespace-nowrap ${importMode === 'bulk' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Em Massa</button>
                <button onClick={() => setImportMode('individual')} className={`text-[10px] font-black uppercase border-b-2 pb-2 transition-all tracking-widest whitespace-nowrap ${importMode === 'individual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>Individual</button>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            {importMode === 'ai' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                   <i className="fas fa-robot text-emerald-600 text-xl"></i>
                   <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Cole qualquer texto bagunçado abaixo. A IA Gemini irá organizar as colunas automaticamente para a data de hoje.</p>
                </div>
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-mono resize-none focus:ring-4 focus:ring-emerald-500/10" placeholder="Cole aqui os dados copiados..." />
                <button onClick={handleAiImport} disabled={isAiProcessing || !importText} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                  {isAiProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                  {isAiProcessing ? 'Processando Inteligência...' : 'Extrair e Salvar'}
                </button>
              </div>
            )}

            {importMode === 'pdf' && (
              <div className="space-y-4">
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center gap-3">
                   <i className="fas fa-file-pdf text-rose-600 text-xl"></i>
                   <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">Selecione um PDF. Os dados serão extraídos automaticamente para a data de hoje.</p>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:border-rose-300 transition-all cursor-pointer bg-slate-50" onClick={() => document.getElementById('pdfInput')?.click()}>
                  {pdfFile ? (
                    <div className="flex flex-col items-center">
                      <i className="fas fa-file-pdf text-4xl text-rose-500 mb-2"></i>
                      <p className="text-sm font-black text-slate-800 uppercase">{pdfFile.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); setPdfFile(null); }} className="text-[10px] text-rose-500 font-bold uppercase mt-2">Remover Arquivo</button>
                    </div>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt text-4xl text-slate-300 mb-2"></i>
                      <p className="text-sm font-bold text-slate-500 uppercase">Clique para selecionar PDF</p>
                    </>
                  )}
                  <input type="file" id="pdfInput" hidden accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                </div>
                <button onClick={handlePdfImport} disabled={isAiProcessing || !pdfFile} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3">
                  {isAiProcessing ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-robot"></i>}
                  {isAiProcessing ? 'Lendo Documento...' : 'Importar Lista do PDF'}
                </button>
              </div>
            )}

            {importMode === 'bulk' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                  <span>Layout de Colunas (Data será HOJE)</span>
                  <span className="text-indigo-500">Matrícula ; Cliente ; Motorista ; Volumes</span>
                </div>
                <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full h-64 p-5 bg-slate-50 border border-slate-200 rounded-3xl text-xs font-mono resize-none" placeholder="MAT-101 ; João Silva ; Márcio ; 10" />
                <button onClick={handleManualImport} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Processar Manual</button>
              </div>
            )}

            {importMode === 'individual' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Matrícula</label><input value={individualForm.customerId} onChange={e => setIndividualForm({...individualForm, customerId: e.target.value})} className="w-full p-4 rounded-2xl border font-bold text-sm bg-slate-50" /></div>
                <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Volumes (CX)</label><input type="number" value={individualForm.boxQuantity} onChange={e => setIndividualForm({...individualForm, boxQuantity: parseInt(e.target.value)})} className="w-full p-4 rounded-2xl border font-bold text-sm bg-slate-50" /></div>
                <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Nome do Cliente</label><input value={individualForm.customerName} onChange={e => setIndividualForm({...individualForm, customerName: e.target.value})} className="w-full p-4 rounded-2xl border font-bold text-sm uppercase bg-slate-50" /></div>
                <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 mb-2 block ml-1">Motorista</label><input value={individualForm.driverName} onChange={e => setIndividualForm({...individualForm, driverName: e.target.value})} className="w-full p-4 rounded-2xl border font-bold text-sm uppercase bg-slate-50" /></div>
                <p className="col-span-2 text-[9px] font-bold text-slate-400 uppercase text-center mt-2 italic">A data será definida automaticamente para HOJE. Você pode editá-la em massa na lista.</p>
                <button onClick={handleManualImport} className="col-span-2 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Salvar Registro</button>
              </div>
            )}
          </div>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 space-y-6">
            <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">Editar Entrega</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Matrícula</label><input value={editTarget.customerId} onChange={e => setEditTarget({...editTarget, customerId: e.target.value})} className="w-full p-3 rounded-xl border font-bold text-xs bg-slate-50" /></div>
              <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Volumes</label><input type="number" value={editTarget.boxQuantity} onChange={e => setEditTarget({...editTarget, boxQuantity: parseInt(e.target.value)})} className="w-full p-3 rounded-xl border font-bold text-xs bg-slate-50" /></div>
              <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Cliente</label><input value={editTarget.customerName} onChange={e => setEditTarget({...editTarget, customerName: e.target.value})} className="w-full p-3 rounded-xl border font-bold text-xs uppercase bg-slate-50" /></div>
              <div className="col-span-2"><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Motorista</label><input value={editTarget.driverName} onChange={e => setEditTarget({...editTarget, driverName: e.target.value})} className="w-full p-3 rounded-xl border font-bold text-xs uppercase bg-slate-50" /></div>
              <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Data</label><input type="date" value={editTarget.date} onChange={e => setEditTarget({...editTarget, date: e.target.value})} className="w-full p-3 rounded-xl border font-bold text-xs bg-slate-50" /></div>
              <div className="col-span-1"><label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Filial</label><input value={editTarget.branch} onChange={e => setEditTarget({...editTarget, branch: e.target.value})} className="w-full p-3 rounded-xl border font-bold text-xs uppercase bg-slate-50" /></div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setEditTarget(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
              <button onClick={saveEdit} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px]">Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}

      {returnModalTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 space-y-6 animate-in zoom-in-95">
            <h3 className="text-lg font-black uppercase text-slate-800 tracking-tight">Registrar Retorno</h3>
            <p className="text-[10px] font-bold text-slate-400 -mt-4 uppercase">Cliente: {returnModalTarget.customerName}</p>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Motivo do Retorno</label>
              <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold uppercase cursor-pointer">
                <option value="">Selecione o motivo...</option>
                {returnReasons.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Notas Internas</label>
              <textarea value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm h-32 resize-none" placeholder="Detalhes para o vendedor..." />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setReturnModalTarget(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancelar</button>
              <button onClick={saveReturn} disabled={!returnReason} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-700 disabled:opacity-50 transition-all">Confirmar Ocorrência</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryList;
