// LifeGuard Emergency - local encrypted-style data store.
// In the real Android app this maps to AES-256 encrypted SharedPreferences.
// In this web prototype we persist to localStorage to demonstrate behaviour.

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  verified?: boolean;
}

export interface MedicalProfile {
  fullName: string;
  dateOfBirth: string; // yyyy-mm-dd
  address: string;
  bloodType: string;
  conditions: string;
  allergies: string;
  medications: string;
  organDonor: boolean;
  notes: string;
  contacts: EmergencyContact[];
}

export interface AppSettings {
  pin: string; // owner unlock pin
  emergencyCode: string; // responder code typed on lock screen (default 999)
  customMessage: string;
  triggerEnabled: boolean;
  smsEnabled: boolean;
  autoCallEnabled: boolean;
  alarmEnabled: boolean;
  flashlightEnabled: boolean;
  shareLocationEnabled: boolean;
  sensitivity: number; // presses window ms
  biometricLock: boolean;
}

const PROFILE_KEY = 'lifeguard.profile.v1';
const SETTINGS_KEY = 'lifeguard.settings.v1';
const SETUP_KEY = 'lifeguard.setupComplete.v1';

// Simulated phone address book to import emergency contacts from.
export const PHONE_CONTACTS: { name: string; phone: string }[] = [
  { name: 'Sarah Doe', phone: '+44 7700 900123' },
  { name: 'Dr. Patel', phone: '+44 7700 900456' },
  { name: 'Mum', phone: '+44 7700 900789' },
  { name: 'James Wright', phone: '+44 7700 900222' },
  { name: 'Aunt Lucy', phone: '+44 7700 900333' },
  { name: 'Work Reception', phone: '+44 161 4960000' },
];

// A blank profile used when a brand-new user starts the setup wizard.
export const emptyProfile: MedicalProfile = {
  fullName: '',
  dateOfBirth: '',
  address: '',
  bloodType: '',
  conditions: '',
  allergies: '',
  medications: '',
  organDonor: false,
  notes: '',
  contacts: [],
};

export const defaultProfile: MedicalProfile = {
  fullName: 'John Doe',
  dateOfBirth: '1985-04-12',
  address: '14 Oakwood Avenue, Manchester, M14 5TR',
  bloodType: 'O-',
  conditions: 'Type 1 Diabetes, Asthma',
  allergies: 'Penicillin, Peanuts',
  medications: 'Insulin (Lantus), Salbutamol inhaler',
  organDonor: true,
  notes: 'Carries insulin pen in jacket. Epilepsy history.',
  contacts: [
    { id: 'c1', name: 'Sarah Doe', relationship: 'Spouse', phone: '+44 7700 900123', isPrimary: true },
    { id: 'c2', name: 'Dr. Patel', relationship: 'GP', phone: '+44 7700 900456', isPrimary: false },
  ],
};

export const defaultSettings: AppSettings = {
  pin: '1234',
  emergencyCode: '999',
  customMessage: 'EMERGENCY: I need help. Please see my medical details and contact my emergency contacts.',
  triggerEnabled: true,
  smsEnabled: true,
  autoCallEnabled: true,
  alarmEnabled: true,
  flashlightEnabled: true,
  shareLocationEnabled: true,
  sensitivity: 1500,
  biometricLock: true,
};

export function loadProfile(): MedicalProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...defaultProfile, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return defaultProfile;
}

export function saveProfile(p: MedicalProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch (e) { /* ignore */ }
  return defaultSettings;
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function calcAge(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export function buildEmergencyText(p: MedicalProfile, custom: string, loc?: string): string {
  const parts = [
    `EMERGENCY: ${p.fullName} needs help.`,
    custom,
    `Blood Type: ${p.bloodType || 'Unknown'}.`,
    p.conditions ? `Conditions: ${p.conditions}.` : '',
    p.allergies ? `Allergies: ${p.allergies}.` : '',
    loc ? `Location: ${loc}` : 'Location: unavailable',
  ];
  return parts.filter(Boolean).join(' ');
}

export function isSetupComplete(): boolean {
  try { return localStorage.getItem(SETUP_KEY) === 'true'; } catch { return false; }
}

export function markSetupComplete() {
  localStorage.setItem(SETUP_KEY, 'true');
}

export function resetSetup() {
  localStorage.removeItem(SETUP_KEY);
}
