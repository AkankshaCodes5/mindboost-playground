
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Check for stored user on initial load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('mindboost_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user from storage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mock signup function - in a real app, this would connect to a backend
  const signUp = async (name: string, email: string, password: string) => {
    setLoading(true);
    
    try {
      // Check if user with this email already exists
      const storedUser = localStorage.getItem('mindboost_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.email === email) {
          throw new Error('An account with this email already exists.');
        }
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock user
      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email
      };
      
      // Save to local storage (for demo purposes)
      localStorage.setItem('mindboost_user', JSON.stringify(newUser));
      setUser(newUser);
      
      toast({
        title: "Welcome to MindBoost!",
        description: "Your account has been created successfully.",
      });

      return Promise.resolve();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mock signin function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, we'll check if there's a stored user first
      const storedUser = localStorage.getItem('mindboost_user');
      if (!storedUser) {
        throw new Error('No user found. Please sign up first.');
      }
      
      const userData = JSON.parse(storedUser);
      // In a real app, we would validate the email and password
      // For demo, just check if the email matches
      if (userData.email !== email) {
        throw new Error('Invalid email or password.');
      }
      
      setUser(userData);
      
      toast({
        title: "Welcome back to MindBoost!",
        description: "You have successfully logged in.",
      });

      return Promise.resolve();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid email or password.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    try {
      localStorage.removeItem('mindboost_user');
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
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
      // Check if user exists with this email
      const storedUser = localStorage.getItem('mindboost_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.email !== email) {
          throw new Error('No account found with this email address.');
        }
      } else {
        throw new Error('No account found with this email address.');
      }
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password reset link sent",
        description: "Please check your email for password reset instructions.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset link. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
