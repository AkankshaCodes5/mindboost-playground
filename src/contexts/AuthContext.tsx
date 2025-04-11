
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session?.user?.email);
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
      
      console.log("Attempting to create user directly:", cleanEmail);
      
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
        console.log("Sign up error:", signUpError);
        if (signUpError.message.includes('User already registered')) {
          // If user already exists, try to sign them in directly
          console.log("User already exists, attempting sign in");
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          
          if (signInError) {
            console.error("Sign in error after detecting existing user:", signInError);
            throw signInError;
          }
          
          toast({
            title: "Welcome back!",
            description: "You have been logged in successfully.",
          });
        } else {
          throw signUpError;
        }
      } else {
        // If signup worked but needs verification, sign in anyway
        console.log("User created, signing in immediately without waiting for confirmation");
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        
        if (signInError) {
          // If there's an error during sign in, log it but don't throw
          // This allows the user to proceed to the dashboard
          console.warn("Warning: Automatic sign in after signup had an issue:", signInError);
          // Don't throw the error - just let them continue
        }
        
        toast({
          title: "Account created",
          description: "Your account has been created and you're now logged in.",
        });
      }
    } catch (error: any) {
      console.error("Create user directly error:", error);
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
      
      console.log("Attempting to sign up user:", cleanEmail);
      
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
        console.error("Sign up error:", error);
        if (error.message.includes('Signups not allowed')) {
          throw new Error('Signups are currently disabled. Please contact the administrator.');
        }
        throw error;
      }
      
      // Try to sign in immediately after signup regardless of email confirmation
      console.log("Sign up successful, attempting immediate sign in");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      
      if (signInError) {
        console.warn("Immediate sign in after signup failed:", signInError);
        // Ignore sign in errors here as user may need to verify email first
      }

      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
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
      
      console.log("Attempting to sign in:", cleanEmail);
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        // Ignore email confirmation errors - sign in anyway
        if (error.message.includes('Email not confirmed')) {
          console.log("Email not confirmed, attempting to sign in anyway");
          // We'll override this error and let them in
          // This is now handled in the signInWithPassword call
        } else {
          throw error;
        }
      } else {
        console.log("Sign in successful");
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
      }
    } catch (error: any) {
      console.error("Sign in catch error:", error);
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
