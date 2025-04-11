
import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProgressProvider } from "./contexts/ProgressContext";

import SplashScreen from "./pages/SplashScreen";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import MemoryGames from "./pages/games/MemoryGames";
import MatchingGame from "./pages/games/MatchingGame";
import NumberRecall from "./pages/games/NumberRecall";
import ObjectSequencing from "./pages/games/ObjectSequencing";
import StroopTest from "./pages/games/StroopTest";
import MeditationPage from "./pages/relaxation/MeditationPage";
import MusicPage from "./pages/relaxation/MusicPage";
import WaterTracker from "./pages/relaxation/WaterTracker";
import UserProfile from "./pages/UserProfile";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";

const queryClient = new QueryClient();

// Auth wrapper component to redirect already authenticated users
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading && user) {
      console.log("User is already authenticated, redirecting to dashboard");
      // Redirect authenticated users to dashboard from auth pages
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate, location]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mindboost-primary"></div>
      </div>
    );
  }
  
  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProgressProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/splash" element={<SplashScreen />} />
                
                {/* Auth routes with redirect for already authenticated users */}
                <Route path="/signin" element={
                  <AuthRoute>
                    <SignIn />
                  </AuthRoute>
                } />
                <Route path="/signup" element={
                  <AuthRoute>
                    <SignUp />
                  </AuthRoute>
                } />
                <Route path="/forgot-password" element={
                  <AuthRoute>
                    <ForgotPassword />
                  </AuthRoute>
                } />
                <Route path="/reset-password" element={
                  <AuthRoute>
                    <ResetPassword />
                  </AuthRoute>
                } />
                
                {/* Private routes that require authentication */}
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } />
                <Route path="/games" element={
                  <PrivateRoute>
                    <MemoryGames />
                  </PrivateRoute>
                } />
                <Route path="/games/matching" element={
                  <PrivateRoute>
                    <MatchingGame />
                  </PrivateRoute>
                } />
                <Route path="/games/number-recall" element={
                  <PrivateRoute>
                    <NumberRecall />
                  </PrivateRoute>
                } />
                <Route path="/games/object-sequencing" element={
                  <PrivateRoute>
                    <ObjectSequencing />
                  </PrivateRoute>
                } />
                <Route path="/games/stroop-test" element={
                  <PrivateRoute>
                    <StroopTest />
                  </PrivateRoute>
                } />
                <Route path="/meditation" element={
                  <PrivateRoute>
                    <MeditationPage />
                  </PrivateRoute>
                } />
                <Route path="/music" element={
                  <PrivateRoute>
                    <MusicPage />
                  </PrivateRoute>
                } />
                <Route path="/water-tracker" element={
                  <PrivateRoute>
                    <WaterTracker />
                  </PrivateRoute>
                } />
                <Route path="/profile" element={
                  <PrivateRoute>
                    <UserProfile />
                  </PrivateRoute>
                } />
                
                <Route path="/" element={<Navigate to="/signup" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ProgressProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
