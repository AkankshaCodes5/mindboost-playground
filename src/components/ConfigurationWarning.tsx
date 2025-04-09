
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const ConfigurationWarning = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <img 
        src="/lovable-uploads/90151ba5-1f64-49ca-8445-777a7bc2fb42.png" 
        alt="MindBoost Logo" 
        className="w-24 h-24 mb-4"
      />
      <h1 className="text-3xl font-bold text-mindboost-dark mb-2">MINDBOOST</h1>
      
      <div className="w-full max-w-md mt-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            <p className="mt-2">
              Supabase environment variables are not configured. Please set the following in your environment:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_ANON_KEY</li>
            </ul>
            <p className="mt-3">
              You can find these values in your Supabase project dashboard under Project Settings &gt; API.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default ConfigurationWarning;
