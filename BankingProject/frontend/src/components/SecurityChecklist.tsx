import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SecurityCheck {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'passed' | 'failed';
}

interface SecurityChecklistProps {
  checks: SecurityCheck[];
  className?: string;
  showDetails?: boolean;
}

const SecurityChecklist: React.FC<SecurityChecklistProps> = ({ 
  checks, 
  className = '', 
  showDetails = true 
}) => {
  const passedCount = checks.filter(check => check.status === 'passed').length;
  const totalCount = checks.length;
  const progressPercentage = (passedCount / totalCount) * 100;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="h-5 w-5 text-success-400" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-error-400" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'border-success-500/30 bg-success-500/10';
      case 'failed':
        return 'border-error-500/30 bg-error-500/10';
      default:
        return 'border-warning-500/30 bg-warning-500/10';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-success-500';
    if (percentage >= 60) return 'bg-accent-500';
    if (percentage >= 40) return 'bg-warning-400';
    return 'bg-error-500';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Overview */}
      <div className="bg-white/10 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white/90">Security Requirements</span>
          <span className="text-sm text-white/70">
            {passedCount}/{totalCount} Completed
          </span>
        </div>
        
        <div className="w-full bg-white/20 rounded-full h-2 mb-3">
          <motion.div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(progressPercentage)}`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {progressPercentage < 100 && (
          <p className="text-xs text-white/60">
            Complete all security requirements to proceed
          </p>
        )}
      </div>

      {/* Detailed Checklist */}
      {showDetails && (
        <div className="space-y-2">
          {checks.map((check, index) => (
            <motion.div
              key={check.id}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${getStatusColor(check.status)}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="mt-0.5">
                {getStatusIcon(check.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`text-sm font-medium ${
                    check.status === 'passed' ? 'text-success-300' :
                    check.status === 'failed' ? 'text-error-300' : 'text-warning-300'
                  }`}>
                    {check.label}
                  </h4>
                  
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    check.status === 'passed' ? 'bg-success-500/20 text-success-300' :
                    check.status === 'failed' ? 'bg-error-500/20 text-error-300' : 'bg-warning-500/20 text-warning-300'
                  }`}>
                    {check.status === 'passed' ? 'Passed' :
                     check.status === 'failed' ? 'Failed' : 'Pending'}
                  </span>
                </div>
                
                <p className="text-xs text-white/70 mt-1">
                  {check.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Security Recommendations */}
      {passedCount < totalCount && (
        <motion.div
          className="bg-accent-500/20 border border-accent-500/30 rounded-lg p-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-accent-300 font-medium text-sm mb-2 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Security Recommendations
          </h4>
          
          <ul className="text-xs text-white/80 space-y-1">
            {checks.filter(check => check.status === 'failed').map(failedCheck => (
              <li key={failedCheck.id} className="flex items-start gap-2">
                <span className="text-accent-400 mt-0.5">•</span>
                <span>{failedCheck.description}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Success Message */}
      {passedCount === totalCount && (
        <motion.div
          className="bg-success-500/20 border border-success-500/30 rounded-lg p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        >
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="h-5 w-5 text-success-400" />
            <div>
              <h4 className="text-success-300 font-medium text-sm">All Security Requirements Met!</h4>
              <p className="text-success-200 text-xs mt-1">
                Your password meets all security standards and is ready for use.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SecurityChecklist;