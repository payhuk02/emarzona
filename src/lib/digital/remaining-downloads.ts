/** Mappe le résultat RPC get_remaining_downloads + download_limit produit. */
export function mapRemainingDownloadsResult(
  downloadLimit: number | null | undefined,
  remaining: number | null | undefined
) {
  const limitValue = downloadLimit ?? -1;
  const unlimited = limitValue === -1 || remaining === -1;
  const remainingCount = unlimited ? Infinity : Math.max(0, Number(remaining ?? 0));
  const limit = unlimited ? Infinity : limitValue;
  const downloadCount = unlimited ? 0 : Math.max(0, limitValue - remainingCount);

  return {
    downloadCount,
    maxDownloads: limit,
    limit,
    remaining: remainingCount,
    unlimited,
    hasRemainingDownloads: unlimited || remainingCount > 0,
  };
}
