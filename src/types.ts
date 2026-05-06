/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UITheme = 'blue' | 'emerald' | 'purple' | 'rose' | 'amber';
export type ViewDensity = 'compact' | 'comfortable' | 'spacious';

export interface AppSettings {
  theme: UITheme;
  density: ViewDensity;
  autoSave: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface PluginData {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  version: string;
  formats: {
    au: boolean;
    vst: boolean;
    vst3: boolean;
    aax: boolean;
    clap: boolean;
  };
  sizeMb: number;
  notes: string;
  rating?: number;
  tags?: string[];
  installedAt?: string;
  symlink?: string;
  registryPath?: string;
  domain?: string;
  companyDescription?: string;
  aiSummary?: string;
  tips?: string[];
  youtubeQuery?: string;
  aiSuggestions?: {
    manufacturer?: string;
    category?: string;
    description?: string;
    tags?: string[];
  };
  performance?: {
    cpuCost?: 'low' | 'medium' | 'high' | 'extreme';
    ramUsageMb?: number;
    latencyMs?: number;
  };
}

export type ExplorerItem = {
  id: string;
  name: string;
  type: 'file' | 'directory';
  children?: ExplorerItem[];
  pluginId?: string;
  path: string;
}

export interface TrackLayer {
  id: string;
  name: string;
  type: 'audio' | 'midi' | 'bus' | 'return';
  color: string;
  plugins: string[]; // Plugin IDs
}

export interface MidiMapping {
  id: string;
  pluginId: string;
  parameterName: string;
  ccNumber: number;
  channel: number;
}

export interface DAWProject {
  id: string;
  name: string;
  sourceFormat: 'als' | 'rpp';
  tracks: TrackLayer[];
}

