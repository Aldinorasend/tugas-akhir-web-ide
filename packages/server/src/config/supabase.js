import { createClient } from '@supabase/supabase-js';
import './env.js'; // load .env dari root monorepo

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);