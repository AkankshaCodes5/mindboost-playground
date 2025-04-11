
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    if (!email || !email.includes('@') || !email.includes('.')) return false;
    
    const trimmedEmail = email.trim();
    
    if (trimmedEmail.startsWith('@') || trimmedEmail.endsWith('@')) return false;
    if (trimmedEmail.indexOf('@') !== trimmedEmail.lastIndexOf('@')) return false;
    
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(trimmedEmail.toLowerCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrorMessage(null);
    
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Starting sign-in process");
      
      await signIn(email, password);
      
      // Show welcome message
      toast({
        title: "Welcome to MindBoost!",
        description: "You've successfully logged in.",
      });
      
      console.log("Sign in successful, redirecting to dashboard");
      // Navigate to dashboard - should happen automatically via AuthContext
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        setErrorMessage('Invalid email or password. Please check your credentials.');
      } else {
        setErrorMessage(error.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address first",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) throw error;

      toast({
        title: "Confirmation email sent",
        description: "Please check your inbox for the verification link",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend confirmation email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-mindboost-lightGray">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full mt-4 mb-4"
      >
        <div className="text-center">
          <img 
            src="/lovable-uploads/90151ba5-1f64-49ca-8445-777a7bc2fb42.png" 
            alt="MindBoost Logo" 
            className="w-24 h-24 mx-auto"
          />
          <h1 className="text-3xl font-bold text-mindboost-dark mt-1">MINDBOOST</h1>
          <p className="text-mindboost-primary text-base mt-1">RELAX. FOCUS. ACHIEVE</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-md mx-auto px-4 flex-grow overflow-y-auto pb-6"
      >
        <div className="bg-white rounded-xl shadow-md p-5">
          <h2 className="text-lg font-semibold text-mindboost-dark mb-2 text-center">Log In</h2>
          <p className="text-mindboost-gray text-center mb-3 text-xs">Enter your email & password to log in</p>

          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
              {errorMessage.includes('Email not confirmed') && (
                <button 
                  onClick={handleResendConfirmation} 
                  className="bg-mindboost-primary text-white px-3 py-1 rounded text-xs mt-2"
                >
                  Resend Verification Email
                </button>
              )}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-mindboost-dark">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="mindboost-input"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-mindboost-dark">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mindboost-input"
                required
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-mindboost-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="mindboost-button w-full text-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              ) : (
                'Log In'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <p className="text-mindboost-gray text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-mindboost-primary font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignIn;
