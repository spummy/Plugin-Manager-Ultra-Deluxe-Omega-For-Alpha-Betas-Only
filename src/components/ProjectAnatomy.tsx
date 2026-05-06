import { useState, useRef } from 'react';
import { PluginData, DAWProject, TrackLayer } from '../types';
import { Upload, FileAudio, FileCode, Share, RefreshCw, LayoutList, Layers, Folder, Download, ArrowRight, Activity, Network, SlidersHorizontal, Play, Square, Link, Volume2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

const DAW_MAPPINGS: Record<string, Record<string, string>> = {
  'rpp-to-als': { 'ReaEQ': 'EQ Eight', 'ReaComp': 'Compressor', 'ReaDelay': 'Delay', 'ReaVerb': 'Reverb' },
  'als-to-rpp': { 'EQ Eight': 'ReaEQ', 'Compressor': 'ReaComp', 'Delay': 'ReaDelay', 'Reverb': 'ReaVerb' },
  'logic-to-als': { 'Channel EQ': 'EQ Eight', 'Space Designer': 'Hybrid Reverb', 'Compressor': 'Compressor' },
  'als-to-logic': { 'EQ Eight': 'Channel EQ', 'Hybrid Reverb': 'Space Designer', 'Compressor': 'Compressor' }
};

export function ProjectAnatomy({ plugins, onSendToShowPrep }: { plugins: PluginData[], onSendToShowPrep: (project: DAWProject) => void }) {
  const [project, setProject] = useState<DAWProject | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<'flowchart' | 'assets' | 'absuite'>('flowchart');
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeAB, setActiveAB] = useState<'A' | 'B'>('A');
  const [abPlaying, setAbPlaying] = useState(false);

  const [translatedPluginIds, setTranslatedPluginIds] = useState<Record<string, string>>({});

  const mockAssets = [
    { id: '1', name: 'Kick_Punchy_01.wav', size: '1.2 MB', type: 'audio', isNew: false },
    { id: '2', name: 'Snare_Acoustic_03.wav', size: '0.8 MB', type: 'audio', isNew: false },
    { id: '3', name: 'Serum_Bass_Heavy.fxp', size: '12 KB', type: 'preset', isNew: false },
    { id: '4', name: 'MIDI_Chord_Prog_01.mid', size: '4 KB', type: 'midi', isNew: false },
    { id: '5', name: 'Vocal_Take_04_Comp.wav', size: '24.5 MB', type: 'audio', isNew: false },
    { id: '6', name: 'Master_Mix_v2.wav', size: '44.1 MB', type: 'audio', isNew: true }, // Inbox item
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ext = file.name.split('.').pop()?.toLowerCase();
      const format = ext === 'als' ? 'als' : 'rpp';
      
      let parsedTracks: TrackLayer[] = [];
      
      if (ext === 'rpp') {
        const lines = content.split('\n');
        let currentTrack: Partial<TrackLayer> | null = null;
        let inNotes = false;
        let inRenderCfg = false;
        let trackCounter = 1;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // Note & Metadata Filter
          if (line.trim().startsWith('<NOTES')) {
             inNotes = true;
             continue;
          }
          if (inNotes && line.trim().startsWith('>')) {
             inNotes = false;
             continue;
          }
          if (line.trim().startsWith('<RENDER_CFG')) {
             inRenderCfg = true;
             continue;
          }
          if (inRenderCfg && line.trim().startsWith('>')) {
             inRenderCfg = false;
             continue;
          }
          
          if (inNotes || inRenderCfg) continue;

          // Exact Indentation Match: <TRACK must be preceded by exactly 4 spaces
          if (line.startsWith('    <TRACK') && !line.startsWith('     <TRACK')) {
            currentTrack = {
              id: String(trackCounter++),
              name: '',
              type: 'audio',
              color: '#10b981', // Default color
              plugins: [],
            };
            continue;
          }
          
          // Buffer Reset Logic: clears context when it hits `    >` at exactly 4 spaces
          if (line.startsWith('    >') && !line.startsWith('     >')) {
            if (currentTrack) {
               // Oracle Engine Lock: decoupled, tracks must have a defined name from the RPP
               if (currentTrack.name && currentTrack.name.trim() !== '') {
                  currentTrack.plugins = getRandomPlugins(Math.floor(Math.random() * 4));
                  parsedTracks.push(currentTrack as TrackLayer);
               }
               currentTrack = null;
            }
            continue;
          }

          if (currentTrack) {
            const nameMatch = line.match(/^\s+NAME\s+(.*)/);
            if (nameMatch) {
               currentTrack.name = nameMatch[1].replace(/["']/g, '').trim();
            }
          }
        }
      }

      // Fallback for non-rpp or if parser didn't find any tracks
      if (parsedTracks.length === 0) {
        parsedTracks = [
          { id: '1', name: 'Drums', type: 'folder', color: '#10b981', plugins: [], isFolder: true },
          { id: '2', name: 'Kick', type: 'audio', color: '#10b981', plugins: getRandomPlugins(2), parentId: '1', cpuLoadPercent: 4 },
          { id: '3', name: 'Snare', type: 'audio', color: '#10b981', plugins: getRandomPlugins(4), parentId: '1', cpuLoadPercent: 15, needsStemBouncing: true },
          { id: '4', name: 'Serum Bass', type: 'midi', color: '#3b82f6', plugins: getRandomPlugins(1), cpuLoadPercent: 8, sidechainInputs: ['2'] },
          { id: '5', name: 'Vocals', type: 'audio', color: '#ec4899', plugins: getRandomPlugins(2), cpuLoadPercent: 6 },
          { id: '6', name: 'Master', type: 'bus', color: '#f59e0b', plugins: getRandomPlugins(5), cpuLoadPercent: 22, needsStemBouncing: true },
        ];
      }

      const newDProject: DAWProject = {
        id: Math.random().toString(36).substring(7),
        name: file.name.replace(/\.[^/.]+$/, ""),
        sourceFormat: format as any,
        tracks: parsedTracks
      };
      setProject(newDProject);
    };
    reader.readAsText(file);
  };

  const getRandomPlugins = (count: number) => {
    if (plugins.length === 0) return [];
    const arr: string[] = [];
    for (let i = 0; i < count; i++) {
       const p = plugins[Math.floor(Math.random() * plugins.length)];
       if (p) arr.push(p.id);
    }
    return arr;
  };

  const translateFormat = () => {
    if (!project) return;
    setIsTranslating(true);
    setTimeout(() => {
      const key = project.sourceFormat === 'als' ? 'als-to-rpp' : project.sourceFormat === 'rpp' ? 'rpp-to-als' : 'als-to-logic';
      const mapConfig = DAW_MAPPINGS[key] || DAW_MAPPINGS['als-to-rpp'];
      
      const nextTranslated: Record<string, string> = { ...translatedPluginIds };
      
      project.tracks.forEach(track => {
         track.plugins.forEach(pId => {
            const plugin = plugins.find(x => x.id === pId);
            if (plugin && mapConfig[plugin.name]) {
               nextTranslated[pId] = mapConfig[plugin.name];
            } else if (plugin && translatedPluginIds[pId]) {
               // if translating back
               const reverseMapKey = project.sourceFormat === 'als' ? 'rpp-to-als' : 'als-to-rpp';
               if (DAW_MAPPINGS[reverseMapKey]?.[translatedPluginIds[pId]]) {
                   nextTranslated[pId] = DAW_MAPPINGS[reverseMapKey][translatedPluginIds[pId]];
               }
            }
         });
      });

      setTranslatedPluginIds(nextTranslated);

      setProject({
        ...project,
        sourceFormat: project.sourceFormat === 'als' ? 'rpp' : 'als',
        name: project.name + " (Translated)"
      });
      setIsTranslating(false);
    }, 1200);
  };

  const renderTrackItem = (t: TrackLayer) => (
    <div key={t.id} className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden group ${t.parentId ? 'ml-8 mt-2 shadow-[inset_4px_0_0_rgba(16,185,129,0.2)]' : ''} ${t.needsStemBouncing ? 'ring-1 ring-amber-500/50' : ''}`}>
      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: t.color }} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-gray-600 font-bold w-4">{t.id}</span>
          {t.isFolder && <Folder className="w-4 h-4 text-emerald-500" />}
          <span className="text-white font-bold">{t.name}</span>
          <span className="text-[10px] uppercase font-bold bg-gray-800 px-2 py-0.5 rounded text-gray-400">{t.type}</span>
        </div>
        <div className="flex items-center gap-3">
          {t.sidechainInputs && t.sidechainInputs.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
               <Link className="w-3 h-3" /> SC: {t.sidechainInputs.join(',')}
            </div>
          )}
          {t.cpuLoadPercent && (
             <div className={`text-[10px] font-mono px-2 py-0.5 rounded ${t.cpuLoadPercent > 12 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-800 text-gray-400'}`}>
                CPU: {t.cpuLoadPercent}%
             </div>
          )}
        </div>
      </div>

      {!t.isFolder && (
        <div className="pl-7 flex items-center flex-wrap gap-3">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 bg-gray-950 px-2 py-1 border border-gray-800 rounded">Input</div>
          {t.plugins.map((pId) => {
             const plugin = plugins.find(x => x.id === pId);
             const displayName = translatedPluginIds[pId] || plugin?.name || 'Unknown';
             return (
               <div key={pId + displayName} className="flex items-center gap-3">
                  <ArrowRight className="w-4 h-4 text-gray-700" />
                  <div className="flex flex-col bg-gray-950 border border-blue-900/30 rounded-lg p-2 min-w-[120px] shadow-lg shadow-black/20 relative group-hover:border-blue-500/50 transition-colors">
                     <div className="text-xs text-gray-300 font-bold truncate max-w-[150px] group-hover:text-white transition-colors">
                       {displayName}
                     </div>
                     <div className="text-[10px] text-gray-500">{plugin?.category || 'FX'}</div>
                  </div>
               </div>
             );
          })}
          <ArrowRight className="w-4 h-4 text-gray-700 ml-1" />
          <div className="text-[10px] uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 border border-emerald-500/20 rounded">Output</div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-950 custom-scrollbar flex flex-col items-center">
      <div className="max-w-5xl w-full space-y-8">
        
        <header>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
             <Layers className="w-8 h-8 text-pink-500" /> Project Anatomy
          </h1>
          <p className="text-gray-500">Import DAW projects (.ALS, .RPP), view plugin payload sizes, translate between formats, and send to Show Prep.</p>
        </header>

        {!project ? (
          <div className="border-2 border-dashed border-gray-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center bg-gray-900/30">
            <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6">
              <Upload className="w-8 h-8 text-pink-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-200 mb-2">Import DAW Project</h2>
            <p className="text-sm text-gray-500 mb-8 max-w-md">Drop an Ableton Live Set (.als) or Reaper Project (.rpp) to parse track and plugin routing data.</p>
            <input type="file" ref={fileRef} className="hidden" accept=".als,.rpp" onChange={handleFileUpload} />
            <button onClick={() => fileRef.current?.click()} className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
              <FileAudio className="w-5 h-5"/> Browse Files
            </button>
          </div>
        ) : (
          <div className="flex gap-8 items-start">
             
             {/* Left Column: Project Overview */}
             <div className="w-80 shrink-0 space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                   <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                     {project.sourceFormat === 'als' ? <FileCode className="w-6 h-6 text-blue-400"/> : <FileAudio className="w-6 h-6 text-emerald-400"/>}
                     <div>
                       <div className="text-sm font-bold text-white truncate max-w-[200px]">{project.name}</div>
                       <div className="text-[10px] text-gray-500 uppercase tracking-widest">{project.sourceFormat.toUpperCase()} Project</div>
                     </div>
                   </div>

                   <button 
                     disabled={isTranslating}
                     onClick={translateFormat}
                     className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg flex items-center justify-center gap-2 text-sm font-bold border border-gray-700 transition-all mb-3 disabled:opacity-50"
                   >
                     {isTranslating ? <RefreshCw className="w-4 h-4 animate-spin text-pink-400"/> : <Share className="w-4 h-4 text-pink-400"/>}
                     {isTranslating ? 'Translating...' : `Translate to ${project.sourceFormat === 'als' ? '.RPP' : '.ALS'}`}
                   </button>
                   
                   <button 
                     onClick={() => onSendToShowPrep(project)}
                     className="w-full py-2.5 px-4 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-lg flex items-center justify-center gap-2 text-sm font-bold border border-indigo-500/30 transition-all"
                   >
                     <LayoutList className="w-4 h-4"/> Send to Show Prep
                   </button>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                   <div className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-4">Plugin Summary</div>
                   <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                      <span>Total Instances</span>
                      <span className="font-mono font-bold">{project.tracks.reduce((acc, t) => acc + t.plugins.length, 0)}</span>
                   </div>
                   <div className="flex items-center justify-between text-sm text-gray-300">
                      <span>Unique Plugins</span>
                      <span className="font-mono font-bold text-emerald-400">
                         {new Set(project.tracks.flatMap(t => t.plugins)).size}
                      </span>
                   </div>
                </div>
             </div>

             {/* Right Column: Tabs & Content */}
             <div className="flex-1 space-y-6">
                <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                   <button 
                     onClick={() => setActiveTab('flowchart')}
                     className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'flowchart' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                     <Network className="w-4 h-4"/> Flowchart
                   </button>
                   <button 
                     onClick={() => setActiveTab('assets')}
                     className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'assets' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                     <Folder className="w-4 h-4"/> Project Asset Hub
                   </button>
                </div>

                {activeTab === 'flowchart' ? (
                  <div className="space-y-6">
                    {project.tracks.map(renderTrackItem)}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden p-6">
                       <div className="flex items-center justify-between mb-6">
                          <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                            <SlidersHorizontal className="w-4 h-4 text-emerald-400" /> A/B Comparison Suite
                          </h3>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                         {['A', 'B'].map((slot) => (
                           <div key={slot} className={`border ${activeAB === slot ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-gray-800 bg-gray-950'} rounded-xl p-4 transition-colors relative`}>
                              <div className="flex items-center justify-between mb-4">
                                <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${activeAB === slot ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-500'}`}>{slot}</div>
                                <select className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-emerald-500/50">
                                   <option>Select Asset...</option>
                                   {mockAssets.filter(a => a.type === 'audio').map(a => <option key={a.id}>{a.name}</option>)}
                                </select>
                              </div>
                              <div className="flex items-center gap-3">
                                <button className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 text-gray-300">
                                  <Play className="w-3 h-3 ml-0.5" />
                                </button>
                                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden flex">
                                   {abPlaying && activeAB === slot ? (
                                      <motion.div 
                                        className="h-full bg-emerald-500" 
                                        animate={{ width: ['10%', '60%', '30%', '90%', '50%'] }}
                                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                      />
                                   ) : (
                                      <div className="w-[30%] h-full bg-emerald-500/20" />
                                   )}
                                </div>
                              </div>
                              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                                <Volume2 className="w-3 h-3" />
                                <input type="range" className="flex-1" />
                              </div>
                              {activeAB === slot && (
                                <button 
                                  onClick={() => setAbPlaying(!abPlaying)}
                                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 transition-all"
                                >
                                  {abPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                                </button>
                              )}
                           </div>
                         ))}
                       </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                       <div className="grid grid-cols-[1fr_100px_80px] gap-4 p-4 border-b border-gray-800 text-[10px] uppercase tracking-widest font-bold text-gray-500 bg-gray-950/50">
                          <div>Asset Name</div>
                          <div>Size</div>
                          <div className="text-right">Action</div>
                       </div>
                       <div className="divide-y divide-gray-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                         {mockAssets.map((asset) => (
                           <div key={asset.id} className="grid grid-cols-[1fr_100px_80px] gap-4 p-4 items-center hover:bg-gray-800/50 transition-colors">
                             <div className="flex items-center gap-3">
                               {asset.type === 'audio' ? <FileAudio className="w-4 h-4 text-emerald-400"/> : 
                                asset.type === 'midi' ? <Activity className="w-4 h-4 text-blue-400"/> : 
                                <FileCode className="w-4 h-4 text-pink-400"/>}
                               <span className="text-sm text-gray-300 font-medium truncate">{asset.name}</span>
                               {asset.isNew && (
                                 <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3"/> INBOX</span>
                               )}
                             </div>
                             <div className="text-xs text-gray-500 font-mono">{asset.size}</div>
                             <div className="text-right flex items-center justify-end gap-2">
                               {asset.type === 'audio' && (
                                 <button onClick={() => setActiveAB('B')} className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-emerald-400 transition-colors" title="Load to B">
                                   <ArrowRight className="w-4 h-4" />
                                 </button>
                               )}
                               <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                                 <Download className="w-4 h-4" />
                               </button>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
