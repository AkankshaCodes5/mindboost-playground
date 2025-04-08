
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
    navigate('/dashboard');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-mindboost-lightGray">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow-sm pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            {showBack ? (
              <button 
                onClick={handleBack}
                className="p-2 mr-2 rounded-full hover:bg-mindboost-lightGray"
                aria-label="Go back to dashboard"
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
                aria-label="Go to profile"
              >
                <User className="w-5 h-5 text-mindboost-dark" />
              </button>
              <button 
                onClick={handleSignOut}
                className="p-2 rounded-full hover:bg-mindboost-lightGray"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5 text-mindboost-dark" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content - improved vertical centering and scrolling */}
      <main className="flex-1 overflow-y-auto pb-safe flex flex-col">
        <div className="py-3 px-4 flex-grow flex flex-col justify-center">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MobileLayout;
