import { ExercisePreset, TimeSignature } from '../types/metronome';

export const EXERCISE_CADENCE_PRESETS: ExercisePreset[] = [
  {
    id: 'walk-active',
    label: 'Caminata Activa',
    bpm: 100,
    category: 'Caminar',
    description: 'Paso firme y constante para calentamiento o marcha nórdica.',
    spmRange: '95 - 105 pasos/min',
  },
  {
    id: 'fast-march',
    label: 'Marcha Ligera',
    bpm: 120,
    category: 'Caminar',
    description: 'Ritmo rápido para cardio suave y quema calórica continua.',
    spmRange: '115 - 125 pasos/min',
  },
  {
    id: 'jog-recovery',
    label: 'Trote Suave / Regenerativo',
    bpm: 140,
    category: 'Trote',
    description: 'Recuperación aeróbica después de tiradas largas o series.',
    spmRange: '135 - 145 pasos/min',
  },
  {
    id: 'jog-base',
    label: 'Trote de Fondo',
    bpm: 155,
    category: 'Trote',
    description: 'Cadencia continua para rodajes largos y resistencia.',
    spmRange: '150 - 158 pasos/min',
  },
  {
    id: 'run-tempo',
    label: 'Running Eficiente (165)',
    bpm: 165,
    category: 'Running',
    description: 'Excelente para reducir impacto en articulaciones y mejorar zancada.',
    spmRange: '160 - 170 pasos/min',
  },
  {
    id: 'run-marathon',
    label: 'Cadencia Dorada 180 SPM',
    bpm: 180,
    category: 'Maratón',
    description: 'El estándar universal de biomecánica eficiente de running (180 pasos/minuto).',
    spmRange: '175 - 185 pasos/min',
  },
  {
    id: 'hiit-rope',
    label: 'Salto de Comba / HIIT',
    bpm: 130,
    category: 'HIIT / Cardio',
    description: 'Compás marcado para saltos rítmicos y circuitos funcionales.',
    spmRange: 'Intervalos 1:1',
  },
  {
    id: 'sprint-burst',
    label: 'Sprint y Pista (190)',
    bpm: 190,
    category: 'HIIT / Cardio',
    description: 'Máxima frecuencia de paso para series cortas de velocidad explosiva.',
    spmRange: '188 - 200 pasos/min',
  },
];

export const TIME_SIGNATURE_PRESETS: TimeSignature[] = [
  { beats: 4, subdivision: 4, name: '4/4 (Estándar deportivo)', accentIndices: [0] },
  { beats: 3, subdivision: 4, name: '3/4 (Vals / Patrón triple)', accentIndices: [0] },
  { beats: 2, subdivision: 4, name: '2/4 (Marcha / Zancada Izq-Der)', accentIndices: [0] },
  { beats: 1, subdivision: 4, name: '1/4 (Pulso continuo sin acento)', accentIndices: [] },
  { beats: 6, subdivision: 8, name: '6/8 (Compás compuesto fluido)', accentIndices: [0, 3] },
  { beats: 5, subdivision: 4, name: '5/4 (Asimétrico / Complejo)', accentIndices: [0] },
];
