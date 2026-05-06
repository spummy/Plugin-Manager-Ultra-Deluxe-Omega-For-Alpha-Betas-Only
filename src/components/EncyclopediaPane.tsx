import { useState } from 'react';
import { PluginData, LogEntry } from '../types';
import { researchEncyclopedia } from '../lib/gemini';
import { BookOpen, RefreshCw, Server, AlertCircle, Youtube, Lightbulb, Hexagon, Globe } from 'lucide-react';

interface EncyclopediaPaneProps {
  plugin: PluginData;
  onUpdate: (id: string, updates: Partial<PluginData>) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

export function EncyclopediaPane({ plugin, onUpdate, addLog }: EncyclopediaPaneProps) {
  const [isResearching, setIsResearching] = useState(false);

  const handleResearch = async () => {
    setIsResearching(true);
    addLog({ type: 'info', message: `Fetching encyclopedia data for ${plugin.name} by ${plugin.manufacturer}...` });
    
    const result = await researchEncyclopedia(plugin.name, plugin.manufacturer || "Unknown");
    
    if (result) {
      onUpdate(plugin.id, {
        companyDescription: result.companyDescription,
        aiSummary: result.aiSummary,
        tips: result.tips,
        youtubeQuery: result.youtubeQuery
      });
      addLog({ type: 'success', message: `Encyclopedia entry updated for ${plugin.name}.` });
    } else {
      addLog({ type: 'error', message: `Failed to fetch encyclopedia entry for ${plugin.name}.` });
    }
    
    setIsResearching(false);
  };

  const hasData = plugin.companyDescription || plugin.aiSummary || (plugin.tips && plugin.tips.length > 0);

  return (
    <div className="flex flex-col gap-6 text-sm text-gray-300">
      
      {/* Action Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <h3 className="font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Encyclopedia
        </h3>
        <button
          onClick={handleResearch}
          disabled={isResearching}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-200 rounded-lg flex items-center gap-2 border border-gray-700/50 transition-colors text-xs font-medium"
        >
          {isResearching ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Server className="w-3 h-3"/>}
          {hasData ? "Update Entry" : "Fetch Entry via AI"}
        </button>
      </div>

      {!hasData && !isResearching && (
         <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/20">
           <AlertCircle className="w-8 h-8 text-gray-600 mb-3" />
           <p className="text-gray-400 font-medium">No extended data available.</p>
           <p className="text-xs text-gray-500 mt-1 max-w-[200px]">Click fetch to generate a deep-dive analysis from community consensus.</p>
         </div>
      )}

      {isResearching && (
        <div className="flex items-center justify-center py-12 space-x-2 text-indigo-400">
           <RefreshCw className="w-5 h-5 animate-spin" />
           <span className="font-mono text-xs tracking-widest uppercase">Synthesizing...</span>
        </div>
      )}

      {hasData && !isResearching && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
           {plugin.domain && (
             <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
               <Globe className="w-4 h-4 text-blue-400" />
               <a href={`https://${plugin.domain}`} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200 underline underline-offset-2 font-mono">
                 {plugin.domain}
               </a>
             </div>
           )}

           {plugin.companyDescription && (
             <section>
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Hexagon className="w-3 h-3 text-purple-400" /> Vendor Description
               </h4>
               <p className="leading-relaxed text-gray-300 bg-gray-900/50 p-4 rounded-xl border border-gray-800/50">
                 {plugin.companyDescription}
               </p>
             </section>
           )}

           {plugin.aiSummary && (
             <section>
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <BookOpen className="w-3 h-3 text-emerald-400" /> Community Consensus
               </h4>
               <p className="leading-relaxed text-emerald-100/80 bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20">
                 {plugin.aiSummary}
               </p>
             </section>
           )}

           {plugin.tips && plugin.tips.length > 0 && (
             <section>
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Lightbulb className="w-3 h-3 text-amber-400" /> Pro Tips
               </h4>
               <ul className="space-y-2">
                 {plugin.tips.map((tip, i) => (
                   <li key={i} className="flex items-start gap-3 bg-gray-900/50 p-3 rounded-lg border border-gray-800/50">
                     <span className="text-amber-500/50 font-bold font-mono mt-0.5">{i+1}.</span>
                     <span className="text-gray-300">{tip}</span>
                   </li>
                 ))}
               </ul>
             </section>
           )}

           {plugin.youtubeQuery && (
             <section className="pt-4 border-t border-gray-800">
               <a 
                 href={`https://www.youtube.com/results?search_query=${encodeURIComponent(plugin.youtubeQuery)}`}
                 target="_blank"
                 rel="noreferrer"
                 className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-colors group"
               >
                 <div className="flex items-center gap-3">
                   <Youtube className="w-6 h-6 text-red-500" />
                   <div>
                     <p className="text-red-100 font-bold text-sm">Find Tutorials on YouTube</p>
                     <p className="text-red-400/50 text-xs mt-0.5 font-mono">Query: {plugin.youtubeQuery}</p>
                   </div>
                 </div>
               </a>
             </section>
           )}
        </div>
      )}
    </div>
  );
}
