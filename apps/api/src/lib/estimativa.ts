const BASE_SECONDS = 90;
const PER_PENDING_SECONDS = 60;
const CAP_SECONDS = 600;

export function calcularEstimativa(pendingCount: number): number {
  return Math.min(BASE_SECONDS + pendingCount * PER_PENDING_SECONDS, CAP_SECONDS);
}
