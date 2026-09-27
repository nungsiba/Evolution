/* ═══════════════════════════════════════════════════════
   SUPABASE CLIENT
   Project: Kangleipung Evolution (backend for Version 1)
═══════════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://qdppxnuolvvkvxweurxc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcHB4bnVvbHZ2a3Z4d2V1cnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNTEwNTcsImV4cCI6MjEwNTcyNzA1N30.0uYiIcZCkuM0ywYG3bXQyCmSUBfROzSWEVCC5pdF1NA';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 15 } }
});
window._sb = sb;
