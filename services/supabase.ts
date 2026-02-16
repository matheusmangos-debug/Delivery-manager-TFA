
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE
 * -------------------------
 * URL: https://cpxtorqsurwquxycmxzg.supabase.co
 * NOTA: Chaves que iniciam com 'sb_publishable' são comumente associadas ao Stripe. 
 * Para o Supabase, certifique-se de usar a 'anon public' key encontrada em Settings -> API.
 */

const SUPABASE_URL = 'https://cpxtorqsurwquxycmxzg.supabase.co';

// Chave fornecida pelo usuário
const SUPABASE_ANON_KEY = 'sb_publishable__X_ayE62nu5SQ9u2F2xMFw_xAIQFUcF'; 

// Validações de integridade - Ajustado para aceitar a nova chave
export const isSupabaseConfigured = SUPABASE_ANON_KEY.length > 10;
export const isUsingStripeKey = SUPABASE_ANON_KEY.startsWith('sb_');

// Inicialização do cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Interface de acesso ao banco (Tabelas do Schema SwiftLog Pro)
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
