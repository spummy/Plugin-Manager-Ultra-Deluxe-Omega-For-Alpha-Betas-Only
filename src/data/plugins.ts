import { PluginData } from '../types';

export const INITIAL_PLUGINS: PluginData[] = [
  { id: '1', name: '101 Kick', manufacturer: 'MIA Laboratories', category: 'Not Supplied', version: '1.0.0', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 7.2, notes: '' },
  { id: '2', name: '1A Equalizer', manufacturer: 'Unknown', category: 'EQ', version: '1.0.2.10', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 12.4, notes: '' },
  { id: '3', name: '2getheraudio Cheeze Machine 2', manufacturer: '2getheraudio', category: 'Synth', version: '1.1.5', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 9.8, notes: '' },
  { id: '4', name: '2getheraudio Cheeze Machine PRO', manufacturer: '2getheraudio', category: 'Synth', version: '1.3.5', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 9.5, notes: '' },
  { id: '5', name: '2getheraudio CL4P Maker', manufacturer: '2getheraudio', category: 'Drums', version: '1.1.5', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 9.5, notes: '' },
  { id: '6', name: '3-Band EQ', manufacturer: 'Kilohearts AB', category: 'EQ', version: '1.8.5', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 0.2, notes: '' },
  { id: '7', name: '3348 TAPE', manufacturer: 'Mixland', category: 'Saturation', version: '1.0.2', formats: { au: false, vst: false, vst3: true, aax: true, clap: false }, sizeMb: 78.9, notes: '' },
  { id: '8', name: '80s Spaces', manufacturer: 'Nomad Factory', category: 'Reverb', version: '2.5.0', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 21.4, notes: '' },
  { id: '9', name: 'Abyss', manufacturer: 'Dawesome', category: 'Synth', version: '1.3.6', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 11.5, notes: '' },
  { id: '10', name: 'Acid V', manufacturer: 'Arturia', category: 'Synth', version: '1.0.0', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 0.0, notes: '' },
  { id: '11', name: 'Addictive Drums 2', manufacturer: 'XLN Audio', category: 'Sampler', version: '2.9.0', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 57.6, notes: '' },
  { id: '12', name: 'AIR Compressor', manufacturer: 'AIR Music Technology', category: 'Dynamics', version: '1.2.1.14', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 19.1, notes: '' },
  { id: '13', name: 'AIR Delay Pro', manufacturer: 'AIR Music Technology', category: 'Delay', version: '1.2.1.14', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 19.1, notes: '' },
  { id: '14', name: 'AIR Vocal Tuner', manufacturer: 'AIR Music Technology', category: 'Pitch', version: '1.2.1.14', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 19.1, notes: '' },
  { id: '15', name: 'ANA2', manufacturer: 'Sonic Academy', category: 'Synth', version: '2.0.98', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 11.1, notes: '' },
  { id: '16', name: 'Altiverb 7', manufacturer: 'Audio Ease', category: 'Reverb', version: '7.0.0', formats: { au: true, vst: true, vst3: false, aax: false, clap: false }, sizeMb: 17.5, notes: '' },
  { id: '17', name: 'AMEK Mastering Compressor', manufacturer: 'Plugin Alliance', category: 'Dynamics', version: '1.2.0', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 30.4, notes: '' },
  { id: '18', name: 'Archetype Petrucci X', manufacturer: 'Neural DSP', category: 'Guitar/Amp', version: '1.0.0', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 119.5, notes: '' },
  { id: '19', name: 'Blackhole', manufacturer: 'Eventide', category: 'Reverb', version: '3.11.4', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 11.7, notes: '' },
  { id: '20', name: 'bx_console SSL 4000 E', manufacturer: 'Brainworx', category: 'Channel Strip', version: '1.8.0', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 15.9, notes: '' },
  { id: '21', name: 'Crystalline', manufacturer: 'BABY Audio', category: 'Reverb', version: '1.8', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 39.8, notes: '' },
  { id: '22', name: 'Decapitator', manufacturer: 'SoundToys', category: 'Saturation', version: '5.0.1', formats: { au: true, vst: true, vst3: false, aax: false, clap: false }, sizeMb: 30.1, notes: '' },
  { id: '23', name: 'Diva', manufacturer: 'u-he', category: 'Synth', version: '1.4.5', formats: { au: true, vst: true, vst3: true, aax: false, clap: true }, sizeMb: 28.6, notes: '' },
  { id: '24', name: 'FabFilter Pro-Q 3', manufacturer: 'FabFilter', category: 'EQ', version: '3.0.0', formats: { au: true, vst: true, vst3: true, aax: true, clap: false }, sizeMb: 4.6, notes: '' },
  { id: '25', name: 'Gullfoss', manufacturer: 'Soundtheory', category: 'EQ', version: '1.0.0', formats: { au: false, vst: false, vst3: true, aax: false, clap: false }, sizeMb: 12.8, notes: '' }
];
