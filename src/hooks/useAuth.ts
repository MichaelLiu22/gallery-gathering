import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };

// Auth hook implementation with better error handling
export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: authData, error } = await supabase.auth.getSession();
        const session = authData?.session;
        
        if (error) {
          console.error('Error getting session:', error);
          setError('无法获取登录会话，请重新登录');
        } else if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Network error getting session:', err);
        setError('网络连接问题，请检查网络后重试');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    const { data: authStateData } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            
            // Clear errors on successful auth state change
            if (session) {
              setError(null);
            }
          }
        } catch (err) {
          console.error('Error in auth state change:', err);
          setError('认证状态更新失败');
        }
      }
    );

    return () => {
      mounted = false;
      authStateData?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message === 'Invalid login credentials' ? '邮箱或密码错误' : error.message);
      }

      return { error };
    } catch (err) {
      const message = '网络连接问题，请重试';
      setError(message);
      return { error: { message, name: 'NetworkError' } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }

      return { error };
    } catch (err) {
      const message = '网络连接问题，请重试';
      setError(message);
      return { error: { message, name: 'NetworkError' } as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        setError('退出登录失败');
      }
    } catch (err) {
      console.error('Network error during sign out:', err);
      setError('网络连接问题');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };
};
