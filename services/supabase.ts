
import { createClient } from '@supabase/supabase-js';

// URL do seu projeto Supabase (CORRETA)
const SUPABASE_URL = 'https://cpxtorqsurwquxycmxzg.supabase.co';

/**
 * AVISO IMPORTANTE: 
 * A chave que você forneceu anteriormente ('sb_publishable...') é do STRIPE.
 * O Supabase não aceitará essa chave. 
 * Você deve buscar a chave que começa com 'eyJ...' em:
 * Project Settings > API > anon (public)
 */
const SUPABASE_ANON_KEY = 'sb_publishable__X_ayE62nu5SQ9u2F2xMFw_xAIQFUcF'; // SUBSTITUA POR UMA QUE COMECE COM 'eyJ'

if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  console.error("ERRO DE CONEXÃO: A chave 'SUPABASE_ANON_KEY' é inválida. Ela deve começar com 'eyJ'. O sistema não conseguirá salvar dados até que isso seja corrigido.");
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
