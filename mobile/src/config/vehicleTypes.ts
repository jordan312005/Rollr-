// Mirror of backend/src/config/vehicleTypes.js (kept in sync manually for MVP).
// Adding a new vehicle type only requires editing this list + the backend list;
// no database migration is needed (jobs store the key as text).

export type VehicleType = {
  key: 'bicycle' | 'ebike' | 'escooter' | 'other' | string;
  label: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
};

export const VEHICLE_TYPES: VehicleType[] = [
  { key: 'bicycle', label: 'Bicycle', icon: '🚲', sortOrder: 1, isActive: true },
  { key: 'ebike', label: 'E-Bike', icon: '🔋', sortOrder: 2, isActive: true },
  { key: 'escooter', label: 'Electric Scooter', icon: '🛴', sortOrder: 3, isActive: true },
  { key: 'other', label: 'Other', icon: '🔧', sortOrder: 99, isActive: true },
];

export const vehicleLabel = (key: string) =>
  VEHICLE_TYPES.find((v) => v.key === key)?.label ?? key;
