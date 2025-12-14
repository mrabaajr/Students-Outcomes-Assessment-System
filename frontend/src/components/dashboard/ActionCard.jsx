import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActionCard = ({ title, description, icon: Icon, to, delay = 0, variant = 'default' }) => {
  const navigate = useNavigate();

  const variants = {
    default: 'bg-card hover:bg-card border-border',
    primary: 'bg-primary hover:bg-primary/90 text-primary-foreground border-primary',
    accent: 'bg-accent hover:bg-accent/90 text-accent-foreground border-accent',
  };

  const textVariants = {
    default: {
      title: 'text-foreground',
      description: 'text-muted-foreground',
      icon: 'text-primary',
    },
    primary: {
      title: 'text-primary-foreground',
      description: 'text-primary-foreground/80',
      icon: 'text-primary-foreground',
    },
    accent: {
      title: 'text-accent-foreground',
      description: 'text-accent-foreground/80',
      icon: 'text-accent-foreground',
    },
  };

  const colors = textVariants[variant] || textVariants.default;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(to)}
      className={`w-full p-6 rounded-lg border shadow-card hover:shadow-card-hover transition-all duration-300 text-left group ${variants[variant]}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${variant === 'default' ? 'bg-primary/10' : 'bg-background/10'}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-display text-lg font-semibold ${colors.title}`}>
            {title}
          </h3>
          <p className={`text-sm mt-0.5 ${colors.description}`}>
            {description}
          </p>
        </div>
        <ChevronRight className={`w-5 h-5 ${colors.icon} group-hover:translate-x-1 transition-transform`} />
      </div>
    </motion.button>
  );
};

export default ActionCard;
