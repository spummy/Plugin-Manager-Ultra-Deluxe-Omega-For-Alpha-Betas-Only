import { useState, useEffect, useRef } from 'react';
import { PluginData, MidiMapping } from '../types';
import { Sliders, Cable, Layers } from 'lucide-react';

export function RoutingHub({ plugins }: { plugins: PluginData[] }) {
  const [midiAccess, setMidiAccess] = useState<any>(null);
  const [midiInputs, setMidiInputs] = useState<any[]>([]);
  const [selectedInput, setSelectedInput] = useState<string>('');
  const [lastMidiMessage, setLastMidiMessage] = useState<{cc: number, value: number, channel: number} | null>(null);

  const [mappings, setMappings] = useState<MidiMapping[]>([
    { id: 'm1', pluginId: plugins[0]?.id || '', parameterName: 'Cutoff', ccNumber: 74, channel: 1 },
    { id: 'm2', pluginId: plugins[0]?.id || '', parameterName: 'Resonance', ccNumber: 71, channel: 1 },
  ]);

  const [avActive, setAvActive] = useState(false);
  const [learningMode, setLearningMode] = useState<string | null>(null); // mapping ID we are learning
  
  // Fake simple scope loop for A/V
  const scopeRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    // Attempt MIDI access
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess().then(
        (access) => {
          setMidiAccess(access);
          const inputs = Array.from(access.inputs.values());
          setMidiInputs(inputs);
          if (inputs.length > 0) setSelectedInput(inputs[0].id);
          
          access.onstatechange = () => {
            setMidiInputs(Array.from(access.inputs.values()));
          };
        },
        (err) => console.log('MIDI Access failed', err)
      );
    }
  }, []);

  useEffect(() => {
    if (!midiAccess || !selectedInput) return;
    const input = midiAccess.inputs.get(selectedInput);
    if (!input) return;

    input.onmidimessage = (message: any) => {
      const data = message.data;
      if (data.length === 3 && (data[0] & 0xf0) === 0xb0) { // Control Change
        const channel = (data[0] & 0x0f) + 1;
        const cc = data[1];
        const val = data[2];
        setLastMidiMessage({ cc, value: val, channel });
        
        if (learningMode) {
           setMappings(prev => prev.map(m => m.id === learningMode ? { ...m, ccNumber: cc, channel } : m));
           setLearningMode(null);
        }
      }
    };
    return () => { input.onmidimessage = null; };
  }, [midiAccess, selectedInput, learningMode]);

  // A/V Canvas Draw Loop
  useEffect(() => {
    if (!scopeRef.current) return;
    const ctx = scopeRef.current.getContext('2d');
    if (!ctx) return;
    
    let time = 0;
    let req: number;

    const draw = () => {
      time += 0.05;
      const w = scopeRef.current!.width;
      const h = scopeRef.current!.height;
      
      ctx.fillStyle = 'rgba(17, 24, 39, 0.2)'; // fade trail
      ctx.fillRect(0, 0, w, h);
      
      if (avActive) {
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
          const mod = Math.sin((i * 0.02) + time) * 20;
          const noise = (Math.random() - 0.5) * 5;
          const y = h/2 + mod + noise;
          if (i === 0) ctx.moveTo(i, y);
          ctx.lineTo(i, y);
        }
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      req = requestAnimationFrame(draw);
    };
    req = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(req);
  }, [avActive]);


  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-950 p-6 md:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8 flex-1 flex flex-col">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
             <Cable className="w-8 h-8 text-amber-500" /> Advanced Routing & Telemetry
          </h1>
          <p className="text-gray-500">MIDI Mapping for hardware controllers and A/V Bridge configuration.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
          {/* MIDI Section */}
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col shadow-xl">
             <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                   <Sliders className="w-4 h-4 text-purple-400" /> MIDI Mapping
                </h2>
                {midiInputs.length > 0 ? (
                  <select 
                     value={selectedInput} 
                     onChange={e => setSelectedInput(e.target.value)}
                     className="bg-gray-950 border border-gray-700 text-xs px-2 py-1 rounded text-gray-300 outline-none"
                  >
                     {midiInputs.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                ) : (
                  <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-bold uppercase">No Devices Found</span>
                )}
             </div>

             <div className="flex-1 overflow-y-auto mb-4 space-y-3 custom-scrollbar">
                {mappings.map(m => {
                   const p = plugins.find(x => x.id === m.pluginId);
                   return (
                     <div key={m.id} className="bg-gray-950/50 border border-gray-800 rounded-xl p-4 flex items-center justify-between group">
                        <div>
                           <div className="text-sm font-bold text-gray-200">{m.parameterName}</div>
                           <div className="text-[10px] text-gray-500 uppercase mt-0.5">{p?.name || 'Unknown Plugin'}</div>
                        </div>
                        <div className="flex items-center gap-4 border-l border-gray-800 pl-4 ml-4">
                           <div className="text-center min-w-[60px]">
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">CC #</div>
                              <div className="text-sm text-purple-400 font-mono">{m.ccNumber}</div>
                           </div>
                           <div className="text-center min-w-[60px]">
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">CH</div>
                              <div className="text-sm text-purple-400 font-mono">{m.channel}</div>
                           </div>
                           <button 
                             onClick={() => setLearningMode(learningMode === m.id ? null : m.id)}
                             className={`px-3 py-1.5 text-xs font-bold uppercase rounded border transition-colors ${learningMode === m.id ? 'bg-amber-500 text-gray-900 border-amber-500 animate-pulse' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
                           >
                             {learningMode === m.id ? 'Listening...' : 'Learn'}
                           </button>
                        </div>
                     </div>
                   );
                })}
             </div>
             
             <div className="pt-4 border-t border-gray-800">
               <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Latest Incoming Message</div>
               <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 font-mono text-xs flex gap-6 text-gray-400">
                 {lastMidiMessage ? (
                   <>
                     <span>CC: <span className="text-white">{lastMidiMessage.cc}</span></span>
                     <span>Value: <span className="text-white">{lastMidiMessage.value}</span></span>
                     <span>CH: <span className="text-white">{lastMidiMessage.channel}</span></span>
                   </>
                 ) : <span>Waiting for MIDI data...</span>}
               </div>
             </div>
          </section>

          {/* A/V Bridge Section */}
          <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col shadow-xl">
             <div className="flex items-center justify-between mb-6 border-b border-gray-800 pb-4">
                <h2 className="text-sm font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
                   <Layers className="w-4 h-4 text-emerald-400" /> A/V Bridge (OSC/Data)
                </h2>
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 ${avActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                  <div className={`w-2 h-2 rounded-full ${avActive ? 'bg-emerald-500' : 'bg-gray-600'}`}/>
                  {avActive ? 'Transmitting' : 'Offline'}
                </div>
             </div>

             <div className="flex-1 flex flex-col gap-6">
                <div>
                   <label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Target Address</label>
                   <input 
                     defaultValue="127.0.0.1:8000"
                     className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-gray-300 font-mono focus:border-emerald-500/50 outline-none transition-colors"
                   />
                </div>
                <div>
                   <label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Protocol</label>
                   <select className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-gray-300 outline-none">
                      <option>OSC (Open Sound Control)</option>
                      <option>WebSockets (JSON)</option>
                      <option>Syphon / Spout Meta</option>
                   </select>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                   <button 
                     onClick={() => setAvActive(!avActive)}
                     className={`flex-1 py-3 items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs rounded-xl transition-all border ${avActive ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}
                   >
                     {avActive ? 'Stop Stream' : 'Initialize Bridge'}
                   </button>
                </div>

                <div className="relative h-32 rounded-xl overflow-hidden border border-gray-800 mt-2">
                  <canvas ref={scopeRef} width={400} height={128} className="w-full h-full bg-gray-950" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    {[1,2,3,4].map(idx => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full ${avActive && Math.random() > 0.3 ? 'bg-emerald-400' : 'bg-gray-800'}`} />
                    ))}
                  </div>
                </div>
             </div>
          </section>
        </div>
      </div>
    </div>
  )
}
