
import { useState, useEffect } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useProgress } from '../../contexts/ProgressContext';
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { Timer, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ColorWord {
  word: string;
  textColor: string;
  match: boolean;
}

const colors = [
  { name: 'Red', color: '#EF4444' },
  { name: 'Blue', color: '#3B82F6' },
  { name: 'Green', color: '#10B981' },
  { name: 'Yellow', color: '#F59E0B' },
  { name: 'Purple', color: '#8B5CF6' },
];

const StroopTest = () => {
  const [colorGrid, setColorGrid] = useState<ColorWord[][]>([]);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'completed'>('ready');
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const [startTime, setStartTime] = useState(0);
  
  const { addStroopTestScore } = useProgress();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameState]);

  const generateColorGrid = (): ColorWord[][] => {
    const grid: ColorWord[][] = [];
    
    for (let i = 0; i < 8; i++) {
      const row: ColorWord[] = [];
      
      for (let j = 0; j < 4; j++) {
        const wordIndex = Math.floor(Math.random() * colors.length);
        const colorIndex = Math.floor(Math.random() * colors.length);
        const match = Math.random() < 0.3; // 30% chance of matching
        
        row.push({
          word: colors[wordIndex].name,
          textColor: match ? colors[wordIndex].color : colors[colorIndex].color,
          match
        });
      }
      
      grid.push(row);
    }
    
    return grid;
  };

  const startGame = () => {
    setColorGrid(generateColorGrid());
    setGameState('playing');
    setTimeLeft(60);
    setScore(0);
    setRow(0);
    setCol(0);
    setStartTime(Date.now());
  };

  const endGame = () => {
    setGameState('completed');
    const finalScore = score;
    const duration = (Date.now() - startTime) / 1000;
    
    addStroopTestScore(row, col, duration);
    
    toast({
      title: "Test Complete!",
      description: `You identified ${finalScore} mismatches correctly.`,
    });
  };

  const handleCellClick = (rowIndex: number, colIndex: number, cell: ColorWord) => {
    if (gameState !== 'playing') return;
    
    if (!cell.match) {
      // Correct identification of mismatch
      if (rowIndex === row && colIndex === col) {
        setScore(prev => prev + 1);
        
        // Move to next cell
        if (colIndex < colorGrid[rowIndex].length - 1) {
          setCol(prev => prev + 1);
        } else if (rowIndex < colorGrid.length - 1) {
          setRow(prev => prev + 1);
          setCol(0);
        } else {
          // Completed all cells
          endGame();
        }
      } else {
        // Wrong cell clicked
        toast({
          title: "Wrong!",
          description: "Follow the sequence row by row, column by column.",
          variant: "destructive",
        });
      }
    } else {
      // Clicked on a matching cell
      toast({
        title: "Wrong!",
        description: "This color word matches its text color.",
        variant: "destructive",
      });
    }
  };

  return (
    <MobileLayout title="Stroop Test">
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Stroop Test</h1>
          <p className="text-sm text-gray-500">
            Click on words where the color name doesn't match the text color
          </p>
        </div>
        
        {gameState === 'playing' && (
          <div className="mb-4 bg-mindboost-primary text-white p-3 rounded-lg flex justify-between items-center">
            <div className="flex items-center">
              <Timer className="w-5 h-5 mr-2" />
              <span>Time Left</span>
            </div>
            <div className="flex space-x-4">
              <span>Score: {score}</span>
              <span className="font-bold">{timeLeft}s</span>
            </div>
          </div>
        )}
        
        {(gameState === 'playing' || gameState === 'completed') && (
          <div className="bg-white rounded-lg shadow-sm p-3 mb-6">
            <div className="space-y-3">
              {colorGrid.map((rowCells, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-4 gap-2">
                  {rowCells.map((cell, colIndex) => (
                    <motion.div
                      key={colIndex}
                      whileHover={gameState === 'playing' ? { scale: 1.05 } : {}}
                      whileTap={gameState === 'playing' ? { scale: 0.95 } : {}}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        gameState === 'playing' && rowIndex === row && colIndex === col
                          ? 'ring-2 ring-mindboost-primary'
                          : ''
                      } ${
                        gameState === 'completed' && !cell.match
                          ? 'bg-green-100'
                          : 'bg-gray-50'
                      }`}
                      onClick={() => handleCellClick(rowIndex, colIndex, cell)}
                    >
                      <p 
                        className="text-center text-sm font-bold" 
                        style={{ color: cell.textColor }}
                      >
                        {cell.word}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {gameState === 'ready' && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h2 className="text-lg font-semibold mb-2">Instructions</h2>
            <p className="mb-4 text-gray-600">
              This test measures your ability to process conflicting information.
            </p>
            <p className="mb-4 text-gray-600">
              You'll see a grid of color names. Click on words where the color name (e.g., "Red") 
              doesn't match the color of the text (e.g., text shown in blue).
            </p>
            <p className="mb-4 text-gray-600">
              Work as quickly as possible, row by row, column by column. The highlighted cell shows your current position.
            </p>
            <div className="flex justify-center space-x-4 mb-4">
              <div className="text-center">
                <div className="inline-block p-2 bg-green-100 rounded-lg mb-1">
                  <p className="font-bold" style={{ color: '#3B82F6' }}>Red</p>
                </div>
                <p className="text-xs text-gray-500">Correct (mismatch)</p>
              </div>
              <div className="text-center">
                <div className="inline-block p-2 bg-gray-50 rounded-lg mb-1">
                  <p className="font-bold" style={{ color: '#EF4444' }}>Red</p>
                </div>
                <p className="text-xs text-gray-500">Skip (match)</p>
              </div>
            </div>
          </div>
        )}
        
        {gameState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-mindboost-primary text-white p-4 rounded-lg shadow-lg"
          >
            <h2 className="text-xl font-bold mb-2">Results</h2>
            <p>You identified {score} mismatches correctly.</p>
            <p>Time: {60 - timeLeft}s</p>
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
            Start Test
          </button>
        )}
      </div>
    </MobileLayout>
  );
};

export default StroopTest;
