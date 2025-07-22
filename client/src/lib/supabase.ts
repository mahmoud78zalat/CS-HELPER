import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://acejnylzjlfnchiajiyv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZWpueWx6amxmbmNoaWFqaXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTM5MTMsImV4cCI6MjA2ODY2OTkxM30.J-f34PcKpjpPJV60qzRtvDzQGYM9jtiPyb62b6eVKi4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);