
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Reset password error:', error);
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
            className="w-36 h-36 mx-auto"
          />
          <h1 className="text-4xl font-bold text-mindboost-dark mt-2">MINDBOOST</h1>
          <p className="text-mindboost-primary text-lg mt-1">RELAX. FOCUS. ACHIEVE</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-mindboost-dark mb-4 text-center">Forgot Password</h2>
          <p className="text-mindboost-gray text-center mb-6">
            {isSubmitted 
              ? "Password reset link sent to your email" 
              : "Enter your registered email to receive a reset link"
            }
          </p>

          {isSubmitted ? (
            <div className="text-center py-6">
              <div className="mb-4 mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-500">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="text-mindboost-dark mb-4">
                Check your email for the reset link. You can close this page.
              </p>
              <button
                onClick={() => navigate('/signin')}
                className="mindboost-button"
              >
                Back to Log In
              </button>
            </div>
          ) : (
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
                    placeholder="Enter your registered email"
                    className="mindboost-input pl-10"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mindboost-button w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>

        {!isSubmitted && (
          <div className="text-center mt-6">
            <Link to="/signin" className="flex items-center justify-center text-mindboost-primary font-medium hover:underline">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Log In
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
