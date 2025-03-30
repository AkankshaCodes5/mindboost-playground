
import MobileLayout from '../../components/MobileLayout';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LucideIcon, Brain, Hash, Grid3X3, Palette } from 'lucide-react';

interface GameCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color: string;
}

const GameCard = ({ title, description, icon: Icon, path, color }: GameCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => navigate(path)}
      className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer"
    >
      <div className={`${color} h-2`}></div>
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`p-2.5 rounded-lg ${color.replace('bg-', 'bg-opacity-20 text-')}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MemoryGames = () => {
  const games = [
    {
      title: 'Matching Game',
      description: 'Find pairs of matching cards',
      icon: Brain,
      path: '/games/matching',
      color: 'bg-blue-500'
    },
    {
      title: 'Number Recall',
      description: 'Find numbers in ascending/descending order',
      icon: Hash,
      path: '/games/number-recall',
      color: 'bg-green-500'
    },
    {
      title: 'Object Sequencing',
      description: 'Recall and arrange objects correctly',
      icon: Grid3X3,
      path: '/games/object-sequencing',
      color: 'bg-purple-500'
    },
    {
      title: 'Stroop Test',
      description: 'Identify mismatched colors and text',
      icon: Palette,
      path: '/games/stroop-test',
      color: 'bg-orange-500'
    }
  ];

  return (
    <MobileLayout title="Memory Games">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4"
      >
        <h1 className="text-2xl font-bold mb-2">Memory Games</h1>
        <p className="text-gray-500 mb-6">
          Train your brain with these memory and concentration games
        </p>

        <div className="space-y-4">
          {games.map((game, index) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GameCard {...game} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </MobileLayout>
  );
};

export default MemoryGames;
