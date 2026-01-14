// supabase.js
// Load this AFTER the CDN script in HTML

console.log('supabase.js: initializing client...');

const SUPABASE_URL = "https://sdicmtmcanvswsisihqb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pAMpbQ_ZpucKn9X8xgQUdA_as-rPsa7";

// Use a distinct name to avoid overwriting the CDN's 'supabase' module
window.mySupabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Quick test log
console.log('supabase.js: client initialized?', !!window.mySupabaseClient?.from);

if (!window.mySupabaseClient?.from) {
  console.error('supabase.js: Failed to create client - check URL/key or CDN load order');
}
