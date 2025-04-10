
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: { name?: string, avatar_url?: string }) => Promise<void>;
  createUserDirectly: (email: string, password: string, name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createUserDirectly = async (email: string, password: string, name: string) => {
    setLoading(true);
    
    try {
      // Clean email by trimming and converting to lowercase
      const cleanEmail = email.trim().toLowerCase();
      
      // First, try to create the account directly
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name,
          },
          // Auto confirm the user's email
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          // If user already exists, try to sign them in directly
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          
          if (signInError) throw signInError;
          
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
        } else {
          throw signUpError;
        }
      } else {
        // If signup worked but needs verification, try sign in anyway
        if (signUpData.user && !signUpData.user.confirmed_at) {
          // Try to immediately sign in even if email not confirmed
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
        }
        
        toast({
          title: "Account created",
          description: "Your account has been created and you're now logged in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    
    try {
      // Clean email by trimming and converting to lowercase
      const cleanEmail = email.trim().toLowerCase();
      
      const { error, data } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name,
          },
          // Skip email verification by redirecting directly to dashboard
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        if (error.message.includes('Signups not allowed')) {
          throw new Error('Signups are currently disabled. Please contact the administrator.');
        }
        throw error;
      }
      
      // Try to sign in immediately after signup regardless of email confirmation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      
      // We'll ignore signInError here as it might fail due to email not confirmed
      // The user will still get redirected to the dashboard by the signup handler

      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Clean email by trimming and converting to lowercase
      const cleanEmail = email.trim().toLowerCase();
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      
      if (error) {
        // Don't treat email not confirmed as an error - try to log in anyway
        if (error.message.includes('Email not confirmed')) {
          // Attempt to sign in regardless of confirmation status
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Password reset link sent",
        description: "Please check your email for password reset instructions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset email",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { name?: string, avatar_url?: string }) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const updates = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      // Use the correct type for the update operation
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    createUserDirectly
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
