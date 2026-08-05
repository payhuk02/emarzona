import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  downloadKeys,
  useGenerateDownloadLink,
  useTrackDownload,
} from '@/hooks/digital/useDownloads';
import {
  openCustomerDigitalFile,
  type OpenCustomerDigitalFileResult,
} from '@/lib/digital/open-customer-digital-file';
import { logger } from '@/lib/logger';

export type CustomerDigitalDownloadParams = {
  fileId: string;
  fileUrl?: string | null;
  digitalProductId?: string;
  licenseKey?: string;
  expiresIn?: number;
};

export function useCustomerDigitalDownload() {
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const generateLink = useGenerateDownloadLink();
  const trackDownload = useTrackDownload();
  const queryClient = useQueryClient();

  const downloadFile = useCallback(
    async (params: CustomerDigitalDownloadParams): Promise<OpenCustomerDigitalFileResult> => {
      const { fileId, fileUrl, digitalProductId, licenseKey, expiresIn = 3600 } = params;
      setDownloadingFileId(fileId);

      try {
        const result = await generateLink.mutateAsync({ fileId, expiresIn });
        const openResult = await openCustomerDigitalFile(result, fileUrl);

        if (digitalProductId) {
          try {
            await trackDownload.mutateAsync({
              digitalProductId,
              fileId,
              licenseKey,
            });
            await queryClient.invalidateQueries({ queryKey: ['customerPurchasedDigitalProducts'] });
            await queryClient.invalidateQueries({
              queryKey: downloadKeys.userDownloads('current'),
            });
          } catch (trackError: unknown) {
            logger.warn('Download tracking failed', { error: trackError, fileId });
          }
        }

        return openResult;
      } finally {
        setDownloadingFileId(null);
      }
    },
    [generateLink, trackDownload, queryClient]
  );

  return {
    downloadFile,
    downloadingFileId,
    isDownloading: downloadingFileId !== null,
  };
}
