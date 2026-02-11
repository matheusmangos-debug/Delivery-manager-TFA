
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  existingUsers: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister, existingUsers }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Operador de Logística');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulação de delay para feedback visual
    setTimeout(() => {
      if (mode === 'login') {
        const user = existingUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (user) {
          onLogin(user);
        } else {
          setError('Email ou senha incorretos. Apenas usuários cadastrados podem acessar.');
          setIsLoading(false);
        }
      } else {
        // Modo Cadastro
        const emailExists = existingUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (emailExists) {
          setError('Este email já está cadastrado no sistema.');
          setIsLoading(false);
        } else if (password.length < 4) {
          setError('A senha deve ter pelo menos 4 caracteres.');
          setIsLoading(false);
        } else if (name.trim().length < 3) {
          setError('O nome deve ser preenchido corretamente.');
          setIsLoading(false);
        } else {
          const newUser: User = {
            id: `U-${Math.random().toString(36).substr(2, 9)}`,
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role,
            avatar: `https://picsum.photos/seed/${email}/100`
          };
          onRegister(newUser);
        }
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse delay-700"></div>

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-6 shadow-xl shadow-indigo-200 rotate-3 transition-transform hover:rotate-0 cursor-default">
              <i className="fas fa-box-open"></i>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">SwiftLog <span className="text-indigo-600">Pro</span></h1>
            <p className="text-slate-400 font-bold text-[10px] mt-2 uppercase tracking-[0.2em]">Gestão Operacional & Inteligência</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="animate-in slide-in-from-left-4 duration-300">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nome Completo</label>
                <div className="relative">
                  <i className="fas fa-id-card absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-sm text-slate-700"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>
            )}

            <div className="animate-in slide-in-from-left-4 duration-300 delay-75">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email / Usuário</label>
              <div className="relative">
                <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-sm text-slate-700"
                  placeholder="exemplo@log.com"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="animate-in slide-in-from-left-4 duration-300 delay-100">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Cargo / Função</label>
                <div className="relative">
                  <i className="fas fa-user-tag absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-sm text-slate-700 appearance-none cursor-pointer"
                  >
                    <option>Operador de Logística</option>
                    <option>Gerente de Operações</option>
                    <option>Administrador</option>
                    <option>Faturamento</option>
                  </select>
                </div>
              </div>
            )}

            <div className="animate-in slide-in-from-left-4 duration-300 delay-150">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Senha</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all font-bold text-sm text-slate-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 text-[10px] font-black p-3 rounded-xl border border-rose-100 animate-in shake duration-300 flex items-center gap-2 uppercase tracking-tight">
                <i className="fas fa-exclamation-circle text-sm"></i>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:hover:scale-100 mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <i className="fas fa-circle-notch animate-spin"></i>
              ) : (
                mode === 'login' ? 'Acessar Sistema' : 'Criar minha Conta'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <button 
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors"
            >
              {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já possui conta? Faça Login'}
            </button>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight italic">
              Ambiente Seguro & Criptografado
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-[9px] mt-8 font-black uppercase tracking-[0.3em] opacity-40">
          © 2024 SwiftLog Logistics Systems
        </p>
      </div>
    </div>
  );
};

export default Login;
