import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const ENV_OK = Boolean(url && key);

// 不要 throw；缺 env 时导出 null，并由上层 UI 做降级处理
export const supabase: SupabaseClient<Database> | null = ENV_OK ? createClient<Database>(url!, key!, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
}) : null;

if (!ENV_OK) {
  // 仅日志提示，确保应用仍能渲染
  // eslint-disable-next-line no-console
  console.error('Supabase ENV missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
}
