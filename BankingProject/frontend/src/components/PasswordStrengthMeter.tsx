import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface StrengthCriteria {
  id: string;
  label: string;
  test: (password: string) => boolean;
  description: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password, className = '' }) => {
  const criteria: StrengthCriteria[] = [
    {
      id: 'length',
      label: 'Length',
      test: (pwd) => pwd.length >= 12,
      description: 'At least 12 characters'
    },
    {
      id: 'lowercase',
      label: 'Lowercase',
      test: (pwd) => /[a-z]/.test(pwd),
      description: 'Contains lowercase letters'
    },
    {
      id: 'uppercase',
      label: 'Uppercase',
      test: (pwd) => /[A-Z]/.test(pwd),
      description: 'Contains uppercase letters'
    },
    {
      id: 'numbers',
      label: 'Numbers',
      test: (pwd) => /\d/.test(pwd),
      description: 'Contains numbers'
    },
    {
      id: 'special',
      label: 'Special',
      test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      description: 'Contains special characters'
    },
    {
      id: 'no-common',
      label: 'Not Common',
      test: (pwd) => !isCommonPassword(pwd),
      description: 'Not a commonly used password'
    }
  ];

  const passedCriteria = criteria.filter(criterion => criterion.test(password));
  const strengthScore = (passedCriteria.length / criteria.length) * 100;

  const getStrengthColor = (score: number) => {
    if (score >= 90) return 'bg-success-500';
    if (score >= 70) return 'bg-accent-500';
    if (score >= 50) return 'bg-warning-400';
    if (score >= 30) return 'bg-warning-500';
    return 'bg-error-500';
  };

  const getStrengthText = (score: number) => {
    if (score >= 90) return 'Very Strong';
    if (score >= 70) return 'Strong';
    if (score >= 50) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Weak';
  };

  const isCommonPassword = (password: string): boolean => {
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    return commonPasswords.includes(password.toLowerCase());
  };

  const getTimeToCrack = (password: string): string => {
    const length = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const charsetSize = (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasNumber ? 10 : 0) + (hasSpecial ? 32 : 0);
    const possibleCombinations = Math.pow(charsetSize, length);
    const secondsToCrack = possibleCombinations / 1000000000; // Assuming 1 billion attempts per second

    if (secondsToCrack < 1) return 'Instantly';
    if (secondsToCrack < 60) return 'Seconds';
    if (secondsToCrack < 3600) return 'Minutes';
    if (secondsToCrack < 86400) return 'Hours';
    if (secondsToCrack < 31536000) return 'Days';
    if (secondsToCrack < 31536000000) return 'Years';
    return 'Millions of years';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/80">Password Strength</span>
          <span className={`text-xs font-medium ${
            strengthScore >= 90 ? 'text-success-300' :
            strengthScore >= 70 ? 'text-accent-300' :
            strengthScore >= 50 ? 'text-warning-300' :
            strengthScore >= 30 ? 'text-warning-400' : 'text-error-300'
          }`}>
            {getStrengthText(strengthScore)}
          </span>
        </div>
        
        <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(strengthScore)}`}
            initial={{ width: 0 }}
            animate={{ width: `${strengthScore}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Time to Crack */}
      {password.length > 0 && (
        <div className="text-xs text-white/60">
          Estimated time to crack: <span className="font-medium">{getTimeToCrack(password)}</span>
        </div>
      )}

      {/* Criteria Checklist */}
      <div className="grid grid-cols-2 gap-2">
        {criteria.map((criterion) => {
          const isPassed = criterion.test(password);
          return (
            <motion.div
              key={criterion.id}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${
                isPassed ? 'bg-success-500/20 border border-success-500/30' : 'bg-white/5 border border-white/10'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {isPassed ? (
                <CheckCircleIcon className="h-4 w-4 text-success-400" />
              ) : (
                <XCircleIcon className="h-4 w-4 text-white/40" />
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${
                  isPassed ? 'text-success-300' : 'text-white/70'
                }`}>
                  {criterion.label}
                </div>
                <div className="text-xs text-white/50 truncate">
                  {criterion.description}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Security Tips */}
      {password.length > 0 && strengthScore < 70 && (
        <motion.div
          className="bg-accent-500/20 border border-accent-500/30 rounded-lg p-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="text-accent-300 font-medium text-sm mb-2">Security Tips</h4>
          <ul className="text-xs text-white/80 space-y-1">
            <li>• Use a mix of uppercase, lowercase, numbers, and special characters</li>
            <li>• Avoid common words, names, or personal information</li>
            <li>• Consider using a passphrase instead of a single word</li>
            <li>• Use different passwords for different accounts</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;