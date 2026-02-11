
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';

interface AISectionProps {
  hasProAccess: boolean;
  onOpenKey: () => void;
}

const AISection: React.FC<AISectionProps> = ({ hasProAccess, onOpenKey }) => {
  const [activeTool, setActiveTool] = useState<'chat' | 'gen' | 'edit'>('chat');
  
  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gen State
  const [genPrompt, setGenPrompt] = useState('');
  const [genSize, setGenSize] = useState<"1K" | "2K" | "4K">("1K");
  const [genResult, setGenResult] = useState<string | null>(null);
  const [isGenLoading, setIsGenLoading] = useState(false);

  // Edit State
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [editResult, setEditResult] = useState<string | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const response = await GeminiService.chatWithAssistant(userMsg, chatHistory);
      setChatHistory(prev => [...prev, { role: 'ai', text: response || 'Desculpe, tive um problema ao responder.' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    setIsGenLoading(true);
    setGenResult(null);

    try {
      const img = await GeminiService.generateMarketingImage(genPrompt, genSize);
      setGenResult(img);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar imagem. Tente novamente.');
    } finally {
      setIsGenLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setEditPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!editPreview || !editPrompt.trim()) return;
    setIsEditLoading(true);
    setEditResult(null);

    try {
      const img = await GeminiService.editImage(editPreview, editPrompt);
      setEditResult(img);
    } catch (err) {
      console.error(err);
      alert('Erro ao editar imagem.');
    } finally {
      setIsEditLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] gap-6">
      {/* Sidebar Tools */}
      <div className="w-full lg:w-64 space-y-2">
        <button 
          onClick={() => setActiveTool('chat')}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${activeTool === 'chat' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
        >
          <i className="fas fa-comment-dots"></i>
          <span className="font-bold">Assistente AI</span>
        </button>
        <button 
          onClick={() => setActiveTool('gen')}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${activeTool === 'gen' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
        >
          <i className="fas fa-magic"></i>
          <span className="font-bold">Gerar Imagens</span>
        </button>
        <button 
          onClick={() => setActiveTool('edit')}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${activeTool === 'edit' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
        >
          <i className="fas fa-wand-sparkles"></i>
          <span className="font-bold">Editor de IA</span>
        </button>

        <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <h4 className="text-indigo-800 font-bold text-sm mb-2">Poder da Gemini</h4>
          <p className="text-xs text-indigo-600 leading-relaxed">
            Utilize modelos de última geração para automação de processos, marketing e suporte.
          </p>
        </div>
      </div>

      {/* Workspace */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        {activeTool === 'chat' && (
          <div className="flex flex-col h-full">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto opacity-40">
                  <i className="fas fa-robot text-5xl mb-4"></i>
                  <h3 className="text-xl font-bold">Como posso ajudar?</h3>
                  <p className="text-sm">Tire dúvidas sobre suas entregas, peça sugestões de rotas ou relatórios personalizados.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-100 text-slate-800 shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleChat} className="p-4 border-t border-slate-100 flex gap-3">
              <input 
                type="text" 
                placeholder="Pergunte qualquer coisa..."
                className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button disabled={isChatLoading} className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50">
                <i className="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        )}

        {activeTool === 'gen' && (
          <div className="p-8 h-full overflow-y-auto">
            {!hasProAccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 text-3xl">
                  <i className="fas fa-lock"></i>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Acesso Pro Necessário</h3>
                  <p className="text-slate-500 max-w-md mx-auto mt-2">
                    A geração de imagens 4K com Gemini 3 Pro requer uma chave de API paga.
                  </p>
                </div>
                <button 
                  onClick={onOpenKey}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:scale-105 transition-transform"
                >
                  Selecionar Chave de API
                </button>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800">Criar Material de Marketing</h3>
                  <textarea 
                    className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    placeholder="Descreva a imagem que deseja criar... Ex: Um caminhão de entrega moderno em uma cidade futurista ao pôr do sol."
                    value={genPrompt}
                    onChange={(e) => setGenPrompt(e.target.value)}
                  ></textarea>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-500">Qualidade:</span>
                    {(['1K', '2K', '4K'] as const).map(size => (
                      <button 
                        key={size}
                        onClick={() => setGenSize(size)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${genSize === size ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        {size}
                      </button>
                    ))}
                    <div className="flex-1"></div>
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenLoading || !genPrompt}
                      className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isGenLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-sparkles"></i>}
                      Gerar Agora
                    </button>
                  </div>
                </div>

                {genResult && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                      <img src={genResult} alt="Generated" className="w-full h-auto object-cover" />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-200">
                        <i className="fas fa-download"></i> Download
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700">
                        <i className="fas fa-share"></i> Usar na Campanha
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTool === 'edit' && (
          <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800">1. Upload da Foto</h3>
                  <div 
                    className={`aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${editPreview ? 'border-indigo-400 bg-indigo-50/10' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                    onClick={() => document.getElementById('fileInput')?.click()}
                  >
                    {editPreview ? (
                      <img src={editPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <i className="fas fa-cloud-upload-alt text-3xl text-slate-300 mb-2"></i>
                        <p className="text-sm text-slate-400">Clique para selecionar</p>
                      </>
                    )}
                    <input type="file" id="fileInput" hidden onChange={handleFileChange} accept="image/*" />
                  </div>
                </div>

                {/* Instruction Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800">2. Instrução IA</h3>
                  <div className="space-y-3">
                    <textarea 
                      className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                      placeholder="Ex: Adicione um filtro retrô, remova o fundo ou adicione uma logo na caixa."
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                    ></textarea>
                    <button 
                      onClick={handleEdit}
                      disabled={isEditLoading || !editPreview || !editPrompt}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isEditLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-magic"></i>}
                      Processar Edição
                    </button>
                  </div>
                </div>
              </div>

              {editResult && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-xl font-bold text-slate-800">Resultado</h3>
                  <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                    <img src={editResult} alt="Edited" className="w-full h-auto object-cover" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISection;
