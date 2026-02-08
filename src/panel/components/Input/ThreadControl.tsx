import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, X } from 'lucide-react';

interface ThreadControlProps {
  isThread: boolean;
  threadLength: number;
  onThreadToggle: (isThread: boolean) => void;
  onLengthChange: (length: number) => void;
}

export const ThreadControl: React.FC<ThreadControlProps> = ({
  isThread,
  threadLength,
  onThreadToggle,
  onLengthChange,
}) => {
  const [showLengthSlider, setShowLengthSlider] = useState(isThread);

  const handleToggle = (value: boolean) => {
    onThreadToggle(value);
    setShowLengthSlider(value);
  };

  if (!isThread && !showLengthSlider) {
    // Show button to enable thread mode
    return (
      <button
        onClick={() => handleToggle(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Layers className="w-4 h-4" />
        <span>Thread Mode</span>
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-slate-700">
            Thread Mode: {threadLength} tweets
          </span>
        </div>
        <button
          onClick={() => handleToggle(false)}
          className="p-1 hover:bg-slate-200 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Length slider */}
      <div className="relative">
        <div className="flex items-center bg-slate-100 rounded-full p-1 border border-slate-200 relative">
          <motion.div
            className="absolute top-1 bottom-1 bg-blue-500 rounded-full shadow-sm z-0"
            initial={false}
            animate={{
              left: `calc(${((threadLength - 3) * 100) / 7}% + 4px)`,
              width: 'calc(14.28% - 4px)'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              onClick={() => onLengthChange(num)}
              className={`flex-1 py-1.5 text-xs font-semibold text-center rounded-full relative z-10 transition-colors ${
                threadLength === num ? "text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
