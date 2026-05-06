import { useMemo } from 'react';
import { PluginData } from '../types';
import { 
  PieChart, LineChart, Line, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid
} from 'recharts';
import { HardDrive, Library, Activity, Zap, Cpu } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#14b8a6'];

export function Dashboard({ plugins }: { plugins: PluginData[] }) {
  const stats = useMemo(() => {
    let totalSize = 0;
    const mfgs: Record<string, number> = {};
    const cats: Record<string, number> = {};
    const formats = { au: 0, vst: 0, vst3: 0, aax: 0, clap: 0 };
    
    plugins.forEach(p => {
      totalSize += p.sizeMb || 0;
      
      const m = p.manufacturer || 'Unknown';
      mfgs[m] = (mfgs[m] || 0) + 1;
      
      const c = p.category || 'Unknown';
      cats[c] = (cats[c] || 0) + 1;
      
      if (p.formats.au) formats.au++;
      if (p.formats.vst) formats.vst++;
      if (p.formats.vst3) formats.vst3++;
      if (p.formats.aax) formats.aax++;
      if (p.formats.clap) formats.clap++;
    });

    const mfgData = Object.entries(mfgs)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    const topMfg = mfgData.slice(0, 5);
    const otherMfgCount = mfgData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
    if (otherMfgCount > 0) {
      topMfg.push({ name: 'Other', value: otherMfgCount });
    }

    const catData = Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Show top 10

    const formatData = Object.entries(formats).map(([name, value]) => ({ name: name.toUpperCase(), value }));

    return {
      totalPlugins: plugins.length,
      totalSize: (totalSize / 1024).toFixed(2), // GB
      mfgData: topMfg,
      catData,
      formatData
    };
  }, [plugins]);

  // Fake waveform data for an audio-aesthetic visual
  const waveData = Array.from({ length: 50 }).map((_, i) => ({
    time: i,
    val: Math.sin(i / 2) * 50 + Math.random() * 20 + 50
  }));

  return (
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-950 text-gray-200">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Studio Intelligence</h1>
            <p className="text-gray-500">Comprehensive overview of your plugin ecosystem</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-xl text-blue-400">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="font-mono font-bold tracking-widest text-sm">ONLINE</span>
          </div>
        </header>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Plugins" value={stats.totalPlugins} icon={Library} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" />
          <StatCard title="Storage Footprint" value={`${stats.totalSize} GB`} icon={HardDrive} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
          <StatCard title="Manufacturers" value={Object.keys(stats.mfgData).length} icon={Cpu} color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20" />
          <StatCard title="Active Formats" value={stats.formatData.filter(f => f.value > 0).length} icon={Zap} color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20" />
        </div>

        {/* Visualizer & Manufacturers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">System Frequency</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={waveData}>
                  <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={true} animationDuration={2000} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-gray-950 to-transparent pointer-events-none" />
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Manufacturers</h2>
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={stats.mfgData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.mfgData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Categories & Formats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Top Categories</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.catData} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                  <XAxis type="number" stroke="#4b5563" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={11} width={100} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1f2937' }}
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                    {stats.catData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Format Distribution</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.formatData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} axisLine={false} tickLine={false} />
                  <YAxis stroke="#4b5563" fontSize={12} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#1f2937' }}
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.5rem' }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* System Health / Optimization */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
           <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <HardDrive className="w-4 h-4 text-emerald-400" /> Storage Hogs (Top 3)
              </h2>
              <div className="flex-1 space-y-3">
                 {[...plugins].filter(p => (p.sizeMb || 0) > 0).sort((a,b) => (b.sizeMb || 0) - (a.sizeMb || 0)).slice(0,3).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-950/50 border border-gray-800 rounded-lg">
                       <span className="text-sm font-medium text-gray-200 truncate pr-4">{p.name}</span>
                       <span className="text-xs font-mono text-emerald-400 whitespace-nowrap">{p.sizeMb} MB</span>
                    </div>
                 ))}
                 {[...plugins].filter(p => (p.sizeMb || 0) > 0).length === 0 && (
                    <div className="text-xs text-gray-500 italic p-3 text-center">No size data recorded.</div>
                 )}
              </div>
           </div>

           <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Zap className="w-4 h-4 text-amber-400" /> Untagged & Unknown
              </h2>
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-lg p-6 group">
                 <span className="text-4xl font-bold text-amber-500 mb-2 group-hover:scale-110 transition-transform">
                   {plugins.filter(p => !p.tags?.length || p.category === 'Unknown' || p.category === 'Not Supplied').length}
                 </span>
                 <span className="text-xs text-gray-500 uppercase tracking-widest text-center">Plugins needing Auto-Identify</span>
              </div>
           </div>

           <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 flex flex-col lg:col-span-1 md:col-span-2">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Library className="w-4 h-4 text-purple-400" /> Forgotten / Unrated
              </h2>
              <div className="flex-1 space-y-3">
                 {[...plugins].filter(p => !p.rating || p.rating === 0).slice(0,3).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-gray-950/50 border border-gray-800 rounded-lg">
                       <span className="text-sm font-medium text-gray-200 truncate pr-4">{p.name}</span>
                       <span className="text-[10px] uppercase font-bold text-purple-400/50 whitespace-nowrap bg-purple-500/10 px-2 py-0.5 rounded">Unrated</span>
                    </div>
                 ))}
                 {[...plugins].filter(p => !p.rating || p.rating === 0).length === 0 && (
                    <div className="text-xs text-gray-500 italic p-3 text-center">All plugins rated!</div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, border }: any) {
  return (
    <div className={`p-6 rounded-2xl border ${border} ${bg} flex flex-col justify-between overflow-hidden relative group`}>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-3xl font-bold text-white relative z-10">{value}</p>
      
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 group-hover:scale-150 transition-transform duration-700 bg-current ${color}`} />
    </div>
  );
}
