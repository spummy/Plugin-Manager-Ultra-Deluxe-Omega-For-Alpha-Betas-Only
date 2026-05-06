import { useState, useRef } from 'react';
import { PluginData, DAWProject } from '../types';
import { Upload, FileAudio, FileCode, Share, RefreshCw, LayoutList, Layers, Folder, Download, ArrowRight, Activity, Network } from 'lucide-react';

export function ProjectAnatomy({ plugins, onSendToShowPrep }: { plugins: PluginData[], onSendToShowPrep: (project: DAWProject) => void }) {
  const [project, setProject] = useState<DAWProject | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<'flowchart' | 'assets'>('flowchart');
  const fileRef = useRef<HTMLInputElement>(null);

  const mockAssets = [
    { id: '1', name: 'Kick_Punchy_01.wav', size: '1.2 MB', type: 'audio' },
    { id: '2', name: 'Snare_Acoustic_03.wav', size: '0.8 MB', type: 'audio' },
    { id: '3', name: 'Serum_Bass_Heavy.fxp', size: '12 KB', type: 'preset' },
    { id: '4', name: 'MIDI_Chord_Prog_01.mid', size: '4 KB', type: 'midi' },
    { id: '5', name: 'Vocal_Take_04_Comp.wav', size: '24.5 MB', type: 'audio' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate parsing the file
    setTimeout(() => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const mockFormat = ext === 'als' ? 'als' : 'rpp';
      
      const newDProject: DAWProject = {
        id: Math.random().toString(36).substring(7),
        name: file.name.replace(/\.[^/.]+$/, ""),
        sourceFormat: mockFormat as any,
        tracks: [
          { id: '1', name: 'Vocals', type: 'audio', color: '#ec4899', plugins: getRandomPlugins(2) },
          { id: '2', name: 'Drums', type: 'bus', color: '#10b981', plugins: getRandomPlugins(3) },
          { id: '3', name: 'Serum Bass', type: 'midi', color: '#3b82f6', plugins: getRandomPlugins(1) },
          { id: '4', name: 'Master', type: 'bus', color: '#f59e0b', plugins: getRandomPlugins(4) },
        ]
      };
      setProject(newDProject);
    }, 600);
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
      setProject({
        ...project,
        sourceFormat: project.sourceFormat === 'als' ? 'rpp' : 'als',
        name: project.name + " (Translated)"
      });
      setIsTranslating(false);
    }, 1200);
  };

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
                    {project.tracks.map((t, idx) => (
                      <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: t.color }} />
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 font-bold w-4">{idx + 1}</span>
                            <span className="text-white font-bold">{t.name}</span>
                            <span className="text-[10px] uppercase font-bold bg-gray-800 px-2 py-0.5 rounded text-gray-400">{t.type}</span>
                          </div>
                        </div>

                        <div className="pl-7 flex items-center flex-wrap gap-3">
                          <div className="text-[10px] uppercase tracking-widest text-gray-500 bg-gray-950 px-2 py-1 border border-gray-800 rounded">Input</div>
                          {t.plugins.map((pId, i) => {
                             const plugin = plugins.find(x => x.id === pId);
                             return (
                               <div key={i} className="flex items-center gap-3">
                                  <ArrowRight className="w-4 h-4 text-gray-700" />
                                  <div className="flex flex-col bg-gray-950 border border-blue-900/30 rounded-lg p-2 min-w-[120px] shadow-lg shadow-black/20 relative group-hover:border-blue-500/50 transition-colors">
                                     <div className="text-xs text-gray-300 font-bold truncate max-w-[150px] group-hover:text-white transition-colors">{plugin?.name || 'Unknown'}</div>
                                     <div className="text-[10px] text-gray-500">{plugin?.category || 'FX'}</div>
                                  </div>
                               </div>
                             );
                          })}
                          <ArrowRight className="w-4 h-4 text-gray-700 ml-1" />
                          <div className="text-[10px] uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 border border-emerald-500/20 rounded">Output</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                     <div className="grid grid-cols-[1fr_100px_80px] gap-4 p-4 border-b border-gray-800 text-[10px] uppercase tracking-widest font-bold text-gray-500 bg-gray-950/50">
                        <div>Asset Name</div>
                        <div>Size</div>
                        <div className="text-right">Action</div>
                     </div>
                     <div className="divide-y divide-gray-800">
                       {mockAssets.map(asset => (
                         <div key={asset.id} className="grid grid-cols-[1fr_100px_80px] gap-4 p-4 items-center hover:bg-gray-800/50 transition-colors">
                           <div className="flex items-center gap-3">
                             {asset.type === 'audio' ? <FileAudio className="w-4 h-4 text-emerald-400"/> : 
                              asset.type === 'midi' ? <Activity className="w-4 h-4 text-blue-400"/> : 
                              <FileCode className="w-4 h-4 text-pink-400"/>}
                             <span className="text-sm text-gray-300 font-medium truncate">{asset.name}</span>
                           </div>
                           <div className="text-xs text-gray-500 font-mono">{asset.size}</div>
                           <div className="text-right">
                             <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                               <Download className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                       ))}
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
