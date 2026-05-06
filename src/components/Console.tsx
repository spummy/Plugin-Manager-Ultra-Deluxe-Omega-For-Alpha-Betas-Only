import { useState, useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { Terminal, CheckCircle2, AlertCircle, Info, AlertTriangle, X, Maximize2, Minimize2, Move } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConsoleProps {
  logs: LogEntry[];
  onClose: () => void;
}

export function SystemConsole({ logs, onClose }: ConsoleProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (!isMinimized) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isMinimized]);

  return (
    <motion.div 
      drag
      dragMomentum={false}
      dragConstraints={{ left: -500, right: 0, top: -800, bottom: 0 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
         position: 'fixed',
         bottom: 24,
         right: 24,
         zIndex: 100
      }}
      className={`bg-[#0a0a0c]/95 backdrop-blur-xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-80 h-12 rounded-lg' : 'w-[400px] h-[300px] sm:w-[500px] sm:h-[400px] rounded-xl'
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-[#0f0f13]/80 cursor-grab active:cursor-grabbing group">
        <Move className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Terminal className="w-4 h-4 text-blue-500" />
        <h2 className="font-bold text-gray-100 tracking-widest uppercase text-xs">System Console</h2>
        <span className="ml-2 text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{logs.length}</span>
        
        <div className="ml-auto flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-white/10 rounded">
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar text-xs font-mono">
          <AnimatePresence initial={false}>
            {logs.map(log => (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 py-1.5 hover:bg-white/5 px-2 rounded -mx-2 transition-colors"
              >
                <div className="shrink-0 mt-0.5">
                  {log.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-400" />}
                  {log.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                  {log.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                  {log.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                <span className={`break-words ${log.type === 'error' ? 'text-red-400' : log.type === 'warning' ? 'text-yellow-400' : 'text-gray-300'}`}>
                  {log.message}
                </span>
              </motion.div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-600 text-center mt-10 italic">System ready. Awaiting operational input...</div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
      )}
    </motion.div>
  );
}
