const ONLY_AVAILABLE_POOL_CODE = "LF-3705-SIM-02";

export function applyTemporaryPoolUrgencyMask<T extends { code: string; status: string; availableShares: number }>(
  pool: T,
): T {
  if (pool.code === ONLY_AVAILABLE_POOL_CODE) {
    return pool;
  }

  return {
    ...pool,
    status: "SOLD_OUT",
    availableShares: 0,
  };
}

export function isTemporaryPoolAvailable(poolCode: string) {
  return poolCode === ONLY_AVAILABLE_POOL_CODE;
}
