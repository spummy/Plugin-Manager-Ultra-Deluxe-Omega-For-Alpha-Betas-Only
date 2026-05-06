import React from 'react';
import { PluginData, AppSettings, UITheme, ViewDensity } from '../types';
import { Download, Trash2, Settings, Monitor, Layout } from 'lucide-react';
import Papa from 'papaparse';

interface SettingsViewProps {
  plugins: PluginData[];
  setPlugins: React.Dispatch<React.SetStateAction<PluginData[]>>;
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  addLog: (log: any) => void;
}

export function SettingsView({ plugins, setPlugins, settings, updateSettings, addLog }: SettingsViewProps) {
  const exportJSON = () => {
    const content = JSON.stringify(plugins, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizer_pro_library_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog({ type: 'success', message: 'Exported Library as JSON' });
  };

  const exportCSV = () => {
    const csv = Papa.unparse(plugins.map(p => ({
      ID: p.id,
      Name: p.name,
      Manufacturer: p.manufacturer,
      Category: p.category,
      Rating: p.rating || 0,
      Version: p.version,
      Domain: p.domain || '',
      AU: p.formats.au ? 'true' : 'false',
      VST: p.formats.vst ? 'true' : 'false',
      VST3: p.formats.vst3 ? 'true' : 'false',
      AAX: p.formats.aax ? 'true' : 'false',
      CLAP: p.formats.clap ? 'true' : 'false',
      SizeMB: p.sizeMb,
      Notes: p.notes,
      Tips: p.tips?.join(' | ') || '',
      YouTube: p.youtubeQuery || ''
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organizer_pro_library_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addLog({ type: 'success', message: 'Exported Library as CSV' });
  };

  const clearLibrary = () => {
    if (confirm("Are you sure you want to clear your entire plugin library? This cannot be undone unless you have a backup.")) {
      setPlugins([]);
      addLog({ type: 'warning', message: 'Entire plugin library cleared.' });
    }
  };

  const themes: { id: UITheme, label: string, color: string }[] = [
    { id: 'blue', label: 'Pro Blue', color: 'bg-blue-500' },
    { id: 'emerald', label: 'Studio Emerald', color: 'bg-emerald-500' },
    { id: 'purple', label: 'Deep Purple', color: 'bg-purple-500' },
    { id: 'rose', label: 'Crimson Rose', color: 'bg-rose-500' },
    { id: 'amber', label: 'Vintage Amber', color: 'bg-amber-500' }
  ];

  return (
    <div className="flex w-full h-full bg-[#0a0a0c] text-gray-200">
      <main className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar max-w-5xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-white flex items-center gap-4">
            <Settings className="w-8 h-8 text-blue-500" />
            System Configuration
          </h1>
          <p className="text-gray-400 mt-2">Manage library persistence, export data, and customize the interface.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Data Management Section */}
          <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
               <Monitor className="w-5 h-5 text-indigo-400" /> Data Persistence
            </h2>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Export Library</label>
                <div className="flex gap-4">
                  <button onClick={exportJSON} className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700/50 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
                     <Download className="w-4 h-4" /> Download JSON Backup
                  </button>
                  <button onClick={exportCSV} className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700/50 rounded-xl flex items-center justify-center gap-2 text-sm font-medium">
                     <Download className="w-4 h-4" /> Export CSV Table
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 space-y-3">
                <label className="text-xs font-bold text-red-500 uppercase tracking-widest block">Danger Zone</label>
                <button onClick={clearLibrary} className="px-4 py-3 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors border border-red-900/50 rounded-xl flex items-center justify-center gap-2 text-sm font-medium w-full">
                   <Trash2 className="w-4 h-4" /> Wipe Entire Database
                </button>
              </div>
            </div>
          </section>

          {/* Interface Customization */}
          <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
               <Layout className="w-5 h-5 text-emerald-400" /> UI Customization
            </h2>
            
            <div className="space-y-8">
              {/* Theme Colors */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4">Accent Theme</label>
                <div className="flex flex-wrap gap-4">
                  {themes.map(t => (
                    <button 
                      key={t.id}
                      onClick={() => updateSettings({ theme: t.id })}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${settings.theme === t.id ? 'bg-gray-800 border-gray-600 shadow-md' : 'bg-gray-950 border-gray-800 hover:bg-gray-900'}`}
                    >
                      <span className={`w-3 h-3 rounded-full ${t.color}`} />
                      <span className="text-sm font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* View Density */}
              <div className="pt-4 border-t border-gray-800">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-4">List View Density</label>
                <div className="flex bg-gray-950 border border-gray-800 rounded-lg p-1 w-max">
                  {(['compact', 'comfortable', 'spacious'] as ViewDensity[]).map(d => (
                    <button
                      key={d}
                      onClick={() => updateSettings({ density: d })}
                      className={`px-4 py-1.5 rounded-md text-sm capitalize font-medium transition-colors ${settings.density === d ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
