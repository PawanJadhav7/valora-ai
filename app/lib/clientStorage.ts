// app/lib/clientStorage.ts

function normEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function normHouseId(houseId: string) {
  return String(houseId || "").trim();
}

// --- Houses (already per-user) ---
export function housesKey(email: string) {
  return `valoraHousesV1:${normEmail(email)}`;
}

export function activeHouseKey(email: string) {
  return `valoraActiveHouseIdV1:${normEmail(email)}`;
}

// --- NEW: Datasets scoped per (user + house) ---
export function datasetsKey(email: string, houseId: string) {
  return `valoraDatasetsV1:${normEmail(email)}:${normHouseId(houseId)}`;
}

// --- NEW: Active client scoped per (user + house) ---
export function activeClientKey(email: string, houseId: string) {
  return `valoraActiveClientKeyV1:${normEmail(email)}:${normHouseId(houseId)}`;
}