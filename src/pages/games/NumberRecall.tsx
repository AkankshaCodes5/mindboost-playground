
import { useState, useEffect, useRef } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useProgress } from '../../contexts/ProgressContext';
import { useToast } from "@/hooks/use-toast";
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
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(20);
  const [correctNumbers, setCorrectNumbers] = useState<number>(0);
  const [currentNumber, setCurrentNumber] = useState(1);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
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
    
    // Shuffle the grid
    newGrid.sort(() => Math.random() - 0.5);
    
    setGrid(newGrid);
    setTimeLeft(20);
    setCorrectNumbers(0);
    setCurrentNumber(1);
    setGameState('playing');
    setStartTime(Date.now());
    setUserComments('');
    
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleCellClick = (index: number) => {
    if (gameState !== 'playing') return;
    
    const clickedCell = grid[index];
    
    // Check if this is the correct number in sequence
    if (clickedCell.value === currentNumber) {
      // Update the grid to mark this number as found
      const newGrid = [...grid];
      newGrid[index].found = true;
      setGrid(newGrid);
      
      // Increment current number and correct count
      setCurrentNumber(prev => prev + 1);
      setCorrectNumbers(prev => prev + 1);
      
      // Show success feedback
      toast({
        title: "Correct!",
        description: `Found number ${clickedCell.value}`,
      });
      
      // Check if all numbers have been found
      if (currentNumber >= 25) {
        endGame();
      }
    } else {
      // Show error feedback for incorrect selection
      toast({
        title: "Wrong number",
        description: `Look for number ${currentNumber}`,
        variant: "destructive",
      });
    }
  };

  const endGame = () => {
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setEndTime(Date.now());
    setGameState('completed');
    
    // Save score
    const duration = (Date.now() - startTime) / 1000;
    addNumberRecallScore(correctNumbers, 25, duration, userComments);
    
    toast({
      title: "Game Complete!",
      description: `You found ${correctNumbers} numbers in sequence.`,
    });
  };

  return (
    <MobileLayout title="Number Recall">
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Number Recall</h1>
          <p className="text-sm text-gray-500">
            {gameState === 'ready' ? 
              "Find numbers 1-25 in sequence as quickly as possible." :
              gameState === 'playing' ? 
              `Find number ${currentNumber} (${correctNumbers}/25 found)` :
              `You found ${correctNumbers} out of 25 numbers in sequence.`
            }
          </p>
        </div>
        
        {gameState === 'playing' && (
          <div className="mb-4 bg-mindboost-primary text-white p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
              <Timer className="w-5 h-5 mr-2" />
              <span>Time Remaining</span>
            </div>
            <span className="font-bold">{timeLeft}s</span>
          </div>
        )}
        
        {/* Game grid */}
        {gameState !== 'ready' && (
          <div className="grid grid-cols-5 gap-2 mb-6">
            {grid.map((cell, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  backgroundColor: cell.found ? '#4caf50' : 'white' 
                }}
                transition={{ delay: index * 0.01 }}
                className={`aspect-square rounded-lg shadow-sm flex items-center justify-center font-bold text-lg cursor-pointer ${
                  cell.found ? 'bg-green-500 text-white' : 'bg-white hover:bg-gray-100'
                }`}
                onClick={() => handleCellClick(index)}
              >
                {cell.value}
              </motion.div>
            ))}
          </div>
        )}
        
        {/* Game completed screen */}
        {gameState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-mindboost-primary text-white p-4 rounded-lg shadow-lg mb-6"
          >
            <h2 className="text-xl font-bold mb-2">Results</h2>
            <p>You found {correctNumbers} out of 25 numbers correctly.</p>
            <p>Time: {((endTime - startTime) / 1000).toFixed(1)}s</p>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-white mb-2">
                Comments (optional)
              </label>
              <textarea
                value={userComments}
                onChange={(e) => setUserComments(e.target.value)}
                className="w-full p-2 border rounded-md text-gray-700"
                placeholder="Add any comments about your experience..."
                rows={3}
              />
            </div>
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => {
                  addNumberRecallScore(correctNumbers, 25, (endTime - startTime) / 1000, userComments);
                  toast({
                    title: "Score Saved",
                    description: "Your score has been recorded.",
                  });
                }}
                className="flex-1 bg-white text-mindboost-primary py-2 px-4 rounded-md font-medium"
              >
                Save Score
              </button>
              <button
                onClick={startGame}
                className="flex-1 bg-mindboost-secondary py-2 px-4 rounded-md font-medium"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate('/games')}
                className="flex items-center justify-center bg-transparent border border-white py-2 px-4 rounded-md font-medium"
              >
                <ExternalLink className="w-4 h-4 mr-1" /> Exit
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Start game button */}
        {gameState === 'ready' && (
          <button
            onClick={startGame}
            className="w-full mindboost-button"
          >
            Start Game
          </button>
        )}
      </div>
    </MobileLayout>
  );
};

export default NumberRecall;
