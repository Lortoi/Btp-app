// Standard CORS headers for Supabase Edge Functions.
// Used by every function callable from the browser.
//
// `Access-Control-Allow-Origin: *` is fine here because every request must
// also carry a valid Supabase JWT (`Authorization: Bearer ...`). The JWT is
// the actual security boundary, not the origin.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
} as const;
