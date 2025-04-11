import { useState, useEffect, useRef } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useProgress } from '../../contexts/ProgressContext';
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { Timer, Check, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface GridCell {
  value: number;
  found: boolean;
}

const NumberRecall = () => {
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [gameState, setGameState] = useState<'ready' | 'memorizing' | 'recalling' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(20);
  const [userAnswer, setUserAnswer] = useState('');
  const [correctNumbers, setCorrectNumbers] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [ascending, setAscending] = useState<boolean>(true);
  const [userComments, setUserComments] = useState<string>('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { addNumberRecallScore } = useProgress();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const startGame = () => {
    const newGrid = [];
    for (let i = 1; i <= 25; i++) {
      newGrid.push({
        value: i,
        found: false
      });
    }
    
    newGrid.sort(() => Math.random() - 0.5);
    
    setGrid(newGrid);
    setTimeLeft(20);
    setUserAnswer('');
    setCorrectNumbers(0);
    setAscending(Math.random() > 0.5);
    setGameState('memorizing');
    setStartTime(Date.now());
    setUserComments('');
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setGameState('recalling');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    const answer = parseInt(userAnswer);
    
    if (isNaN(answer)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number.",
        variant: "destructive",
      });
      return;
    }
    
    setEndTime(Date.now());
    setGameState('completed');
    
    const maxPossible = 25;
    const duration = (Date.now() - startTime) / 1000;
    
    addNumberRecallScore(answer, maxPossible, duration, userComments);
    
    setCorrectNumbers(answer);
    
    toast({
      title: "Game Complete!",
      description: `You recalled ${answer} numbers correctly.`,
    });
  };

  return (
    <MobileLayout title="Number Recall">
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Number Recall</h1>
          <p className="text-sm text-gray-500">
            {gameState === 'memorizing' ? (
              ascending ? 
                "Memorize the location of numbers in ascending order (1-25)" :
                "Memorize the location of numbers in descending order (25-1)"
            ) : gameState === 'recalling' ? (
              "How many numbers did you find in the correct order?"
            ) : gameState === 'completed' ? (
              `You recalled ${correctNumbers} numbers correctly.`
            ) : (
              "Memorize the grid and find numbers in sequence"
            )}
          </p>
        </div>
        
        {gameState === 'memorizing' && (
          <div className="mb-4 bg-mindboost-primary text-white p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Timer className="w-5 h-5 mr-2" />
              <span>Memorizing Time</span>
            </div>
            <span className="font-bold">{timeLeft}s</span>
          </div>
        )}
        
        {(gameState === 'memorizing' || gameState === 'completed') && (
          <div className="grid grid-cols-5 gap-2 mb-6">
            {grid.map((cell, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className="aspect-square bg-white rounded-lg shadow-sm flex items-center justify-center font-bold text-lg"
              >
                {gameState === 'memorizing' ? cell.value : '?'}
              </motion.div>
            ))}
          </div>
        )}
        
        {gameState === 'recalling' && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <p className="text-center mb-4">
              How many numbers did you find in {ascending ? "ascending" : "descending"} order?
            </p>
            <input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="mindboost-input text-center text-xl font-bold mb-4 w-full"
              placeholder="Enter number"
              min="0"
              max="25"
            />
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (optional)
              </label>
              <textarea
                value={userComments}
                onChange={(e) => setUserComments(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Add any comments about your experience..."
                rows={3}
              />
            </div>
          </div>
        )}
        
        {gameState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-mindboost-primary text-white p-4 rounded-lg shadow-lg mb-6"
          >
            <h2 className="text-xl font-bold mb-2">Results</h2>
            <p>You recalled {correctNumbers} out of 25 numbers correctly.</p>
            <p>Time: {((endTime - startTime) / 1000).toFixed(1)}s</p>
            {userComments && (
              <div className="mt-2 p-2 bg-white bg-opacity-10 rounded-md">
                <p className="text-sm font-medium">Your comments:</p>
                <p className="text-sm">{userComments}</p>
              </div>
            )}
            <div className="mt-4 flex space-x-3">
              <button
                onClick={startGame}
                className="flex-1 bg-white text-mindboost-primary py-2 px-4 rounded-md font-medium"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate('/games')}
                className="flex items-center justify-center bg-mindboost-secondary py-2 px-4 rounded-md font-medium"
              >
                <ExternalLink className="w-4 h-4 mr-1" /> Exit
              </button>
            </div>
          </motion.div>
        )}
        
        {gameState === 'ready' && (
          <button
            onClick={startGame}
            className="w-full mindboost-button"
          >
            Start Game
          </button>
        )}
        
        {gameState === 'recalling' && (
          <button
            onClick={handleSubmit}
            className="w-full mindboost-button"
          >
            Submit Answer
          </button>
        )}
      </div>
    </MobileLayout>
  );
};

export default NumberRecall;
