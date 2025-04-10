// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ckmdnjtmeegctemzdpit.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;  // ใช้ REACT_APP_SUPABASE_KEY จาก .env
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };  // ส่งออก supabase เพื่อใช้ในไฟล์อื่น
