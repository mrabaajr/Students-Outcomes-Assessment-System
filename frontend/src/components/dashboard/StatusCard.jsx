import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    className: 'bg-emerald-100 border-emerald-200',
    iconColor: 'text-emerald-600',
    progressColor: 'bg-gradient-to-r from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'bg-blue-100 border-blue-200',
    iconColor: 'text-blue-600',
    progressColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
  },
  warning: {
    icon: AlertCircle,
    label: 'Needs Attention',
    className: 'bg-amber-100 border-amber-200',
    iconColor: 'text-amber-600',
    progressColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    className: 'bg-red-100 border-red-200',
    iconColor: 'text-red-600',
    progressColor: 'bg-gradient-to-r from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
  },
};

const StatusCard = ({ title, description, status, progress, delay = 0 }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`${config.bgColor} rounded-lg p-6 shadow-md hover:shadow-lg transition-all duration-300 border-2 ${config.className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-800 mb-1">
            {title}
          </h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${config.className}`}>
          <StatusIcon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600 font-medium">Progress</span>
            <span className="font-bold text-slate-800">{progress}%</span>
          </div>
          <div className="h-3 bg-white border border-slate-200 rounded-full overflow-hidden shadow-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, delay: delay + 0.3, ease: 'easeOut' }}
              className={`h-full ${config.progressColor} rounded-full shadow-md`}
            />
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t-2 border-current border-opacity-10">
        <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${config.iconColor}`}>
          <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
          {config.label}
        </span>
      </div>
    </motion.div>
  );
};

export default StatusCard;
