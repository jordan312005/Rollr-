// ──────────────────────────────────────────────────────────────────────────
// Supported vehicle types — SINGLE SOURCE OF TRUTH (backend).
//
// Jobs store the `key` as plain text (jobs.vehicle_type_key), so adding a new
// vehicle type only requires editing this file — NO database migration needed.
//
// The mobile app has a mirror of this list at mobile/src/config/vehicleTypes.ts
// (kept in sync manually for the MVP). The `db:seed` script copies this list
// into the `vehicle_types` table for reporting/joins.
// ──────────────────────────────────────────────────────────────────────────

export const VEHICLE_TYPES = [
  { key: 'bicycle', label: 'Bicycle', icon: '🚲', sortOrder: 1, isActive: true },
  { key: 'ebike', label: 'E-Bike', icon: '🔋', sortOrder: 2, isActive: true },
  { key: 'escooter', label: 'Electric Scooter', icon: '🛴', sortOrder: 3, isActive: true },
  { key: 'other', label: 'Other', icon: '🔧', sortOrder: 99, isActive: true },
];

export const VEHICLE_TYPE_KEYS = VEHICLE_TYPES.map((v) => v.key);

export function isValidVehicleType(key) {
  return VEHICLE_TYPE_KEYS.includes(key);
}

export function vehicleLabel(key) {
  return VEHICLE_TYPES.find((v) => v.key === key)?.label ?? key;
}
