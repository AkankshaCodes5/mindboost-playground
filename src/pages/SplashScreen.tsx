
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      navigate('/signin');
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-mindboost-lightGray">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center"
      >
        <img 
          src="/lovable-uploads/90151ba5-1f64-49ca-8445-777a7bc2fb42.png" 
          alt="MindBoost Logo" 
          className="w-48 h-48 mb-4"
        />
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-4xl font-bold text-mindboost-dark mt-6"
        >
          MINDBOOST
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-xl text-mindboost-primary mt-2"
        >
          RELAX. FOCUS. ACHIEVE
        </motion.p>
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 0.5 }}
            className="mt-12"
          >
            <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 4, ease: "easeInOut" }}
                className="h-full bg-mindboost-primary"
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SplashScreen;
