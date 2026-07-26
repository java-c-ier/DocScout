import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';

const BLOCKED_MSG = "Your account doesn't exist or is inactive. Please contact your admin or fill the contact form.";

const AuthContext = createContext({ user: null, role: null, authReady: false, blockedError: null });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [blockedError, setBlockedError] = useState(null);

  const loadProfile = async (authUser) => {
    const { data, error } = await supabase.rpc('get_my_profile');

    if (error || !data) {
      await supabase.auth.signOut();
      setBlockedError(BLOCKED_MSG);
      setUser(null);
      setRole(null);
      return;
    }
    if (data.blocked) {
      await supabase.auth.signOut();
      setBlockedError(BLOCKED_MSG);
      setUser(null);
      setRole(null);
      return;
    }
    setUser({
      ...authUser,
      displayName: data.display_name || authUser.user_metadata?.display_name || '',
    });
    setRole(data.role || 'user');
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) await loadProfile(session.user);
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadProfile(session.user);
      } else {
        setUser(null);
        setRole(null);
      }
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user, setUser, role, authReady,
      blockedError, clearBlockedError: () => setBlockedError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
