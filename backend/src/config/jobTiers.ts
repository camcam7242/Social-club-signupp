export const JOB_TYPES = [
  'flat_tire',
  'battery',
  'oil_change',
  'brakes',
  'wiper_blades',
  'air_filter',
  'jump_start',
  'engine_diagnostic',
  'transmission',
  'ac_repair',
  'suspension',
  'electrical',
  'timing_belt',
  'exhaust',
  'coolant',
  'other',
] as const;

export type JobType = typeof JOB_TYPES[number];

// Jobs basic (uncertified) mechanics are allowed to do
export const BASIC_ALLOWED: JobType[] = [
  'flat_tire',
  'battery',
  'oil_change',
  'brakes',
  'wiper_blades',
  'air_filter',
  'jump_start',
];

// Certified mechanics can do everything except master-only jobs
export const CERTIFIED_ALLOWED: JobType[] = [
  ...BASIC_ALLOWED,
  'engine_diagnostic',
  'transmission',
  'ac_repair',
  'suspension',
  'electrical',
  'coolant',
  'exhaust',
  'other',
];

// Master mechanics have no restrictions
export const canMechanicDoJob = (tier: string, jobType: string): boolean => {
  if (tier === 'master') return true;
  if (tier === 'certified') return CERTIFIED_ALLOWED.includes(jobType as JobType);
  return BASIC_ALLOWED.includes(jobType as JobType);
};

export const TIER_LABELS: Record<string, string> = {
  basic: 'Basic (no certification required)',
  certified: 'Certified Mechanic',
  master: 'Master Technician',
};
