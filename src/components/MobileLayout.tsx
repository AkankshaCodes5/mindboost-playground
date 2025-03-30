
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
  showProfile?: boolean;
}

const MobileLayout = ({ children, title, showBack = true, showProfile = true }: MobileLayoutProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleBack = () => {
    navigate(-1);
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  return (
    <div className="mindboost-container">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            {showBack ? (
              <button 
                onClick={handleBack}
                className="p-2 mr-2 rounded-full hover:bg-mindboost-lightGray"
              >
                <ArrowLeft className="w-5 h-5 text-mindboost-dark" />
              </button>
            ) : (
              <div className="flex items-center">
                <img
                  src="/lovable-uploads/90151ba5-1f64-49ca-8445-777a7bc2fb42.png"
                  alt="MindBoost"
                  className="h-8 w-8 mr-2"
                />
                <span className="text-lg font-semibold text-mindboost-dark">MindBoost</span>
              </div>
            )}
            {showBack && <h1 className="text-lg font-semibold text-mindboost-dark">{title}</h1>}
          </div>
          
          {showProfile && (
            <div className="flex items-center">
              <button 
                onClick={handleProfile}
                className="p-2 rounded-full hover:bg-mindboost-lightGray mr-2"
              >
                <User className="w-5 h-5 text-mindboost-dark" />
              </button>
              <button 
                onClick={handleSignOut}
                className="p-2 rounded-full hover:bg-mindboost-lightGray"
              >
                <LogOut className="w-5 h-5 text-mindboost-dark" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-16">
        {children}
      </main>
    </div>
  );
};

export default MobileLayout;
