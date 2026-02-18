
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE - PROJETO ATUALIZADO
 * Project: rvzcixwhkkrlnesbcdke
 */

const SUPABASE_URL = 'https://rvzcixwhkkrlnesbcdke.supabase.co';

/**
 * Chave fornecida pelo usuário. 
 * Nota: Se o status for offline, confirme se esta é a 'Anon Key' do painel API.
 */
const SUPABASE_ANON_KEY = 'sb_publishable_sq-FD_5lsQ7Qol6Iv3DyCQ_PLBNfg5s'; 

export const isSupabaseConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('YOUR_');

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
