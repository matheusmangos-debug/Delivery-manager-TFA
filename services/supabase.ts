
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rvzcixwhkkrlnesbcdke.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sq-FD_5lsQ7Qol6Iv3DyCQ_PLBNfg5s';

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
