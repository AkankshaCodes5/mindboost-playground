import { useState, useEffect } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useProgress } from '../../contexts/ProgressContext';
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Card {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
}

const MatchingGame = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [gameComplete, setGameComplete] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  
  const { addGameScore } = useProgress();
  const { toast } = useToast();
  const navigate = useNavigate();

  const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐮'];

  const initializeGame = () => {
    const selectedEmojis = [...emojis]
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
    
    const cardPairs = [...selectedEmojis, ...selectedEmojis]
      .sort(() => 0.5 - Math.random())
      .map((value, index) => ({
        id: index,
        value,
        flipped: false,
        matched: false
      }));
    
    setCards(cardPairs);
    setFlippedCards([]);
    setMatchedPairs(0);
    setAttempts(0);
    setGameComplete(false);
    setStartTime(Date.now());
    setGameStarted(true);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setAttempts(prev => prev + 1);
      
      const [firstIndex, secondIndex] = flippedCards;
      
      if (cards[firstIndex].value === cards[secondIndex].value) {
        setCards(prev => 
          prev.map(card => 
            card.id === firstIndex || card.id === secondIndex
              ? { ...card, matched: true }
              : card
          )
        );
        setMatchedPairs(prev => prev + 1);
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          setCards(prev => 
            prev.map(card => 
              card.id === firstIndex || card.id === secondIndex
                ? { ...card, flipped: false }
                : card
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (gameStarted && matchedPairs === 6) {
      const endTimeValue = Date.now();
      setEndTime(endTimeValue);
      setGameComplete(true);
      
      const duration = (endTimeValue - startTime) / 1000;
      const score = Math.max(100 - (attempts - 6) * 10, 10);
      
      addGameScore('matching', score, duration);
      
      toast({
        title: "Game Complete!",
        description: `You found all matches in ${attempts} attempts.`,
      });
    }
  }, [matchedPairs, attempts, gameStarted, startTime, addGameScore, toast]);

  const handleCardClick = (id: number) => {
    if (
      gameComplete ||
      cards[id].flipped ||
      cards[id].matched ||
      flippedCards.length === 2
    ) {
      return;
    }
    
    setCards(prev => 
      prev.map(card => 
        card.id === id
          ? { ...card, flipped: true }
          : card
      )
    );
    
    setFlippedCards(prev => [...prev, id]);
  };

  const getGameDuration = (): string => {
    const seconds = Math.floor((endTime - startTime) / 1000);
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  return (
    <MobileLayout title="Matching Game">
      <div className="p-4">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Matching Game</h1>
            <p className="text-sm text-gray-500">Find all matching pairs</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Attempts: {attempts}</p>
            <p className="text-sm font-medium">Pairs: {matchedPairs}/6</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-6">
          {cards.map(card => (
            <motion.div
              key={card.id}
              whileHover={{ scale: card.flipped || card.matched ? 1 : 1.05 }}
              whileTap={{ scale: card.flipped || card.matched ? 1 : 0.95 }}
              className={`aspect-square rounded-lg overflow-hidden cursor-pointer shadow-sm ${
                card.matched ? 'bg-green-100 shadow-green-200' : 'bg-white'
              }`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className={`card-flip ${card.flipped || card.matched ? 'flipped' : ''} w-full h-full`}>
                <div className="card-front backface-hidden bg-mindboost-primary flex items-center justify-center text-white text-2xl font-bold">
                </div>
                <div className="card-back backface-hidden flex items-center justify-center text-4xl">
                  {card.value}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {gameComplete ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-mindboost-primary text-white p-4 rounded-lg shadow-lg"
          >
            <h2 className="text-xl font-bold mb-2">Congratulations!</h2>
            <p>You've completed the game in {attempts} attempts.</p>
            <p>Time: {getGameDuration()}</p>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={initializeGame}
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
        ) : (
          <button
            onClick={initializeGame}
            className="w-full mindboost-button"
          >
            New Game
          </button>
        )}
      </div>
    </MobileLayout>
  );
};

export default MatchingGame;
