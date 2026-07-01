import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://oksiosigamvornwjtnnf.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_117UIXXAvXlNde0JKTgYeA_coQjlc8L";
export const MEDIA_BUCKET = "game-media";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
