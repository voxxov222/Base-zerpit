import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Minus } from 'lucide-react';

interface DraggableWindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  defaultPosition?: { x: number, y: number };
}

export function DraggableWindow({ title, children, onClose, defaultPosition = { x: 50, y: 50 } }: DraggableWindowProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const windowRef = useRef(null);

  return (
    <motion.div
      ref={windowRef}
      drag
      dragMomentum={false}
      initial={defaultPosition}
      className="absolute z-50 flex flex-col bg-space-900/80 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden"
      style={{ minWidth: isMinimized ? '200px' : '320px', pointerEvents: 'auto' }}
    >
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 cursor-move">
        <span className="text-xs font-bold tracking-wider text-neon-blue uppercase">{title}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-400 hover:text-white transition-colors">
            <Minus size={14} />
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-red-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      )}
    </motion.div>
  );
}
