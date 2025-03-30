
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface ActivityCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  path: string;
  color?: string;
}

const ActivityCard = ({ title, description, icon, path, color = 'bg-mindboost-primary' }: ActivityCardProps) => {
  const navigate = useNavigate();

  return (
    <div 
      className="mindboost-card cursor-pointer hover:shadow-lg"
      onClick={() => navigate(path)}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 ${color} rounded-xl text-white`}>
          {icon}
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-mindboost-dark">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default ActivityCard;
