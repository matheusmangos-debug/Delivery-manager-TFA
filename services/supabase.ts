
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE - SWIFTLOG PRO
 * -------------------------
 * Integração Realtime Ativada com as credenciais oficiais do projeto.
 */

const SUPABASE_URL = 'https://cpxtorqsurwquxycmxzg.supabase.co';

/**
 * Chave Anon Key (JWT) oficial do projeto cpxtorqsurwquxycmxzg.
 * Esta chave permite a comunicação segura com a API do Supabase.
 */
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNweHRvcnFzdXJ3cXV4eWNteHpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNDEwODEsImV4cCI6MjA4NjgxNzA4MX0.44CB0Avxk5n33B-fDYfEOSUN0bqg7iTnu-7qLnSRvJQ'; 

// O sistema valida se a chave é um JWT válido para habilitar o modo Online.
export const isSupabaseConfigured = SUPABASE_ANON_KEY.startsWith('eyJ');

// Inicialização do cliente Supabase
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

// Interface de acesso ao banco para as tabelas do sistema
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
