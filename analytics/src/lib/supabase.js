import { createClient } from '@supabase/supabase-js';
export const initialAuthFlow=typeof window==='undefined'?null:(new URLSearchParams(window.location.hash.slice(1)).get('type')||new URLSearchParams(window.location.search).get('type'));
const url=import.meta.env.VITE_SUPABASE_URL;
const publicKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase=url&&publicKey?createClient(url,publicKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
