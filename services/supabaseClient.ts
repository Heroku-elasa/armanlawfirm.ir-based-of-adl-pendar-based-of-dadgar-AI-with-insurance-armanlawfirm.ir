
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lq71kq44ui7.academic.edu.rs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxNzFrcTQ0dWk3YWNhZGVtaWMuZWR1LnJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3Nzc3NjAsImV4cCI6MjA0OTM1Mzc2MH0.p3dJqWqY8zK9vX2mN5lP7rT9uV1cF4hJ8nQ2sL6tY9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
