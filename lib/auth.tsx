import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, User } from './supabase';
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('👤 Fetching user profile for ID:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        console.error('Error details:', error.details, error.hint, error.message);
        
        // If user doesn't exist in users table, create them
        if (error.code === 'PGRST116') {
          console.log('🔧 User not found in users table, creating profile...');
          await createUserProfile(userId);
          return;
        }
        
        setLoading(false);
        return;
      }

      console.log('✅ User profile fetched:', data);
      setUser(data);
      setLoading(false);
    } catch (error) {
      console.error('❌ Unexpected error fetching user profile:', error);
      setLoading(false);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      console.log('🆕 Creating user profile for ID:', userId);
      
      // Get user info from auth
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        console.error('❌ No authenticated user found');
        setLoading(false);
        return;
      }

      const userProfile = {
        id: userId,
        email: authUser.user.email || '',
        name: authUser.user.user_metadata?.name || 'User',
        role: 'staff' as const,
      };

      const { data, error } = await supabase
        .from('users')
        .insert([userProfile])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating user profile:', error);
        setLoading(false);
        return;
      }

      console.log('✅ User profile created:', data);
      setUser(data);
      setLoading(false);
    } catch (error) {
      console.error('❌ Unexpected error creating user profile:', error);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting to sign in user:', { email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Supabase auth signin error:', error);
        return { error };
      }

      console.log('✅ Signin successful:', data);
      return { error: null };
    } catch (error) {
      console.error('❌ Unexpected error during signin:', error);
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Attempting to sign up user:', { email, name });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name, // This will be available in the trigger as raw_user_meta_data
          },
        },
      });

      if (error) {
        console.error('Supabase auth signup error:', error);
        return { error };
      }

      console.log('Signup successful:', data);
      
      // The user profile will be created automatically by the database trigger
      // No need to manually insert into users table
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setUser({ ...user, ...updates });
    }

    return { error };
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 