const AVAILABLE_POOL_CODES = new Set(["LF-3713-SIM-02", "LF-3714-SIM-02", "LF-3715-SIM-02"]);

export function applyTemporaryPoolUrgencyMask<T extends { code: string; status: string; availableShares: number }>(
  pool: T,
): T {
  if (pool.status !== "OPEN" && pool.status !== "SOLD_OUT") {
    return pool;
  }

  if (AVAILABLE_POOL_CODES.has(pool.code)) {
    return pool;
  }

  return {
    ...pool,
    status: "SOLD_OUT",
    availableShares: 0,
  };
}

export function isTemporaryPoolAvailable(poolCode: string) {
  return AVAILABLE_POOL_CODES.has(poolCode);
}
