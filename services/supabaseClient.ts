import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xdukqkzwcqsqwogwyqkh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkdWtxa3p3Y3FzcXdvZ3d5cWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzcwMjEsImV4cCI6MjA3NzM1MzAyMX0.dJxrf84MmWFfULQ-pvLfk5XZkriKrzDLtId8wojrJhs';

// Export the client directly, but it can be null if credentials are not provided.
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.error("Supabase URL and Key must be provided in environment variables. Backend functionality will be disabled.");
}