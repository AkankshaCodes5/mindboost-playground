
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, createUserDirectly } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // More comprehensive email validation
  const validateEmail = (email: string) => {
    // Basic validation first to catch most common errors
    if (!email || !email.includes('@') || !email.includes('.')) return false;
    
    // Trim the email before validation
    const trimmedEmail = email.trim();
    
    // Check for common invalid patterns
    if (trimmedEmail.startsWith('@') || trimmedEmail.endsWith('@')) return false;
    if (trimmedEmail.indexOf('@') !== trimmedEmail.lastIndexOf('@')) return false;
    
    // RFC 5322 compliant regex for thorough validation
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(trimmedEmail.toLowerCase());
  };

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous error messages
    setErrorMessage(null);
    
    if (!validatePassword()) {
      return;
    }

    if (!email || !name) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Try to directly create/sign in the user without verification
      try {
        await createUserDirectly(email, password, name);
        toast({
          title: "Welcome!",
          description: "Your account has been created and you've been logged in successfully.",
        });
        navigate('/dashboard');
        return;
      } catch (directError: any) {
        // If direct creation fails, try regular signup
        console.log("Direct user creation failed, trying regular signup:", directError);
        
        await signUp(email, password, name);
        
        // With normal signup flow, navigate directly to dashboard
        // This assumes email verification is disabled in Supabase
        toast({
          title: "Account created",
          description: "Your account has been created successfully.",
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Display specific error message for signups disabled
      if (error.message?.includes('Signups are currently disabled')) {
        setErrorMessage("New account creation is currently disabled by the administrator. Please contact support for assistance.");
      } else if (error.message?.includes('User already registered')) {
        setErrorMessage("This email is already registered. Please log in instead.");
      } else {
        setErrorMessage(error.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
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
          <h2 className="text-xl font-semibold text-mindboost-dark mb-2 text-center">Create Account</h2>
          <p className="text-mindboost-gray text-center mb-3">Enter your details to sign up</p>
          
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="text-sm">{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium text-mindboost-dark">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="mindboost-input"
                required
              />
            </div>

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
                placeholder="Create a password"
                className="mindboost-input"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-mindboost-dark">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="mindboost-input"
                required
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              className="mindboost-button w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              ) : (
                'Sign Up'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <p className="text-mindboost-gray">
            Already have an account?{' '}
            <Link to="/signin" className="text-mindboost-primary font-medium hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;
