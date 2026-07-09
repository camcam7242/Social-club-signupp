export const JOB_TYPES = [
  'flat_tire',
  'battery',
  'oil_change',
  'brakes',
  'wiper_blades',
  'air_filter',
  'jump_start',
  'locksmith',
  'engine_diagnostic',
  'transmission',          // legacy — treated as transmission_service
  'transmission_service',  // fluid, solenoids, seals — mobile-friendly
  'transmission_major',    // rebuild/replace — needs garage or heavy equipment
  'ac_repair',
  'suspension',
  'electrical',
  'timing_belt',
  'exhaust',
  'coolant',
  'other',
  'diesel_repair',
  'diesel_diagnostic',
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
  'locksmith',
];

// Certified mechanics can do everything except master-only jobs
export const CERTIFIED_ALLOWED: JobType[] = [
  ...BASIC_ALLOWED,
  'engine_diagnostic',
  'transmission',
  'transmission_service',
  'ac_repair',
  'suspension',
  'electrical',
  'coolant',
  'exhaust',
  'diesel_repair',
  'other',
];

// Master-only job types (too specialized for basic/certified)
export const MASTER_ONLY: JobType[] = [
  'diesel_diagnostic',
  'transmission_major',
];

// Jobs that also require the mechanic to have a garage or heavy equipment
export const HEAVY_EQUIPMENT_REQUIRED: JobType[] = [
  'transmission_major',
];

export const canMechanicDoJob = (
  tier: string,
  jobType: string,
  hasGarage: boolean = false
): boolean => {
  if (HEAVY_EQUIPMENT_REQUIRED.includes(jobType as JobType) && !hasGarage) return false;
  if (MASTER_ONLY.includes(jobType as JobType)) return tier === 'master';
  if (tier === 'master') return true;
  if (tier === 'certified') return CERTIFIED_ALLOWED.includes(jobType as JobType);
  return BASIC_ALLOWED.includes(jobType as JobType);
};

export const TIER_LABELS: Record<string, string> = {
  basic: 'Basic (no certification required)',
  certified: 'Certified Mechanic',
  master: 'Master Technician',
};
