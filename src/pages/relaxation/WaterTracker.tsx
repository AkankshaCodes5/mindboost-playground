import { useState, useEffect } from 'react';
import MobileLayout from '../../components/MobileLayout';
import { useProgress } from '../../contexts/ProgressContext';
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { Droplet, Settings, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Slider } from "@/components/ui/slider";

const WaterTracker = () => {
  const { 
    dailyWaterGoal, 
    setDailyWaterGoal, 
    addWaterLog, 
    getTotalWaterToday, 
    getWaterPercentage,
    waterLogs,
    isLoading
  } = useProgress();
  
  const [showSettings, setShowSettings] = useState(false);
  const [newGoal, setNewGoal] = useState(dailyWaterGoal);
  const [waterAmount, setWaterAmount] = useState(200);
  const [totalWater, setTotalWater] = useState(0);
  const [percentage, setPercentage] = useState(0);
  
  const { toast } = useToast();

  useEffect(() => {
    setTotalWater(getTotalWaterToday());
    setPercentage(getWaterPercentage());
    setNewGoal(dailyWaterGoal);
  }, [getTotalWaterToday, getWaterPercentage, dailyWaterGoal, waterLogs]);

  const handleAddWater = async () => {
    await addWaterLog(waterAmount);
    setTotalWater(getTotalWaterToday());
    setPercentage(getWaterPercentage());
  };

  const handleSaveGoal = async () => {
    await setDailyWaterGoal(newGoal);
    setShowSettings(false);
  };

  const increaseWaterAmount = () => {
    setWaterAmount(prev => Math.min(prev + 50, 500));
  };

  const decreaseWaterAmount = () => {
    setWaterAmount(prev => Math.max(prev - 50, 50));
  };

  const handleSliderChange = (value: number[]) => {
    setNewGoal(value[0]);
  };

  const getMotivationalMessage = () => {
    if (percentage < 25) {
      return "You're just getting started! Keep drinking water.";
    } else if (percentage < 50) {
      return "Nice progress! Staying hydrated improves concentration.";
    } else if (percentage < 75) {
      return "Well done! You're more than halfway to your goal.";
    } else if (percentage < 100) {
      return "Almost there! A hydrated brain functions better.";
    } else {
      return "Congratulations! You've reached your daily water goal!";
    }
  };

  const predefinedGoals = [1500, 2000, 2500, 3000, 3500];

  return (
    <MobileLayout title="Water Tracker">
      <div className="p-4">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-mindboost-dark">Water Tracker</h1>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Settings className="w-5 h-5 text-mindboost-dark" />
            </button>
          </div>
          <p className="text-gray-500">
            Track your daily water intake for better brain performance
          </p>
        </div>
        
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-4 mb-6"
          >
            <h3 className="font-medium mb-3">Daily Water Goal</h3>
            
            <div className="mb-4 space-y-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>500ml</span>
                <span>4000ml</span>
              </div>
              <Slider
                min={500}
                max={4000}
                step={100}
                value={[newGoal]}
                onValueChange={handleSliderChange}
              />
              <div className="text-center font-medium">{newGoal}ml</div>
              
              <div className="grid grid-cols-5 gap-2 mt-3">
                {predefinedGoals.map(goal => (
                  <button
                    key={goal}
                    onClick={() => setNewGoal(goal)}
                    className={`text-xs py-1 px-2 rounded-md ${
                      newGoal === goal 
                        ? 'bg-mindboost-primary text-white' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {goal}ml
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleSaveGoal}
                className="bg-mindboost-primary text-white px-4 py-2 rounded-md text-sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mx-auto"></div>
                ) : (
                  'Save'
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Recommended daily water intake: 2000ml - 3000ml
            </p>
          </motion.div>
        )}
        
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <div className="water-glass">
              <motion.div
                initial={{ height: '0%' }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="water-fill"
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center text-mindboost-dark font-bold text-xl">
              {percentage}%
            </div>
          </div>
          
          <div className="text-center">
            <p className="font-semibold text-lg text-mindboost-dark">
              {totalWater} / {dailyWaterGoal} ml
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {getMotivationalMessage()}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h3 className="font-medium mb-3">Add Water</h3>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={decreaseWaterAmount}
              className="p-2 rounded-full bg-gray-100"
              disabled={waterAmount <= 50}
            >
              <ChevronDown className="w-5 h-5 text-mindboost-dark" />
            </button>
            <div className="flex items-center">
              <Droplet className="w-5 h-5 mr-2 text-blue-500" />
              <span className="text-xl font-bold">{waterAmount} ml</span>
            </div>
            <button
              onClick={increaseWaterAmount}
              className="p-2 rounded-full bg-gray-100"
              disabled={waterAmount >= 500}
            >
              <ChevronUp className="w-5 h-5 text-mindboost-dark" />
            </button>
          </div>
          <button
            onClick={handleAddWater}
            className="w-full flex items-center justify-center mindboost-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mx-auto"></div>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Add Water
              </>
            )}
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-2">Benefits of Hydration</h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li>• Improves cognitive performance</li>
            <li>• Enhances memory function</li>
            <li>• Regulates mood and reduces stress</li>
            <li>• Maintains concentration and alertness</li>
            <li>• Helps prevent headaches</li>
          </ul>
        </div>
      </div>
    </MobileLayout>
  );
};

export default WaterTracker;
