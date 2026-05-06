/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Folder, 
  File, 
  Search, 
  Dices, 
  Info, 
  Settings, 
  ChevronRight, 
  ChevronDown, 
  RefreshCw,
  Library,
  Tag,
  Hash,
  HardDrive,
  Link as LinkIcon,
  Database,
  Wand2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Upload,
  Cpu,
  X,
  LayoutGrid,
  Terminal,
  List as ListIcon,
  Archive,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  Activity,
  Cable,
  Command
} from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { INITIAL_PLUGINS } from './data/plugins';
import { PluginData, ExplorerItem, LogEntry, AppSettings, DAWProject } from './types';
import { researchPlugin, bulkCategorizePlugins } from './lib/gemini';
import { WordStudio } from './components/WordStudio';
import { SystemConsole } from './components/Console';
import { EncyclopediaPane } from './components/EncyclopediaPane';
import { SettingsView } from './components/SettingsView';
import { Dashboard } from './components/Dashboard';
import { ShowPrep } from './components/ShowPrep';
import { RoutingHub } from './components/RoutingHub';
import { SpeedrunCLI } from './components/SpeedrunCLI';
import { ProjectAnatomy } from './components/ProjectAnatomy';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'plugins' | 'word-generator' | 'settings' | 'show-prep' | 'routing' | 'project-anatomy'>('dashboard');
  const [sharedProject, setSharedProject] = useState<DAWProject | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('ai-studio-settings');
    return saved ? JSON.parse(saved) : { theme: 'blue', density: 'comfortable', autoSave: true };
  });

  const [plugins, setPlugins] = useState<PluginData[]>(() => {
    const saved = localStorage.getItem('ai-studio-plugins-v2');
    return saved ? JSON.parse(saved) : INITIAL_PLUGINS;
  });

  useEffect(() => {
    localStorage.setItem('ai-studio-plugins-v2', JSON.stringify(plugins));
  }, [plugins]);

  useEffect(() => {
    localStorage.setItem('ai-studio-settings', JSON.stringify(appSettings));
  }, [appSettings]);

  const updateSettings = (partial: Partial<AppSettings>) => setAppSettings(prev => ({ ...prev, ...partial }));

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [isSpeedrunOpen, setIsSpeedrunOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpeedrunOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', 'Manufacturers']));
  const [researchingIds, setResearchingIds] = useState<Set<string>>(new Set());
  const [isBatchResearching, setIsBatchResearching] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const cancelResearchRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortConfig, setSortConfig] = useState<{key: keyof PluginData, direction: 'asc'|'desc'}>({ key: 'name', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pluginTab, setPluginTab] = useState<'details' | 'encyclopedia'>('details');
  const [isBulkCategorizing, setIsBulkCategorizing] = useState(false);
  const [bulkTagInput, setBulkTagInput] = useState("");

  const handleAIAutoTag = async () => {
    if (selectedIds.size === 0) return;
    setIsBulkCategorizing(true);
    addLog({ message: `AI batch auto-tagging ${selectedIds.size} plugins...`, type: 'info' });
    
    const targets = plugins.filter(p => selectedIds.has(p.id)).map(p => ({
       id: p.id,
       name: p.name,
       manufacturer: p.manufacturer
    }));

    const result = await bulkCategorizePlugins(targets);
    
    if (result) {
       setPlugins(prev => prev.map(p => {
          if (result[p.id]) {
             const updates: Partial<PluginData> = {};
             if (result[p.id].category && p.category === 'Unknown') updates.category = result[p.id].category;
             if (result[p.id].synthesisType) updates.synthesisType = result[p.id].synthesisType as any;
             if (result[p.id].saturationType) updates.saturationType = result[p.id].saturationType as any;
             if (result[p.id].tags) updates.tags = [...new Set([...(p.tags || []), ...(result[p.id].tags || [])])];
             
             return { ...p, ...updates };
          }
          return p;
       }));
       addLog({ message: `AI successfully categorized ${selectedIds.size} plugins.`, type: 'success' });
       setSelectedIds(new Set());
    } else {
       addLog({ message: `AI batch auto-tag failed.`, type: 'error' });
    }
    
    setIsBulkCategorizing(false);
  };


  const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const entry: LogEntry = {
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString().split('T')[1].slice(0, 8)
    };
    setLogs(prev => [entry, ...prev].slice(0, 100));
  };

  // Filters
  const [filterFXCategory, setFilterFXCategory] = useState<string>('');
  const [filterInstrumentType, setFilterInstrumentType] = useState<string>('');
  const [filterManufacturer, setFilterManufacturer] = useState<string>('');
  const [filterFormat, setFilterFormat] = useState<string>('');

  const selectedPlugin = useMemo(() => 
    plugins.find(p => p.id === selectedPluginId), 
    [plugins, selectedPluginId]
  );

  const instrumentKeywords = new Set(['Synth', 'Sampler', 'Drums', 'Piano', 'Bass', 'Guitar/Amp', 'Strings', 'Brass', 'Instrument', 'Keys']);
  const uniqueCategories = useMemo(() => Array.from(new Set(plugins.map(p => p.category))).sort(), [plugins]);
  const instrumentCategories = useMemo(() => uniqueCategories.filter(c => instrumentKeywords.has(c) || c.includes('Instrument') || c.includes('Synth')), [uniqueCategories, instrumentKeywords]);
  const fxCategories = useMemo(() => uniqueCategories.filter(c => !instrumentCategories.includes(c) && c !== 'Not Supplied' && c !== 'Unknown'), [uniqueCategories, instrumentCategories]);
  const uniqueManufacturers = useMemo(() => Array.from(new Set(plugins.map(p => p.manufacturer))).sort(), [plugins]);

  // Simulated Explorer Structure
  const explorerData = useMemo(() => {
    const root: ExplorerItem = { id: 'root', name: 'Plugins', type: 'directory', path: '/', children: [] };
    
    // Group by Manufacturer
    const manufacturersNode: ExplorerItem = { id: 'Manufacturers', name: 'Manufacturers', type: 'directory', path: '/Manufacturers', children: [] };
    const manufacturersMap = new Map<string, ExplorerItem>();

    plugins.forEach(p => {
      const mName = p.manufacturer || 'Unknown';
      if (!manufacturersMap.has(mName)) {
        const node: ExplorerItem = { id: `m-${mName}`, name: mName, type: 'directory', path: `/Manufacturers/${mName}`, children: [] };
        manufacturersMap.set(mName, node);
        manufacturersNode.children?.push(node);
      }
      manufacturersMap.get(mName)?.children?.push({
        id: p.id,
        name: p.name,
        type: 'file',
        path: `/Manufacturers/${mName}/${p.name}`,
        pluginId: p.id
      });
    });

    root.children?.push(manufacturersNode);

    // Group by Category
    const categoriesNode: ExplorerItem = { id: 'Categories', name: 'Categories', type: 'directory', path: '/Categories', children: [] };
    const categoriesMap = new Map<string, ExplorerItem>();

    plugins.forEach(p => {
      const cName = p.category || 'Uncategorized';
      if (!categoriesMap.has(cName)) {
        const node: ExplorerItem = { id: `c-${cName}`, name: cName, type: 'directory', path: `/Categories/${cName}`, children: [] };
        categoriesMap.set(cName, node);
        categoriesNode.children?.push(node);
      }
      categoriesMap.get(cName)?.children?.push({
        id: `c-p-${p.id}`,
        name: p.name,
        type: 'file',
        path: `/Categories/${cName}/${p.name}`,
        pluginId: p.id
      });
    });

    root.children?.push(categoriesNode);
    return root;
  }, [plugins]);

  const filteredPlugins = useMemo(() => {
    let result = plugins.map(p => {
      let score = 0;
      if (searchQuery.trim().toLowerCase() === 'is:unknown') {
        if (!p.tags?.length || p.manufacturer === 'Unknown' || p.category === 'Not Supplied' || p.category === 'Unknown') {
          score = 100;
        } else {
          score = 0;
        }
      } else if (!searchQuery.trim()) {
        score = 1;
      } else {
        const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/);
        const nameLower = p.name.toLowerCase();
        const mfgLower = p.manufacturer.toLowerCase();
        const catLower = p.category.toLowerCase();
        const notesLower = p.notes?.toLowerCase() || '';
        const tagsStr = (p.tags || []).join(' ').toLowerCase();

        // Exact or prefix full query matches highly score
        const fullQuery = searchQuery.toLowerCase().trim();
        if (nameLower === fullQuery) score += 100;
        else if (nameLower.startsWith(fullQuery)) score += 50;
        
        if (mfgLower === fullQuery) score += 30;
        else if (mfgLower.startsWith(fullQuery)) score += 15;

        // Terms must all be present in at least one field
        let missingTerm = false;
        for (const term of queryTerms) {
          let termScore = 0;
          if (nameLower.includes(term)) termScore += 10;
          if (nameLower.startsWith(term) || nameLower.includes(` ${term}`)) termScore += 5; // Word boundary
          if (mfgLower.includes(term)) termScore += 5;
          if (mfgLower.startsWith(term) || mfgLower.includes(` ${term}`)) termScore += 3;
          if (catLower.includes(term)) termScore += 5;
          if (tagsStr.includes(term)) termScore += 8;
          if (notesLower.includes(term)) termScore += 2;
          
          if (termScore === 0) {
             missingTerm = true;
             break;
          }
          score += termScore;
        }

        if (missingTerm) score = 0;
      }
      return { plugin: p, score };
    }).filter(item => {
      if (item.score === 0) return false;
      const p = item.plugin;
      const matchFXCategory = filterFXCategory ? p.category === filterFXCategory : true;
      const matchInstrumentType = filterInstrumentType ? p.category === filterInstrumentType : true;
      const matchManufacturer = filterManufacturer ? p.manufacturer === filterManufacturer : true;
      const matchFormat = filterFormat ? p.formats[filterFormat as keyof typeof p.formats] : true;
      return matchFXCategory && matchInstrumentType && matchManufacturer && matchFormat;
    });

    result.sort((a, b) => {
      // Sort by relevance score first if a search is active
      if (searchQuery.trim() && a.score !== b.score) {
        return b.score - a.score;
      }
      // Fallback to standard sorting
      const aVal = String(a.plugin[sortConfig.key] || '').toLowerCase();
      const bVal = String(b.plugin[sortConfig.key] || '').toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result.map(item => item.plugin);
  }, [plugins, searchQuery, filterFXCategory, filterInstrumentType, filterManufacturer, filterFormat, sortConfig]);

  const handleSort = (key: keyof PluginData) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleFolder = (id: string) => {
    const next = new Set(expandedFolders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedFolders(next);
  };

  const updatePluginField = (id: string, field: keyof PluginData, value: any) => {
    setPlugins(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const applySuggestions = (id: string) => {
    setPlugins(prev => prev.map(p => {
      if (p.id === id && p.aiSuggestions) {
        return {
          ...p,
          tags: p.aiSuggestions.tags || p.tags,
          notes: p.aiSuggestions.description || p.notes,
          manufacturer: p.aiSuggestions.manufacturer || p.manufacturer,
          category: p.aiSuggestions.category || p.category,
          aiSuggestions: undefined
        };
      }
      return p;
    }));
  };

  const handleResearch = async (plugin: PluginData) => {
    setResearchingIds(prev => new Set(prev).add(plugin.id));
    const result = await researchPlugin(plugin.name, plugin.manufacturer, plugin.category);
    if (result) {
      setPlugins(prev => prev.map(p => p.id === plugin.id ? { 
        ...p, 
        aiSuggestions: {
          tags: result.tags,
          description: result.description,
          ...(result.manufacturer && { manufacturer: result.manufacturer }),
          ...(result.category && { category: result.category })
        }
      } : p));
    }
    setResearchingIds(prev => {
      const next = new Set(prev);
      next.delete(plugin.id);
      return next;
    });
  };

  const handleBatchResearch = async () => {
    setIsBatchResearching(true);
    cancelResearchRef.current = false;
    const unknowns = plugins.filter(p => !p.tags?.length || p.manufacturer === 'Unknown' || p.category === 'Not Supplied' || p.category === 'Unknown');
    setBatchTotal(unknowns.length);
    setBatchProgress(0);

    if (unknowns.length === 0) {
      addLog({ type: 'info', message: 'No unknown plugins found.' });
      setIsBatchResearching(false);
      return;
    }
    
    addLog({ type: 'info', message: `Started batch research for ${unknowns.length} plugins.` });
    
    // Process without awaiting individually to allow parallel UI interaction but we can map them efficiently
    // Still, let's limit concurrency slightly so browser doesn't stall completely.
    const maxConcurrent = 3;
    let index = 0;
    let completed = 0;
    
    const next = async () => {
      while (index < unknowns.length && !cancelResearchRef.current) {
        const plugin = unknowns[index++];
        setResearchingIds(prev => new Set(prev).add(plugin.id));
        const result = await researchPlugin(plugin.name, plugin.manufacturer, plugin.category);
        if (result && !cancelResearchRef.current) {
          setPlugins(prev => prev.map(p => {
            if (p.id === plugin.id) {
               const autoMfg = (p.manufacturer === 'Unknown' || !p.manufacturer) && result.manufacturer;
               const autoCat = (p.category === 'Unknown' || p.category === 'Not Supplied' || !p.category) && result.category;
               
               return {
                 ...p,
                 domain: result.domain || p.domain,
                 manufacturer: autoMfg ? result.manufacturer! : p.manufacturer,
                 category: autoCat ? result.category! : p.category,
                 tags: p.tags?.length ? p.tags : result.tags,
                 aiSuggestions: {
                   tags: result.tags,
                   description: result.description,
                   ...(result.manufacturer && !autoMfg && { manufacturer: result.manufacturer }),
                   ...(result.category && !autoCat && { category: result.category })
                 }
               };
            }
            return p;
          }));
          addLog({ type: 'success', message: `Identified: ${plugin.name}` });
        } else if (!cancelResearchRef.current) {
          addLog({ type: 'warning', message: `Failed to identify: ${plugin.name}` });
        }
        setResearchingIds(prev => {
          const nextSet = new Set(prev);
          nextSet.delete(plugin.id);
          return nextSet;
        });
        completed++;
        setBatchProgress(completed);
      }
    }

    const workers = [];
    for(let i = 0; i < maxConcurrent; i++) {
        workers.push(next());
    }
    await Promise.all(workers);
    
    if (cancelResearchRef.current) {
       addLog({ type: 'warning', message: `Batch research cancelled. Completed ${completed}/${unknowns.length}.` });
    } else {
       addLog({ type: 'success', message: `Batch research complete.` });
    }
    
    setIsBatchResearching(false);
    setBatchProgress(0);
    setBatchTotal(0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const newPlugins: PluginData[] = results.data.map((row: any, i: number) => {
          return {
            id: `csv-${Date.now()}-${i}`,
            name: row['Plugin'] || row['Name'] || `Unknown Plugin ${i}`,
            manufacturer: row['Manufacturer'] || 'Unknown',
            category: row['Category'] || 'Not Supplied',
            version: row['Version'] || row['Version '] || '',
            formats: {
              au: String(row['AU']).trim() !== '',
              vst: String(row['VST']).trim() !== '',
              vst3: String(row['VST3']).trim() !== '',
              aax: String(row['AAX']).trim() !== '',
              clap: String(row['CLAP']).trim() !== ''
            },
            sizeMb: parseFloat(row['Size (MB)']) || 0,
            notes: row['Notes'] || ''
          };
        });

        // Merge with existing but we can also just clear existing if prefered.
        setPlugins(prev => {
          const merged = [...prev];
          newPlugins.forEach(np => {
            if (!merged.find(p => p.name === np.name && p.manufacturer === np.manufacturer)) {
              merged.push(np);
            }
          });
          return merged;
        });
      }
    });
    // clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateRandomPlugin = () => {
    const randomIndex = Math.floor(Math.random() * plugins.length);
    setSelectedPluginId(plugins[randomIndex].id);
  };

  const cancelBatchResearch = () => {
    cancelResearchRef.current = true;
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 text-gray-200 font-sans selection:bg-blue-500/30">
      {/* Top Toolbar */}
      <nav className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={() => setCurrentView('dashboard')}>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <LayoutGrid className="text-white w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight text-white hidden sm:block">Organizer Pro</span>
          </div>
          
          <div className="w-px h-6 bg-gray-800 hidden sm:block"></div>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentView('dashboard')}
              title="Dashboard"
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", currentView === 'dashboard' ? "bg-amber-500/20 text-amber-500" : "text-gray-400 hover:text-white hover:bg-gray-800")}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden md:block">Dash</span>
            </button>

            <button 
              onClick={() => setCurrentView('plugins')}
              title="Plugin Library"
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", currentView === 'plugins' ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-gray-800")}
            >
              <Library className="w-4 h-4" />
              <span className="hidden md:block">Library</span>
            </button>

            <button 
              onClick={() => setCurrentView('word-generator')}
              title="Word Studio"
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", currentView === 'word-generator' ? "bg-emerald-600/20 text-emerald-400" : "text-gray-400 hover:text-white hover:bg-gray-800")}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:block">Word Studio</span>
            </button>

            <button 
              onClick={() => setCurrentView('project-anatomy')}
              title="Project Anatomy"
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", currentView === 'project-anatomy' ? "bg-pink-600/20 text-pink-400" : "text-gray-400 hover:text-white hover:bg-gray-800")}
            >
              <File className="w-4 h-4" />
              <span className="hidden md:block">Project Anatomy</span>
            </button>

            <button 
              onClick={() => setCurrentView('show-prep')}
              title="Live Show Integration"
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", currentView === 'show-prep' ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white hover:bg-gray-800")}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:block">Show Prep</span>
            </button>

            <button 
              onClick={() => setCurrentView('routing')}
              title="Routing & Telemetry Options"
              className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2", currentView === 'routing' ? "bg-purple-500/20 text-purple-400" : "text-gray-400 hover:text-white hover:bg-gray-800")}
            >
              <Cable className="w-4 h-4" />
              <span className="hidden md:block">Routing</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsSpeedrunOpen(true)}
            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-white bg-gray-950 hover:bg-gray-800 border border-gray-800 rounded-lg transition-colors flex items-center gap-2"
            title="Speedrun CLI"
          >
            <Command className="w-3 h-3" />
            <span>CMD K</span>
          </button>
          
          <button 
            onClick={() => setIsConsoleOpen(prev => !prev)}
            title="Toggle System Console"
            className={cn("p-2 rounded-lg transition-all border border-transparent", isConsoleOpen ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-700")}
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">

      {/* Main Layout Area */}
      {currentView === 'plugins' ? (
        <>
          {/* Sidebar - Explorer */}
          <aside className="w-80 border-r border-gray-800 flex flex-col bg-gray-900/50 backdrop-blur-xl shrink-0">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center gap-3 mb-6">
                <div>
                  <h1 className="font-bold text-lg leading-none">Organizer Pro</h1>
                  <p className="text-xs text-gray-500 mt-1">V3.2.0 Studio Edition</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={generateRandomPlugin}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all group border border-gray-700/50"
                >
                  <div className="flex items-center gap-2">
                    <Dices className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-medium">Random Plugin</span>
                  </div>
                  <Sparkles className="w-3 h-3 text-yellow-500/50" />
                </button>
                
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  ref={fileInputRef} 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all group border border-gray-700/50"
                >
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-400 group-hover:-translate-y-1 transition-transform" />
                    <span className="text-sm font-medium">Import CSV</span>
                  </div>
                </button>

                {isBatchResearching ? (
                  <div className="w-full bg-gray-800 border border-gray-700/50 rounded-lg overflow-hidden flex flex-col group">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
                        <span className="text-sm font-medium">Identifying ({batchProgress}/{batchTotal})</span>
                      </div>
                      <button 
                        onClick={cancelBatchResearch}
                        className="p-1 hover:bg-gray-700 rounded-md transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                      </button>
                    </div>
                    <div className="h-1 w-full bg-gray-900 border-t border-gray-700/50">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-300 ease-in-out" 
                        style={{ width: `${batchTotal > 0 ? (batchProgress / batchTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleBatchResearch}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-all group border border-indigo-500/20"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium font-bold">Auto-Identify Unknowns</span>
                    </div>
                    <span className="bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded text-xs border border-indigo-500/30">
                      {plugins.filter(p => !p.tags?.length || p.manufacturer === 'Unknown' || p.category === 'Not Supplied' || p.category === 'Unknown').length}
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
              <ExplorerNode 
                item={explorerData} 
                expandedFolders={expandedFolders} 
                toggleFolder={toggleFolder}
                selectedId={selectedPluginId}
                onSelect={setSelectedPluginId}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0 bg-gray-950">
        {/* Header / Search */}
        <div className="flex flex-col border-b border-gray-800 bg-gray-950/50 backdrop-blur-md sticky top-0 z-10 p-4 gap-4">
          <header className="flex items-center">
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search plugins, categories, manufacturers..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-sans"
              />
            </div>
            <div className="ml-4 flex items-center gap-4">
              <div className="h-8 w-[1px] bg-gray-800" />
              <span className="text-sm font-medium text-gray-400">
                {filteredPlugins.length} <span className="text-gray-600">items</span>
              </span>
            </div>
          </header>
          
          {/* Filters Row */}
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button
               onClick={() => {
                 if (searchQuery === 'is:unknown') setSearchQuery('');
                 else setSearchQuery('is:unknown');
               }}
               className={cn(
                 "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1",
                 searchQuery === 'is:unknown' 
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                    : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-amber-500 hover:border-amber-500/30"
               )}
            >
               <AlertCircle className="w-3.5 h-3.5" />
               Show Unknowns
            </button>
            <div className="w-[1px] h-6 bg-gray-800 mx-2" />
            <select
              value={filterFXCategory}
              onChange={(e) => {
                setFilterFXCategory(e.target.value);
                if (e.target.value) setFilterInstrumentType('');
              }}
              className="bg-gray-900 border border-gray-800 rounded-md px-3 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">FX Categories</option>
              {fxCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filterInstrumentType}
              onChange={(e) => {
                setFilterInstrumentType(e.target.value);
                if (e.target.value) setFilterFXCategory('');
              }}
              className="bg-gray-900 border border-gray-800 rounded-md px-3 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">Instrument Types</option>
              {instrumentCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            
            <select
              value={filterManufacturer}
              onChange={(e) => setFilterManufacturer(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-md px-3 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">All Manufacturers</option>
              {uniqueManufacturers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-md px-3 py-1.5 text-gray-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="">All Formats</option>
              <option value="vst3">VST3</option>
              <option value="vst">VST</option>
              <option value="au">AU</option>
              <option value="aax">AAX</option>
              <option value="clap">CLAP</option>
            </select>
          </div>
        </div>

        {/* Plugin List */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex justify-between items-center mb-4">
             <div className="flex gap-2">
               <button 
                 onClick={() => setViewMode('table')}
                 className={cn("p-1.5 rounded-md transition-colors", viewMode === 'table' ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300")}
               >
                 <ListIcon className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setViewMode('grid')}
                 className={cn("p-1.5 rounded-md transition-colors", viewMode === 'grid' ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-300")}
               >
                 <LayoutGrid className="w-4 h-4" />
               </button>
             </div>
             {selectedIds.size > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-mono">{selectedIds.size} Selected</span>
                  
                  <div className="h-4 w-px bg-gray-800 mx-2" />
                  
                  <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-2">
                     <Tag className="w-3 h-3 text-gray-400" />
                     <select 
                       className="bg-transparent text-xs text-gray-300 py-1.5 outline-none w-32"
                       onChange={(e) => {
                          if (!e.target.value) return;
                          setPlugins(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, category: e.target.value } : p));
                          e.target.value = "";
                       }}
                     >
                       <option value="">Bulk Set Category...</option>
                       <option value="Synth">Synth</option>
                       <option value="EQ">EQ</option>
                       <option value="Dynamics">Dynamics</option>
                       <option value="Reverb">Reverb</option>
                       <option value="Saturation">Saturation</option>
                     </select>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-2 overflow-hidden">
                     <input 
                       value={bulkTagInput}
                       onChange={(e) => setBulkTagInput(e.target.value)}
                       placeholder="Add custom tag (Enter)..."
                       className="bg-transparent text-xs text-gray-300 py-1.5 outline-none w-36 placeholder:text-gray-600"
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && bulkTagInput.trim()) {
                            const newTag = bulkTagInput.trim();
                            setPlugins(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, tags: [...new Set([...(p.tags || []), newTag])] } : p));
                            setBulkTagInput("");
                         }
                       }}
                     />
                  </div>

                  <button 
                     onClick={handleAIAutoTag}
                     disabled={isBulkCategorizing}
                     className="text-[10px] uppercase font-bold tracking-widest bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 px-3 py-1.5 rounded flex items-center gap-2 border border-indigo-500/30 transition-colors ml-auto disabled:opacity-50"
                  >
                     {isBulkCategorizing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                     AI Auto-Tag
                  </button>

                  <button className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded flex items-center gap-2 border border-gray-700/50 transition-colors">
                    <Archive className="w-3 h-3 text-emerald-400" /> Offload
                  </button>
                  <button className="text-xs bg-gray-800 hover:bg-red-900/30 px-3 py-1.5 rounded flex items-center gap-2 border border-gray-700/50 text-red-500 transition-colors">
                    <Trash2 className="w-3 h-3" /> Mass Delete
                  </button>
                </div>
             )}
          </div>

          {filteredPlugins.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-center border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/30 w-full animate-in fade-in zoom-in-95 duration-500">
               <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                 <Search className="w-8 h-8 text-gray-500" />
               </div>
               <h3 className="text-xl font-bold text-gray-300 mb-2 tracking-tight">No elements located</h3>
               <p className="text-gray-500 max-w-sm mb-6">Your current subspace scanning parameters returned zero intersecting plugin artifacts.</p>
               <button 
                 onClick={() => {
                   setSearchQuery('');
                   setFilterFXCategory('');
                   setFilterInstrumentType('');
                   setFilterManufacturer('');
                   setFilterFormat('');
                 }}
                 className="px-6 py-2.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-full font-bold uppercase tracking-widest text-xs transition-all border border-blue-500/30"
               >
                 Abridge Search Parameters
               </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredPlugins.map((plugin) => (
                <PluginCard 
                  key={plugin.id} 
                  plugin={plugin} 
                  isActive={selectedPluginId === plugin.id}
                  onClick={() => setSelectedPluginId(plugin.id)}
                />
              ))}
            </div>
          ) : (
            <div className="w-full bg-gray-900/40 rounded-xl border border-gray-800 overflow-hidden">
               <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-gray-800/80 text-xs uppercase text-gray-500 border-b border-gray-800">
                     <tr>
                        <th className="px-4 py-3 w-10">
                           <input 
                              type="checkbox" 
                              className="rounded border-gray-700 bg-gray-900/50"
                              onChange={(e) => {
                                 if (e.target.checked) setSelectedIds(new Set(filteredPlugins.map(p => p.id)));
                                 else setSelectedIds(new Set());
                              }}
                              checked={selectedIds.size > 0 && selectedIds.size === filteredPlugins.length}
                           />
                        </th>
                        <th className="px-4 py-3 font-medium tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => handleSort('name')}>
                          <div className="flex items-center gap-1">Plugin {sortConfig.key==='name' && (sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}</div>
                        </th>
                        <th className="px-4 py-3 font-medium tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => handleSort('manufacturer')}>
                          <div className="flex items-center gap-1">Manufacturer {sortConfig.key==='manufacturer' && (sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}</div>
                        </th>
                        <th className="px-4 py-3 font-medium tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => handleSort('category')}>
                          <div className="flex items-center gap-1">Category {sortConfig.key==='category' && (sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}</div>
                        </th>
                        <th className="px-4 py-3 font-medium tracking-wider hover:bg-gray-700/50 transition-colors">Synthesis</th>
                        <th className="px-4 py-3 font-medium tracking-wider hover:bg-gray-700/50 transition-colors">Saturation</th>
                        <th className="px-4 py-3 font-medium tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => handleSort('rating')}>
                          <div className="flex items-center gap-1">Rating {sortConfig.key==='rating' && (sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>)}</div>
                        </th>
                        <th className="px-4 py-3 font-medium tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors" onClick={() => handleSort('version')}>V</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filteredPlugins.map((plugin) => (
                        <tr 
                           key={plugin.id} 
                           onClick={() => setSelectedPluginId(plugin.id)}
                           className={cn(
                             "border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors",
                             selectedPluginId === plugin.id && "bg-blue-900/10",
                             appSettings.density === 'compact' ? 'h-8' : appSettings.density === 'comfortable' ? 'h-12' : 'h-16'
                           )}
                        >
                           <td className="px-4 py-0 w-10 sticky left-0 bg-transparent" onClick={(e) => e.stopPropagation()}>
                              <input 
                                 type="checkbox" 
                                 className="rounded border-gray-700 bg-gray-900/50"
                                 checked={selectedIds.has(plugin.id)}
                                 onChange={(e) => {
                                    const next = new Set(selectedIds);
                                    if (e.target.checked) next.add(plugin.id);
                                    else next.delete(plugin.id);
                                    setSelectedIds(next);
                                 }}
                              />
                           </td>
                           <td className="px-4 py-0 font-medium text-gray-200">
                             {plugin.domain ? (
                                <div className="flex items-center gap-3">
                                   <img src={`https://logo.clearbit.com/${plugin.domain}?size=24`} alt="" className="w-5 h-5 rounded object-cover bg-white/10" onError={(e) => e.currentTarget.style.display = 'none'} />
                                   <span>{plugin.name}</span>
                                </div>
                             ) : (
                                plugin.name
                             )}
                           </td>
                           <td className="px-4 py-0 text-blue-400">{plugin.manufacturer}</td>
                           <td className="px-4 py-0">{plugin.category}</td>
                           <td className="px-4 py-0 text-gray-400">{plugin.synthesisType || '-'}</td>
                           <td className="px-4 py-0 text-gray-400">{plugin.saturationType || '-'}</td>
                           <td className="px-4 py-0 text-amber-500 flex items-center gap-1 h-full">
                             {plugin.rating ? (
                               <div className="flex items-center mt-3">
                                 {[1,2,3,4,5].map(star => (
                                    <Star key={star} className={cn("w-3 h-3", star <= (plugin.rating || 0) ? "fill-current" : "text-gray-700")} />
                                 ))}
                               </div>
                             ) : <span className="text-gray-600 mt-2">-</span>}
                           </td>
                           <td className="px-4 py-0 text-gray-500 font-mono text-xs">{plugin.version}</td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}
        </div>
      </main>

      {/* Right Properties Panel */}
      <aside className="w-[450px] border-l border-gray-800 bg-gray-900/30 flex flex-col relative shrink-0">
        <AnimatePresence mode="wait">
          {selectedPlugin ? (
            <motion.div 
              key={selectedPlugin.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
            >
              <div className="flex border-b border-gray-800 pt-4 px-4 gap-4 sticky top-0 bg-gray-950/80 backdrop-blur z-10">
                <button 
                  onClick={() => setPluginTab('details')}
                  className={cn("pb-3 text-xs font-bold uppercase tracking-widest transition-colors", pluginTab === 'details' ? "text-white border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-300")}
                >
                  System Details
                </button>
                <button 
                  onClick={() => setPluginTab('encyclopedia')}
                  className={cn("pb-3 text-xs font-bold uppercase tracking-widest transition-colors", pluginTab === 'encyclopedia' ? "text-white border-b-2 border-emerald-500" : "text-gray-500 hover:text-gray-300")}
                >
                  Encyclopedia
                </button>
              </div>

              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-full mr-4 flex items-center gap-4">
                    {selectedPlugin.domain && (
                      <img src={`https://logo.clearbit.com/${selectedPlugin.domain}?size=64`} alt="" className="w-12 h-12 rounded-xl object-cover bg-white/10 shrink-0 shadow-lg" onError={(e) => e.currentTarget.style.display = 'none'} />
                    )}
                    <div className="flex-1">
                      <input 
                        value={selectedPlugin.name}
                        onChange={(e) => updatePluginField(selectedPlugin.id, 'name', e.target.value)}
                        className="text-2xl font-bold bg-transparent text-white w-full focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1 -ml-1 border border-transparent focus:border-gray-700 hover:border-gray-800 transition-colors"
                      />
                      <div className="flex items-center group relative">
                        <input 
                          value={selectedPlugin.manufacturer}
                          onChange={(e) => updatePluginField(selectedPlugin.id, 'manufacturer', e.target.value)}
                          className="text-blue-400 font-medium bg-transparent text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500/50 rounded px-1 flex-1 border border-transparent focus:border-gray-700 hover:border-gray-800 transition-colors"
                        />
                        <button 
                          onClick={() => setFilterManufacturer(selectedPlugin.manufacturer)}
                          className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-800 rounded transition-all text-gray-500 hover:text-white"
                          title="Filter by this Manufacturer"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {pluginTab === 'details' ? (
                  <>
                    <div className="mb-6 space-y-4">
                      <Field 
                        label="Category" 
                        icon={Tag}
                        value={selectedPlugin.category} 
                        onChange={(val) => updatePluginField(selectedPlugin.id, 'category', val)}
                        placeholder="E.g. Synth, EQ"
                        onFilter={() => setSearchQuery(selectedPlugin.category)}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Field 
                          label="Synthesis Type" 
                          icon={Activity}
                          value={selectedPlugin.synthesisType || ''} 
                          onChange={(val) => updatePluginField(selectedPlugin.id, 'synthesisType', val)}
                          placeholder="e.g. Wavetable"
                        />
                        <Field 
                          label="Saturation Type" 
                          icon={Activity}
                          value={selectedPlugin.saturationType || ''} 
                          onChange={(val) => updatePluginField(selectedPlugin.id, 'saturationType', val)}
                          placeholder="e.g. Tube"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 ml-1">
                          <Settings className="w-3 h-3 text-gray-500" />
                          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Notes / Description</label>
                        </div>
                        <textarea 
                          value={selectedPlugin.notes} 
                          onChange={(e) => updatePluginField(selectedPlugin.id, 'notes', e.target.value)}
                          placeholder="Add personal notes or description..."
                          rows={3}
                          className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-300 placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all font-mono resize-none custom-scrollbar"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/50">
                        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Version</p>
                        <p className="text-sm text-gray-200">{selectedPlugin.version}</p>
                      </div>
                      <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/50">
                        <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Storage</p>
                        <p className="text-sm text-gray-200">{selectedPlugin.sizeMb} MB</p>
                      </div>
                    </div>

                    {/* AI Research Section */}
                    <div className="mb-8 p-6 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-blue-500/20 rounded-2xl relative overflow-hidden group">
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-400" />
                            <h3 className="text-sm font-bold text-blue-100 italic uppercase tracking-widest">AI Categorization</h3>
                          </div>
                          <button 
                            onClick={() => handleResearch(selectedPlugin)}
                            disabled={researchingIds.has(selectedPlugin.id)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                            title="Re-research plugin"
                          >
                             {researchingIds.has(selectedPlugin.id) ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          </button>
                        </div>
                        
                        {selectedPlugin.aiSuggestions ? (
                          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 text-sm">
                               <p className="text-blue-300 font-medium mb-2">Suggestions available:</p>

                           <ul className="space-y-1 text-gray-300 text-xs mb-3">
                             {selectedPlugin.aiSuggestions.category && <li>• <span className="text-gray-400">Category:</span> {selectedPlugin.aiSuggestions.category}</li>}
                             {selectedPlugin.aiSuggestions.manufacturer && <li>• <span className="text-gray-400">Manufacturer:</span> {selectedPlugin.aiSuggestions.manufacturer}</li>}
                           </ul>
                           <button 
                             onClick={() => applySuggestions(selectedPlugin.id)}
                             className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all text-xs"
                           >
                             Apply Suggestions
                           </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleResearch(selectedPlugin)}
                        disabled={researchingIds.has(selectedPlugin.id)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:bg-gray-700 disabled:shadow-none"
                      >
                        {researchingIds.has(selectedPlugin.id) ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                        Research Plugin
                      </button>
                    )}
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Database className="w-24 h-24 text-blue-400" />
                  </div>
                </div>

                {/* Registry & Paths */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rating</h3>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-2.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => updatePluginField(selectedPlugin.id, 'rating', star)}
                          className={cn(
                            "p-1 hover:scale-110 transition-transform",
                            star <= (selectedPlugin.rating || 0) ? "text-amber-500" : "text-gray-700 hover:text-amber-500/50"
                          )}
                        >
                          <Star className={cn("w-5 h-5", star <= (selectedPlugin.rating || 0) && "fill-current")} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Integration</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <Field 
                      label="Installed At" 
                      icon={HardDrive}
                      value={selectedPlugin.installedAt} 
                      onChange={(val) => updatePluginField(selectedPlugin.id, 'installedAt', val)}
                      placeholder="C:\Program Files\VstPlugins\..."
                    />
                    <Field 
                      label="Registry Path" 
                      icon={Hash}
                      value={selectedPlugin.registryPath} 
                      onChange={(val) => updatePluginField(selectedPlugin.id, 'registryPath', val)}
                      placeholder="HKEY_LOCAL_MACHINE\..."
                    />
                    <Field 
                      label="Symlink Target" 
                      icon={LinkIcon}
                      value={selectedPlugin.symlink} 
                      onChange={(val) => updatePluginField(selectedPlugin.id, 'symlink', val)}
                      placeholder="D:\ExternalVst\..."
                    />
                  </div>
                </div>
                </>
                ) : (
                  <div className="pt-4 animate-in fade-in slide-in-from-right-2 duration-300">
                    <EncyclopediaPane 
                      plugin={selectedPlugin} 
                      onUpdate={(id, updates) => setPlugins(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))}
                      addLog={addLog}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-50">
              <Info className="w-12 h-12 mb-4 text-gray-700" />
              <h3 className="text-lg font-medium text-gray-500">No selection</h3>
              <p className="text-sm mt-2 max-w-[200px]">Select a plugin from the explorer to manage details</p>
            </div>
          )}
        </AnimatePresence>

          {/* Status Bar */}
          <div className="h-10 px-4 border-t border-gray-800 bg-gray-900 flex items-center justify-between text-[10px] text-gray-500 font-mono tracking-wider shrink-0 mt-auto">
             <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> READY</span>
              <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-blue-500" /> {plugins.length} DATABASED</span>
             </div>
             <span>UTC: {new Date().toISOString().split('T')[1].slice(0, 8)}</span>
          </div>
        </aside>
        </>
      ) : currentView === 'dashboard' ? (
        <Dashboard plugins={plugins} />
      ) : currentView === 'show-prep' ? (
        <ShowPrep plugins={plugins} initialProject={sharedProject} />
      ) : currentView === 'routing' ? (
        <RoutingHub plugins={plugins} />
      ) : currentView === 'word-generator' ? (
        <WordStudio />
      ) : currentView === 'project-anatomy' ? (
        <ProjectAnatomy 
          plugins={plugins} 
          onSendToShowPrep={(project) => { 
            setSharedProject(project); 
            setCurrentView('show-prep'); 
          }} 
        />
      ) : currentView === 'settings' ? (
        <SettingsView plugins={plugins} setPlugins={setPlugins} settings={appSettings} updateSettings={updateSettings} addLog={addLog} />
      ) : null}
      </div>

      <AnimatePresence>
        {isConsoleOpen && (
          <SystemConsole logs={logs} onClose={() => setIsConsoleOpen(false)} />
        )}
      </AnimatePresence>

      <SpeedrunCLI 
        isOpen={isSpeedrunOpen}
        onClose={() => setIsSpeedrunOpen(false)}
        plugins={plugins}
        onNavigate={setCurrentView as (view: string) => void}
        onSearch={setSearchQuery}
        onIdentify={handleBatchResearch}
      />
    </div>
  );
}

function ExplorerNode({ 
  item, 
  expandedFolders, 
  toggleFolder, 
  selectedId, 
  onSelect,
  depth = 0 
}: { 
  item: ExplorerItem, 
  expandedFolders: Set<string>, 
  toggleFolder: (id: string) => void,
  selectedId: string | null,
  onSelect: (id: string) => void,
  depth?: number 
}) {
  const isExpanded = expandedFolders.has(item.id);
  const isSelected = item.pluginId === selectedId;

  const handleClick = () => {
    if (item.type === 'directory') {
      toggleFolder(item.id);
    } else if (item.pluginId) {
      onSelect(item.pluginId);
    }
  };

  return (
    <div>
      <div 
        onClick={handleClick}
        className={cn(
          "flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer text-sm transition-colors group",
          isSelected ? "bg-blue-600/20 text-blue-400" : "hover:bg-gray-800 text-gray-400 hover:text-gray-200"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {item.type === 'directory' ? (
          <>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <Folder className={cn("w-4 h-4", isExpanded ? "text-blue-500" : "text-gray-600")} />
          </>
        ) : (
          <File className={cn("w-4 h-4 ml-3.5", isSelected ? "text-blue-400" : "text-gray-600")} />
        )}
        <span className="truncate">{item.name}</span>
      </div>
      
      {item.type === 'directory' && isExpanded && item.children && (
        <div className="mt-0.5">
          {item.children.map(child => (
            <ExplorerNode 
              key={child.id} 
              item={child} 
              expandedFolders={expandedFolders} 
              toggleFolder={toggleFolder} 
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PluginCard({ plugin, isActive, onClick }: { plugin: PluginData, isActive: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative bg-gray-900 border transition-all duration-300 cursor-pointer rounded-2xl p-5 overflow-hidden",
        isActive 
          ? "border-blue-500 shadow-xl shadow-blue-900/10 scale-[1.02]" 
          : "border-gray-800 hover:border-gray-700 hover:bg-gray-900/80 active:scale-95"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-gray-800 rounded-xl group-hover:bg-gray-700 transition-colors relative">
          <Library className={cn("w-5 h-5 transition-opacity", isActive ? "text-blue-400 opacity-100 group-hover:opacity-0" : "text-gray-400 opacity-100 group-hover:opacity-0")} />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <EqBars />
          </div>
        </div>
        <div className="flex gap-1">
          {Object.entries(plugin.formats).map(([key, value]) => value && (
            <span key={key} className="px-1.5 py-0.5 rounded bg-gray-800 text-[8px] font-bold text-gray-500 uppercase tracking-tighter border border-gray-700">
              {key}
            </span>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors truncate">{plugin.name}</h3>
        <p className="text-xs text-gray-500 mb-3">{plugin.manufacturer}</p>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-950/50 rounded-lg border border-gray-800 group-hover:border-blue-500/30 transition-colors">
            <Tag className={cn("w-3 h-3 group-hover:text-blue-400 transition-colors", isActive ? "text-blue-500" : "text-gray-600")} />
            <span className={cn("text-[10px] font-medium uppercase tracking-wider transition-colors", isActive ? "text-blue-400" : "text-gray-400 group-hover:text-blue-300")}>{plugin.category}</span>
          </div>
          {plugin.synthesisType && plugin.synthesisType !== 'None' && (
             <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <span className="text-[10px] font-medium uppercase tracking-wider text-indigo-400">{plugin.synthesisType}</span>
             </div>
          )}
          {plugin.saturationType && plugin.saturationType !== 'None' && (
             <div className="flex items-center gap-1.5 px-2 py-1 bg-pink-500/10 rounded-lg border border-pink-500/20">
                <span className="text-[10px] font-medium uppercase tracking-wider text-pink-400">{plugin.saturationType}</span>
             </div>
          )}
          {plugin.rating && (
            <div className="flex items-center gap-0.5 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
               <Star className="w-3 h-3 fill-current" />
               <span className="text-[10px] font-bold uppercase">{plugin.rating}</span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-3xl -mr-12 -mt-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
}

function EqBars() {
  return (
    <div className="flex items-end gap-[2px] h-3.5 pt-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-blue-400 rounded-t-sm"
          animate={{ height: ['20%', '100%', '30%', '80%', '20%'] }}
          transition={{
            duration: 0.8 + Math.random() * 0.5,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );
}

function Field({ label, icon: Icon, value = '', onChange, placeholder, onFilter }: { label: string, icon: any, value?: string, onChange: (v: string) => void, placeholder: string, onFilter?: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 ml-1">
        <div className="flex items-center gap-2">
          <Icon className="w-3 h-3 text-gray-500" />
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{label}</label>
        </div>
        {onFilter && (
          <button onClick={onFilter} className="text-[10px] uppercase text-blue-500 hover:text-blue-400 font-bold tracking-widest px-2 items-center gap-1 flex bg-blue-500/10 hover:bg-blue-500/20 py-0.5 rounded transition-colors">
            Filter
          </button>
        )}
      </div>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-300 placeholder:text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all font-mono"
      />
    </div>
  );
}
