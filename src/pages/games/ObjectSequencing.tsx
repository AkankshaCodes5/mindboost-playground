
import { useState, useEffect } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useProgress } from '../../contexts/ProgressContext';
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ExternalLink, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ObjectItem {
  id: number;
  emoji: string;
}

const ObjectSequencing = () => {
  const [objects, setObjects] = useState<ObjectItem[]>([]);
  const [userSequence, setUserSequence] = useState<ObjectItem[]>([]);
  const [availableObjects, setAvailableObjects] = useState<ObjectItem[]>([]);
  const [gameState, setGameState] = useState<'memorizing' | 'sequencing' | 'completed'>('memorizing');
  const [countdownTime, setCountdownTime] = useState(5);
  const [attempts, setAttempts] = useState(0);
  const [correctPositions, setCorrectPositions] = useState(0);
  const [startTime, setStartTime] = useState(0);
  
  const { addGameScore } = useProgress();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const emojis = ['🍎', '🍌', '🥕', '🍇', '🍒', '🥑', '🥦', '🍓', '🍋', '🍍', '🥝', '🥭'];

  useEffect(() => {
    startNewGame();
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState === 'memorizing' && countdownTime > 0) {
      timer = setTimeout(() => {
        setCountdownTime(prev => prev - 1);
      }, 1000);
    } else if (gameState === 'memorizing' && countdownTime === 0) {
      setGameState('sequencing');
    }
    
    return () => clearTimeout(timer);
  }, [gameState, countdownTime]);

  const startNewGame = () => {
    // Select 5 random emojis
    const selectedEmojis = [...emojis]
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
    
    // Create sequence
    const sequence = selectedEmojis.map((emoji, index) => ({
      id: index,
      emoji
    }));
    
    setObjects(sequence);
    setUserSequence([]);
    setAvailableObjects([...sequence].sort(() => 0.5 - Math.random()));
    setGameState('memorizing');
    setCountdownTime(5);
    setAttempts(0);
    setCorrectPositions(0);
    setStartTime(Date.now());
  };

  const handleObjectClick = (item: ObjectItem) => {
    if (gameState !== 'sequencing') return;
    
    setUserSequence(prev => [...prev, item]);
    setAvailableObjects(prev => prev.filter(obj => obj.id !== item.id));
    
    // Check if all objects are placed
    if (userSequence.length === objects.length - 1) {
      checkResult([...userSequence, item]);
    }
  };

  const checkResult = (sequence: ObjectItem[]) => {
    setAttempts(prev => prev + 1);
    
    // Count correct positions
    let correct = 0;
    sequence.forEach((item, index) => {
      if (item.id === objects[index].id) {
        correct++;
      }
    });
    
    setCorrectPositions(correct);
    
    // Calculate score
    const score = Math.round((correct / objects.length) * 100);
    const duration = (Date.now() - startTime) / 1000;
    
    addGameScore('object-sequencing', score, duration);
    
    setGameState('completed');
    
    toast({
      title: "Sequence Complete",
      description: `You got ${correct} out of ${objects.length} objects in the correct position.`,
    });
  };

  const resetSequence = () => {
    setUserSequence([]);
    setAvailableObjects([...objects].sort(() => 0.5 - Math.random()));
  };

  return (
    <MobileLayout title="Object Sequencing">
      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold">Object Sequencing</h1>
          <p className="text-sm text-gray-500">
            {gameState === 'memorizing' 
              ? "Memorize the sequence of objects" 
              : gameState === 'sequencing'
              ? "Reconstruct the sequence in the correct order"
              : `You got ${correctPositions} out of ${objects.length} correct`
            }
          </p>
        </div>
        
        {/* Memorizing state */}
        {gameState === 'memorizing' && (
          <>
            <div className="bg-mindboost-primary text-white p-3 rounded-lg mb-4 flex justify-between">
              <span>Memorize Time</span>
              <span className="font-bold">{countdownTime}s</span>
            </div>
            
            <div className="flex justify-center items-center space-x-2 mb-8">
              {objects.map((obj, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center text-3xl"
                >
                  {obj.emoji}
                </motion.div>
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Remember this sequence!</p>
              <p className="text-mindboost-gray">You'll need to reconstruct it from memory</p>
            </div>
          </>
        )}
        
        {/* Sequencing state */}
        {gameState === 'sequencing' && (
          <>
            <div className="mb-6">
              <h3 className="text-sm font-medium text-mindboost-gray mb-2">Your Sequence</h3>
              <div className="flex justify-center items-center space-x-2 min-h-16">
                {userSequence.length > 0 ? (
                  userSequence.map((obj, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-14 h-14 bg-white rounded-lg shadow-sm flex items-center justify-center text-2xl"
                    >
                      {obj.emoji}
                    </motion.div>
                  ))
                ) : (
                  <div className="text-mindboost-gray text-sm">Click objects below to place them in sequence</div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-mindboost-gray mb-2">Available Objects</h3>
              <div className="flex justify-center items-center flex-wrap gap-3">
                {availableObjects.map((obj) => (
                  <motion.div
                    key={obj.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center text-3xl cursor-pointer"
                    onClick={() => handleObjectClick(obj)}
                  >
                    {obj.emoji}
                  </motion.div>
                ))}
              </div>
            </div>
            
            {userSequence.length > 0 && (
              <button 
                onClick={resetSequence}
                className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium"
              >
                Reset Sequence
              </button>
            )}
          </>
        )}
        
        {/* Completed state */}
        {gameState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4 mb-6"
          >
            <h2 className="text-xl font-bold mb-4 text-center">Results</h2>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
              {objects.map((obj, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center text-xl border-2 border-mindboost-light">
                    {obj.emoji}
                  </div>
                  <div className="text-xs mt-1 text-center text-gray-500">Correct</div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
              {userSequence.map((obj, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-lg shadow-sm flex items-center justify-center text-xl ${
                    obj.id === objects[index].id 
                      ? 'bg-green-100 border-2 border-green-300' 
                      : 'bg-red-100 border-2 border-red-300'
                  }`}>
                    {obj.emoji}
                  </div>
                  <div className="text-xs mt-1 flex items-center justify-center">
                    {obj.id === objects[index].id 
                      ? <Check className="w-3 h-3 text-green-500 mr-0.5" />
                      : <X className="w-3 h-3 text-red-500 mr-0.5" />
                    }
                    <span className={obj.id === objects[index].id ? 'text-green-500' : 'text-red-500'}>
                      {obj.id === objects[index].id ? 'Correct' : 'Wrong'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mb-4">
              <div className="text-xl font-bold mb-1">
                {correctPositions}/{objects.length} Correct
              </div>
              <div className="text-mindboost-gray">
                {correctPositions === objects.length 
                  ? 'Perfect! You remembered the entire sequence!' 
                  : 'Keep practicing to improve your memory!'}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={startNewGame}
                className="flex-1 bg-mindboost-primary text-white py-2 px-4 rounded-md font-medium"
              >
                Play Again
              </button>
              <button
                onClick={() => navigate('/games')}
                className="flex items-center justify-center bg-mindboost-secondary text-white py-2 px-4 rounded-md font-medium"
              >
                <ExternalLink className="w-4 h-4 mr-1" /> Exit
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </MobileLayout>
  );
};

export default ObjectSequencing;
