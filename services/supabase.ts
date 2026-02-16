
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE - SWIFTLOG PRO
 * -------------------------
 * Integração Realtime Ativada
 * Nota: Certifique-se de que a chave ANON seja a 'Public Anon' do dashboard do Supabase.
 */

const SUPABASE_URL = 'https://cpxtorqsurwquxycmxzg.supabase.co';
// Chave enviada pelo usuário
const SUPABASE_ANON_KEY = 'sb_publishable__X_ayE62nu5SQ9u2F2xMFw_xAIQFUcF'; 

// Validação de configuração
export const isSupabaseConfigured = SUPABASE_ANON_KEY.length > 20;

// Inicialização segura do cliente
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Interface de acesso ao banco (Mapeamento completo das tabelas do SQL Editor)
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
