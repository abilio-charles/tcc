import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jzhoicypygjcpiormlpp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6aG9pY3lweWdqY3Bpb3JtbHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MjI4ODgsImV4cCI6MjA5NDI5ODg4OH0.B50p5iLcrRsuo2y3iCrkEHO6m2Qs0pctvDtTfhAxHNk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);