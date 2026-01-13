console.log('supabase.js loaded');

const SUPABASE_URL = 'https://sdicmtmcanvswsisihqb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pAMpbQ_ZpucKn9X8xgQUdA_as-rPsa7';

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
