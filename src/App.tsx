
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProgressProvider } from "./contexts/ProgressContext";

import SplashScreen from "./pages/SplashScreen";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ProgressProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/splash" element={<SplashScreen />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
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
          </TooltipProvider>
        </ProgressProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
