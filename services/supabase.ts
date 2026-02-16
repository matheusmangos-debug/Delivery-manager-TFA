
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE
 * -------------------------
 * URL: https://cpxtorqsurwquxycmxzg.supabase.co
 * STATUS: CONECTADO (Chave válida detectada)
 */

const SUPABASE_URL = 'https://cpxtorqsurwquxycmxzg.supabase.co';

// Chave válida fornecida pelo usuário
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNweHRvcnFzdXJ3cXV4eWNteHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDEwODEsImV4cCI6MjA4NjgxNzA4MX0.44CB0Avxk5n33B-fDYfEOSUN0bqg7iTnu-7qLnSRvJQ'; 

// Validações de integridade
export const isSupabaseConfigured = SUPABASE_ANON_KEY.startsWith('eyJ');
export const isUsingStripeKey = SUPABASE_ANON_KEY.startsWith('sb_');

// Inicialização do cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Interface de acesso ao banco
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
