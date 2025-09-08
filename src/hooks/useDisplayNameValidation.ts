import { supabase } from '@/lib/supabaseClient';

export const checkDisplayNameAvailability = async (displayName: string): Promise<boolean> => {
  if (!displayName.trim()) return false;
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('display_name', displayName.trim())
      .maybeSingle();
    
    if (error) {
      console.error('Error checking display name:', error);
      return false;
    }
    
    // Return true if no user found (name is available)
    return data === null;
  } catch (error) {
    console.error('Error checking display name availability:', error);
    return false;
  }
};

export const validateDisplayName = (displayName: string): { valid: boolean; message?: string } => {
  if (!displayName.trim()) {
    return { valid: false, message: '昵称不能为空' };
  }
  
  if (displayName.length < 2) {
    return { valid: false, message: '昵称至少需要2个字符' };
  }
  
  if (displayName.length > 20) {
    return { valid: false, message: '昵称不能超过20个字符' };
  }
  
  // Check for invalid characters (allow letters, numbers, Chinese characters, and some symbols)
  const validPattern = /^[a-zA-Z0-9\u4e00-\u9fa5_\-\.]+$/;
  if (!validPattern.test(displayName)) {
    return { valid: false, message: '昵称只能包含字母、数字、中文、下划线、横线和点号' };
  }
  
  return { valid: true };
};