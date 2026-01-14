// supabase.js
// This file should be loaded BEFORE any other custom scripts that use Supabase

const SUPABASE_URL = "https://sdicmtmcanvswsisihqb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pAMpbQ_ZpucKn9X8xgQUdA_as-rPsa7";

// Use a distinct global name to avoid conflict with the library's own 'supabase'
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('supabase.js loaded → client ready as window.supabaseClient');
