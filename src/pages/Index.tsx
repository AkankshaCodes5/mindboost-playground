
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to splash page
    navigate('/splash');
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-mindboost-lightGray">
      <div className="text-center p-4 flex flex-col items-center justify-center">
        <img 
          src="/lovable-uploads/90151ba5-1f64-49ca-8445-777a7bc2fb42.png" 
          alt="MindBoost Logo" 
          className="w-24 h-24 mb-4"
        />
        <h1 className="text-3xl font-bold text-mindboost-dark mb-2">MINDBOOST</h1>
        <p className="text-mindboost-primary">RELAX. FOCUS. ACHIEVE</p>
      </div>
    </div>
  );
};

export default Index;
