
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-4 bg-mindboost-lightGray">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full flex justify-center mt-6 mb-8"
      >
        <div className="text-center">
          <img 
            src="/lovable-uploads/90151ba5-1f64-49ca-8445-777a7bc2fb42.png" 
            alt="MindBoost Logo" 
            className="w-32 h-32 mx-auto"
          />
          <h1 className="text-3xl font-bold text-mindboost-dark mt-2">MINDBOOST</h1>
          <p className="text-mindboost-primary text-lg">RELAX. FOCUS. ACHIEVE</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-mindboost-dark mb-4 text-center">Welcome Back</h2>
          <p className="text-mindboost-gray text-center mb-6">Sign in to your MindBoost account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-mindboost-dark">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mindboost-input pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-mindboost-dark">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mindboost-input pl-10"
                  required
                />
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-mindboost-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="mindboost-button w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-mindboost-gray">
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
