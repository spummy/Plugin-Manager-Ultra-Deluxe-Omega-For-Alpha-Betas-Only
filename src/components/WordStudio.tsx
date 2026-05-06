import { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, UploadCloud, RefreshCw, Trash2, Settings, Copy, Check, Plus, Cpu, Dices } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateWords } from '../lib/gemini';

const DEFAULT_WORDS = [
  'Deep', 'Sonic', 'Digital', 'Analog', 'Hyper', 'Ethereal', 'Grit', 'Pure', 'Dark', 'Luminous',
  'Resonance', 'Frequency', 'Phase', 'Envelope', 'Oscillate', 'Waveform', 'Synthesis', 
  'Distortion', 'Harmonic', 'Timbre', 'Quantum', 'Nebula', 'Velocity', 'Modulation', 'Transient'
];

const TEMPLATES = [
  "{word}",
  "{word} {word}",
  "The {word} of {word}",
  "{word} {word} {word}",
  "Project {word}",
  "{word}izer",
  "Auto{word}"
];

export function WordStudio() {
  const [words, setWords] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [generatedWords, setGeneratedWords] = useState<string[]>([]);
  
  const [wordInput, setWordInput] = useState('');
  const [copied, setCopied] = useState<string | false>(false);
  
  const [template, setTemplate] = useState<string>("{word} {word}");
  const [quantity, setQuantity] = useState<number>(3);
  const [isExpanding, setIsExpanding] = useState(false);
  const [expandTheme, setExpandTheme] = useState('analog synthesis');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage or defaults
  useEffect(() => {
    const savedWords = localStorage.getItem('ai-studio-words');
    const savedHistory = localStorage.getItem('ai-studio-history');
    
    setWords(savedWords ? JSON.parse(savedWords) : DEFAULT_WORDS);
    setHistory(savedHistory ? JSON.parse(savedHistory) : []);
  }, []);

  useEffect(() => {
    if (words.length > 0) localStorage.setItem('ai-studio-words', JSON.stringify(words));
    localStorage.setItem('ai-studio-history', JSON.stringify(history));
    setWordInput(words.join('\n'));
  }, [words, history]);

  const generateWord = () => {
    if (words.length === 0) {
      setGeneratedWords(['Missing dictionary items']);
      return;
    }
    setCopied(false);
    
    const results: string[] = [];
    for (let i = 0; i < quantity; i++) {
        let result = template;
        const matches = result.match(/\{word\}/g) || [];
        
        for (const _ of matches) {
           const randomWord = words[Math.floor(Math.random() * words.length)];
           result = result.replace("{word}", randomWord);
        }
        results.push(result);
    }
    
    setGeneratedWords(results);
    setHistory(prev => [...results, ...prev].slice(0, 50));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveDictionaries = () => {
    const newWords = wordInput.split('\n').map(s => s.trim()).filter(Boolean);
    const unique = Array.from(new Set(newWords));
    setWords(unique);
  };

  const expandDictionary = async () => {
    setIsExpanding(true);
    const newWords = await generateWords(expandTheme, 20);
    if (newWords.length > 0) {
       setWords(prev => {
          const combined = Array.from(new Set([...prev, ...newWords]));
          return combined;
       });
    }
    setIsExpanding(false);
  };

  const handleExport = () => {
    const content = `[WORDS]\n${words.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word_generator_dictionary.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('['));
      if (lines.length > 0) {
         setWords(prev => Array.from(new Set([...prev, ...lines])));
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
       fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex w-full h-full bg-gray-950 text-gray-200">
      <main className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-white flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-blue-500" />
            Word Studio
          </h1>
          <p className="text-gray-400 mt-2">Generate perfect branding names and plugin titles using dynamic templates.</p>
        </header>

        <div className="max-w-2xl w-full mx-auto mb-12 space-y-6">
           <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">Generation Template</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {TEMPLATES.map(t => (
                  <button 
                    key={t}
                    onClick={() => setTemplate(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${template === t ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' : 'bg-gray-950 text-gray-400 border-gray-800 hover:border-gray-700'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-4">
                   <input 
                     value={template}
                     onChange={(e) => setTemplate(e.target.value)}
                     className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 font-mono"
                     placeholder="Enter custom template using {word}..."
                   />
                   <div className="flex items-center bg-gray-950 border border-gray-800 rounded-xl overflow-hidden shrink-0">
                      <span className="px-3 text-xs text-gray-500 font-bold border-r border-gray-800">QTY</span>
                      <select 
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="bg-transparent text-gray-200 text-sm px-3 py-3 focus:outline-none font-mono cursor-pointer"
                      >
                        {[1, 2, 3, 5, 10].map(n => (
                          <option key={n} value={n} className="bg-gray-900">{n}</option>
                        ))}
                      </select>
                   </div>
                   <button 
                     onClick={generateWord}
                     className="px-6 py-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold font-sans flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] shrink-0"
                   >
                     <Dices className="w-4 h-4" /> Generate
                   </button>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
          <AnimatePresence mode="popLayout">
            {generatedWords.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6 mb-12 w-full max-w-2xl"
              >
                {generatedWords.map((word, i) => (
                  <div
                    key={`${word}-${i}`}
                    className="group relative cursor-pointer w-full text-center py-4 bg-gray-900/30 hover:bg-gray-800/50 rounded-2xl border border-transparent hover:border-gray-800 transition-all"
                    onClick={() => copyToClipboard(word)}
                    title="Click to copy"
                  >
                    <div className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 tracking-tighter transition-all group-hover:scale-105 px-4 mb-2">
                      {word}
                    </div>
                    <div className="absolute inset-x-0 bottom-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {copied === word ? (
                        <span className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full"><Check className="w-3 h-3" /> Copied</span>
                      ) : (
                        <span className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900 px-3 py-1 rounded-full border border-gray-800"><Copy className="w-3 h-3" /> Click to copy</span>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <aside className="w-[400px] bg-gray-900/50 border-l border-gray-800 flex flex-col shrink-0">
        <div className="flex border-b border-gray-800">
          <div className="flex-1 px-6 py-4 flex items-center gap-2 font-bold text-white border-r border-gray-800">
             <Settings className="w-4 h-4 text-blue-400" /> Master Dictionary
          </div>
          <div className="flex">
            <button 
              onClick={handleExport}
              className="px-4 hover:bg-gray-800 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
              title="Export as .txt"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 hover:bg-gray-800 transition-colors flex items-center justify-center text-gray-400 hover:text-white"
              title="Import .txt"
            >
              <UploadCloud className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              accept=".txt" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImport}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          
          {/* AI Expansion Tool */}
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
             <label className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Cpu className="w-3 h-3" /> AI Expand Dictionary
             </label>
             <div className="flex gap-2">
               <input 
                 value={expandTheme}
                 onChange={e => setExpandTheme(e.target.value)}
                 className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500/50 focus:outline-none"
                 placeholder="Theme (e.g. quantum physics)"
               />
               <button 
                 onClick={expandDictionary}
                 disabled={isExpanding}
                 className="px-3 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-600/30 transition-colors disabled:opacity-50 flex items-center gap-1"
               >
                 {isExpanding ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/> } Add 20
               </button>
             </div>
          </div>

          <div className="flex-1 flex flex-col space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex justify-between">
              <span>Word List</span>
              <span>{words.length} items</span>
            </label>
            <textarea 
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              onBlur={saveDictionaries}
              className="w-full flex-1 min-h-[300px] bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-300 font-mono focus:outline-none focus:border-blue-500/50 resize-none custom-scrollbar"
              placeholder="One word per line..."
            />
          </div>

          <div className="pt-6 border-t border-gray-800 shrink-0">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-gray-400">Recent Output</h3>
               <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1">
                 <Trash2 className="w-3 h-3" /> Clear
               </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {history.length > 0 ? history.map((h, i) => (
                <div 
                  key={i} 
                  onClick={() => copyToClipboard(h)}
                  className="px-4 py-2 bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-lg text-sm text-gray-300 font-medium cursor-pointer transition-colors flex justify-between items-center group"
                  title="Click to copy"
                >
                  <span className="truncate pr-4">{h}</span>
                  <Copy className="w-3 h-3 text-gray-600 group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
              )) : (
                <div className="text-center text-sm text-gray-600 py-4 font-mono">No history yet</div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
