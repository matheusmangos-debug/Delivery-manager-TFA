
import { createClient } from '@supabase/supabase-js';

// URL do projeto atualizada conforme solicitado
const SUPABASE_URL = 'https://cpxtorqsurwquxycmxzg.supabase.co';

// Chave ANON KEY atualizada conforme fornecido (Nota: Chaves Supabase geralmente começam com 'eyJ')
const SUPABASE_ANON_KEY = 'sb_publishable__X_ayE62nu5SQ9u2F2xMFw_xAIQFUcF';

if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  console.warn("AVISO: A chave fornecida não parece ser uma chave válida do Supabase (JWT). Se o sistema não conectar, verifique a chave 'anon public' no painel do Supabase.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const db = {
  deliveries: () => supabase.from('deliveries'),
  users: () => supabase.from('users'),
  branches: () => supabase.from('branches'),
  drivers: () => supabase.from('drivers'),
  vehicles: () => supabase.from('vehicles'),
  reasons: () => supabase.from('return_reasons'),
  critical_base: () => supabase.from('customer_reputation'),
  mappings: () => supabase.from('client_mappings')
};
