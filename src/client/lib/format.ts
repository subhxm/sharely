export function formatBytes(bytes: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: "byte",
    unitDisplay: "short",
    notation: bytes > 999_999 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(bytes);
}

export function formatSpeed(bytesPerSecond: number): string {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return "0 B/s";
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "soon";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  return `${Math.ceil(seconds / 60)}m`;
}
