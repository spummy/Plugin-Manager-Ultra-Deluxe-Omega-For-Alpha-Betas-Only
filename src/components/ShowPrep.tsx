import { useState, useMemo, useEffect } from 'react';
import { PluginData, TrackLayer, DAWProject } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutList, Search, Plus, Trash2, Cpu, Activity, Download, HardDrive } from 'lucide-react';

export function ShowPrep({ plugins, initialProject }: { plugins: PluginData[], initialProject?: DAWProject | null }) {
  const [tracks, setTracks] = useState<TrackLayer[]>(() => {
    if (initialProject) {
      return initialProject.tracks;
    }
    return [
      { id: '1', name: 'Lead Synth', type: 'midi', color: '#3b82f6', plugins: [] },
      { id: '2', name: 'Drum Bus', type: 'audio', color: '#10b981', plugins: [] },
    ];
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (initialProject) {
      setTracks(initialProject.tracks);
    }
  }, [initialProject]);

  const availablePlugins = useMemo(() => {
    if (!searchQuery.trim()) return plugins;
    const lower = searchQuery.toLowerCase();
    return plugins.filter(p => p.name.toLowerCase().includes(lower) || p.manufacturer.toLowerCase().includes(lower));
  }, [plugins, searchQuery]);

  const addTrack = () => {
    setTracks([...tracks, { 
      id: Math.random().toString(36).substr(2, 9), 
      name: `Track ${tracks.length + 1}`, 
      type: 'audio', 
      color: '#8b5cf6', 
      plugins: [] 
    }]);
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };

  const addPluginToTrack = (trackId: string, pluginId: string) => {
    setTracks(tracks.map(t => {
      if (t.id === trackId && !t.plugins.includes(pluginId)) {
        return { ...t, plugins: [...t.plugins, pluginId] };
      }
      return t;
    }));
  };

  const removePluginFromTrack = (trackId: string, pluginId: string) => {
    setTracks(tracks.map(t => {
      if (t.id === trackId) {
        return { ...t, plugins: t.plugins.filter(id => id !== pluginId) };
      }
      return t;
    }));
  };

  const tracksWithLoad = useMemo(() => {
    return tracks.map(t => {
      let dummyCpu = 0;
      let dummyRam = 0;
      t.plugins.forEach(pId => {
        const p = plugins.find(x => x.id === pId);
        if (p) {
          dummyRam += p.sizeMb ? p.sizeMb * 0.5 : 50;
          dummyCpu += p.category.toLowerCase().includes('synth') ? 4 : 1.5;
        }
      });
      
      const needsStemBouncing = dummyCpu > 12;
      return { ...t, dummyCpu, dummyRam, needsStemBouncing };
    });
  }, [tracks, plugins]);

  const systemLoad = useMemo(() => {
    let dummyCpu = 0;
    let dummyRam = 0;
    tracksWithLoad.forEach(t => {
      dummyCpu += t.dummyCpu;
      dummyRam += t.dummyRam;
    });
    return {
      cpu: Math.min(dummyCpu, 100),
      ram: Math.min(dummyRam, 16000)
    };
  }, [tracksWithLoad]);

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-950">
      {/* Sidebar: Plugin Browser */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900/50 flex flex-col z-10 shrink-0 h-[40%] md:h-auto">
        <div className="p-4 border-b border-gray-800 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search plugins to add..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder-gray-600 transition-all cursor-text"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {availablePlugins.map(p => (
            <div 
              key={p.id} 
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-plugin-id', p.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              className="p-3 bg-gray-900 border border-gray-800 hover:border-gray-700 hover:bg-gray-800/50 rounded-lg cursor-grab active:cursor-grabbing transition-colors group flex flex-col gap-1"
            >
              <div className="flex items-center justify-between pointer-events-none">
                <span className="text-sm font-medium text-gray-200 truncate pr-2">{p.name}</span>
                <span className="text-[10px] text-gray-500">{p.manufacturer}</span>
              </div>
              <div className="flex items-center justify-between mt-2 pointer-events-none">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-gray-950 px-1.5 py-0.5 rounded">{p.category}</span>
                <span className="text-[10px] text-gray-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Drag me</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Area: Multitrack Template */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="p-6 border-b border-gray-800 flex justify-between items-end shrink-0 relative z-10 bg-gray-950">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 mb-1">
              <LayoutList className="w-6 h-6 text-indigo-400" /> Live Show Template
            </h1>
            <p className="text-sm text-gray-500">Configure your multitrack set and estimate CPU/RAM load.</p>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={addTrack} className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 font-medium rounded-lg border border-gray-800 transition-colors">
               <Plus className="w-4 h-4" /> Add Track
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-bold border border-indigo-500/30 rounded-lg transition-colors">
               <Download className="w-4 h-4" /> Export Config JSON
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar relative z-10">
          <AnimatePresence>
            {tracksWithLoad.map(track => (
              <motion.div 
                key={track.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-indigo-500/50', 'bg-indigo-900/10');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-indigo-500/50', 'bg-indigo-900/10');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-indigo-500/50', 'bg-indigo-900/10');
                  const pluginId = e.dataTransfer.getData('application/x-plugin-id');
                  if (pluginId) {
                    addPluginToTrack(track.id, pluginId);
                  }
                }}
                className={`bg-gray-900 border ${track.needsStemBouncing ? 'border-amber-500/50' : 'border-gray-800'} rounded-xl overflow-hidden shadow-lg shadow-black/20 transition-colors duration-200`}
              >
                <div className="flex items-center p-3 border-b border-gray-800 bg-gray-950/50">
                  <div className="w-3 h-3 rounded-full mr-3 shrink-0" style={{ backgroundColor: track.color }} />
                  <input 
                     value={track.name}
                     onChange={(e) => setTracks(tracks.map(t => t.id === track.id ? { ...t, name: e.target.value } : t))}
                     className="bg-transparent text-sm font-bold text-gray-200 outline-none w-48 mr-4"
                  />
                  <select 
                    value={track.type}
                    onChange={(e) => setTracks(tracks.map(t => t.id === track.id ? { ...t, type: e.target.value as any } : t))}
                    className="bg-gray-900 border border-gray-800 text-xs text-gray-400 px-2 py-1 rounded outline-none uppercase font-bold tracking-widest mr-auto"
                  >
                    <option value="audio">Audio</option>
                    <option value="midi">MIDI</option>
                    <option value="bus">Bus</option>
                    <option value="return">Return</option>
                  </select>

                  {track.needsStemBouncing && (
                     <div className="mr-4 px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/50 flex items-center gap-1.5 animate-pulse">
                        <Activity className="w-3 h-3" />
                        CPU High ({(track.dummyCpu || 0).toFixed(1)}%) - Stem-ify Recommended
                     </div>
                  )}

                  <button onClick={() => removeTrack(track.id)} className="p-2 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4 bg-gray-900/30 min-h-[80px] flex gap-3 overflow-x-auto flex-wrap">
                  {track.plugins.length === 0 && (
                    <div className="w-full flex items-center justify-center text-xs text-gray-600 italic">No plugins added to this track.</div>
                  )}
                  {track.plugins.map(pId => {
                    const p = plugins.find(x => x.id === pId);
                    if (!p) return null;
                    return (
                      <div key={pId} className="flex flex-col relative group bg-gray-950 border border-gray-800 rounded-lg p-3 w-48 shrink-0 shadow-md">
                        <span className="text-sm font-bold text-gray-300 truncate">{p.name}</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{p.category}</span>
                        <button 
                          onClick={() => removePluginFromTrack(track.id, pId)}
                          className="absolute -top-2 -right-2 bg-gray-800 text-gray-400 hover:text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="flex gap-2 mt-4 items-center">
                           <div className="text-[8px] uppercase tracking-widest text-emerald-500">VU</div>
                           <div className="flex-1 h-1 bg-gray-800 rounded overflow-hidden flex">
                              <motion.div 
                                className="h-full bg-emerald-500/70" 
                                animate={{ width: ['30%', '80%', '40%', '95%', '50%'] }}
                                transition={{ repeat: Infinity, duration: 1.5 + Math.random(), ease: "anticipate" }}
                              />
                           </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Diagnostics Overlay */}
        <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl border border-gray-800 bg-gray-950/80 backdrop-blur-md shadow-2xl z-20 flex flex-col md:flex-row items-center gap-6 justify-between">
           <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                 <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Diagnostics Check</h4>
                 <div className="text-[11px] text-gray-500 mt-0.5">Real-time mock estimates based on selected plugins</div>
              </div>
           </div>
           
           <div className="flex items-center gap-6 flex-1 max-w-xl">
             {/* CPU load */}
              <div className="flex-1">
               <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1.5">
                 <span className="text-gray-400 flex items-center gap-1"><Cpu className="w-3 h-3"/> CPU Load</span>
                 <span className={systemLoad.cpu > 75 ? "text-red-400" : "text-emerald-400"}>{systemLoad.cpu.toFixed(1)}%</span>
               </div>
               <div className="h-1.5 bg-gray-800 rounded overflow-hidden w-full relative">
                 <div 
                   className={`absolute top-0 bottom-0 left-0 bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-700`}
                   style={{ width: `${systemLoad.cpu}%` }}
                 />
                 {systemLoad.cpu > 75 && <div className="absolute top-0 bottom-0 left-0 bg-red-500 animate-pulse transition-all duration-700" style={{ width: `${systemLoad.cpu}%` }} />}
               </div>
             </div>

             {/* RAM usage */}
             <div className="flex-1">
               <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1.5">
                 <span className="text-gray-400 flex items-center gap-1"><HardDrive className="w-3 h-3"/> RAM Usage</span>
                 <span className={systemLoad.ram > 12000 ? "text-red-400" : "text-emerald-400"}>{(systemLoad.ram / 1000).toFixed(2)} GB</span>
               </div>
               <div className="h-1.5 bg-gray-800 rounded overflow-hidden w-full relative">
                 <div 
                   className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                   style={{ width: `${Math.min((systemLoad.ram / 16000) * 100, 100)}%` }}
                 />
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
