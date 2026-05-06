import { useState, useEffect, useRef } from 'react';
import { PluginData } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, X, Zap, CornerDownLeft } from 'lucide-react';
import Fuse from 'fuse.js';

interface SpeedrunCLIProps {
  isOpen: boolean;
  onClose: () => void;
  plugins: PluginData[];
  onNavigate: (view: string) => void;
  onSearch: (query: string) => void;
  onIdentify: () => void;
}

type OutputBlock = {
  id: string;
  command?: string;
  content: React.ReactNode;
};

export function SpeedrunCLI({ isOpen, onClose, plugins, onNavigate, onSearch, onIdentify }: SpeedrunCLIProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<OutputBlock[]>([
    { id: 'welcome', content: <WelcomeMessage /> }
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fuse = new Fuse(plugins, {
    keys: ['name', 'manufacturer', 'category', 'tags', 'formats'],
    threshold: 0.3,
    includeScore: true
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const addOutput = (command: string, content: React.ReactNode) => {
    setHistory(prev => [...prev, { id: Math.random().toString(36).substring(7), command, content }]);
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    
    setCommandHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const [action, ...args] = trimmed.split(' ');
    const argStr = args.join(' ');
    const lowerAction = action.toLowerCase();

    switch (lowerAction) {
      case 'help':
        addOutput(trimmed, <HelpMessage />);
        break;
      case 'clear':
        setHistory([]);
        break;
      case 'ls':
      case 'search':
      case 'f':
        if (!argStr) {
          addOutput(trimmed, <div className="text-gray-400">Usage: {lowerAction} &lt;query&gt;</div>);
        } else {
          const results = fuse.search(argStr).slice(0, 10);
          if (results.length === 0) {
            addOutput(trimmed, <div className="text-gray-500">No plugins found matching '{argStr}'.</div>);
          } else {
            addOutput(trimmed, (
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-500 uppercase tracking-widest mb-1 border-b border-gray-800 pb-1">Top {results.length} Results</div>
                {results.map(({ item }) => (
                  <div key={item.id} className="flex items-center justify-between text-sm hover:bg-gray-800 px-2 py-1 -mx-2 rounded transition-colors group">
                    <span className="text-emerald-400 font-bold w-1/3 truncate">{item.name}</span>
                    <span className="text-gray-400 w-1/3 truncate">{item.manufacturer}</span>
                    <span className="text-gray-500 text-xs uppercase w-1/3 text-right">{item.category}</span>
                  </div>
                ))}
              </div>
            ));
          }
        }
        break;
      case 'cd':
      case 'goto':
      case 'view':
        const target = argStr.toLowerCase();
        const views = ['dashboard', 'plugins', 'word-generator', 'settings', 'show-prep', 'routing'];
        if (views.includes(target)) {
          onNavigate(target);
          addOutput(trimmed, <div className="text-emerald-400">Navigating to {target}...</div>);
          setTimeout(() => onClose(), 500);
        } else {
          addOutput(trimmed, <div className="text-red-400">Unknown view '{target}'. Available: {views.join(', ')}</div>);
        }
        break;
      case 'filter':
        onSearch(argStr);
        onNavigate('plugins');
        addOutput(trimmed, <div className="text-emerald-400">Applying global filter "{argStr}"...</div>);
        setTimeout(() => onClose(), 500);
        break;
      case 'stats':
        const totalSize = plugins.reduce((acc, p) => acc + (p.sizeMb || 0), 0);
        addOutput(trimmed, (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm max-w-sm">
            <span className="text-gray-500">Total Plugins:</span><span className="text-white font-mono">{plugins.length}</span>
            <span className="text-gray-500">Total Disk Size:</span><span className="text-white font-mono">{(totalSize / 1024).toFixed(2)} GB</span>
            <span className="text-gray-500">Unidentified:</span>
            <span className="text-amber-500 font-mono">
              {plugins.filter(p => !p.tags?.length || p.category === 'Unknown').length}
            </span>
          </div>
        ));
        break;
      case 'fix':
      case 'identify':
        if (argStr === 'unknowns') {
          onIdentify();
          addOutput(trimmed, <div className="text-emerald-400 flex items-center gap-2"><Zap className="w-4 h-4"/> Initiating batch identification subroutine...</div>);
          setTimeout(() => onClose(), 800);
        } else {
          addOutput(trimmed, <div className="text-gray-400">Usage: fix unknowns</div>);
        }
        break;
      default:
        // Default to a quick search if not a command
        const fallbackResults = fuse.search(trimmed).slice(0, 5);
        if (fallbackResults.length > 0) {
           addOutput(trimmed, (
              <div className="flex flex-col gap-1">
                <div className="text-xs text-blue-500 uppercase tracking-widest mb-1">Implicit Search</div>
                {fallbackResults.map(({ item }) => (
                  <div key={item.id} className="flex gap-4 text-sm">
                    <span className="text-white font-medium">{item.name}</span>
                    <span className="text-gray-500">{item.category}</span>
                  </div>
                ))}
              </div>
           ));
        } else {
           addOutput(trimmed, <div className="text-red-400">Command not found: {action}. Type 'help' for available commands.</div>);
        }
    }
    
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4 font-mono"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-3xl bg-gray-950 border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header */}
          <div className="h-10 border-b border-gray-800 flex justify-between items-center px-4 bg-gray-900 shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Speedrun CLI</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-sm" onClick={() => inputRef.current?.focus()}>
            {history.map((block) => (
              <div key={block.id} className="space-y-1">
                {block.command && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-blue-500">❯</span>
                    <span>{block.command}</span>
                  </div>
                )}
                <div className="text-gray-300 ml-4">
                  {block.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex items-center gap-3 shrink-0 relative">
            <span className="text-blue-500 font-bold text-lg">❯</span>
            <input 
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search plugins..."
              className="flex-1 bg-transparent text-gray-200 outline-none placeholder-gray-600"
              autoComplete="off"
              spellCheck="false"
            />
            <div className="absolute right-4 text-[10px] text-gray-500 hidden sm:flex items-center gap-2">
               <span className="flex items-center gap-1 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">RET <CornerDownLeft className="w-3 h-3"/></span> 
               <span>to execute</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function WelcomeMessage() {
  return (
    <div className="space-y-2 text-gray-400">
      <div className="text-emerald-400 font-bold mb-2">CLI Initialized v2.1.0</div>
      <div>Execute commands quickly without touching the mouse.</div>
      <div>Type <span className="text-white font-bold bg-gray-800 px-1 py-0.5 rounded">help</span> to see available fast-actions.</div>
    </div>
  );
}

function HelpMessage() {
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
      <div className="text-white font-bold">search &lt;q&gt;</div><div className="text-gray-500">Fuzzy find plugins (alias: f, ls)</div>
      <div className="text-white font-bold">filter &lt;q&gt;</div><div className="text-gray-500">Set global filter and jump to grid</div>
      <div className="text-white font-bold">goto &lt;view&gt;</div><div className="text-gray-500">Switch view (dashboard|plugins|settings|show-prep|routing)</div>
      <div className="text-white font-bold">stats</div><div className="text-gray-500">Print registry statistics</div>
      <div className="text-white font-bold">fix unknowns</div><div className="text-gray-500">Run AI identification subroutine</div>
      <div className="text-white font-bold">clear</div><div className="text-gray-500">Clear terminal output</div>
    </div>
  );
}
