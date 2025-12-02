
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vemzvvveaseghlhjmnqy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbXp2dnZlYXNlZ2hsaGptbnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODc4MzMsImV4cCI6MjA4MDI2MzgzM30._R_4_XpDmo9KVr1UhM6UJqLwAwAdtjF1kmKtIr827zY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
