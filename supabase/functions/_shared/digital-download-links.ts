import { mintOrderDownloadLink } from './mint-download-token.ts';

export type DigitalProductFileRow = {
  name: string;
  file_url: string;
  is_main?: boolean | null;
  order_index?: number | null;
  is_preview?: boolean | null;
  requires_purchase?: boolean | null;
};

type SupabaseRpcClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => {
        order: (
          column: string,
          options: { ascending: boolean }
        ) => {
          order: (
            column: string,
            options: { ascending: boolean }
          ) => Promise<{ data: DigitalProductFileRow[] | null; error: { message: string } | null }>;
        };
      };
    };
  };
};

export type BuiltDigitalDownloadLinks = {
  files: DigitalProductFileRow[];
  links: Array<{ name: string; url: string }>;
  downloadLinksHtml: string;
  primaryDownloadLink: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function buildDigitalDownloadLinks(
  supabase: SupabaseRpcClient,
  options: {
    siteUrl: string;
    productId: string;
    digitalProductId: string;
    customerId: string | null;
    licenseId: string | null;
    fallbackMainFileUrl?: string | null;
    portalPath?: string;
  }
): Promise<BuiltDigitalDownloadLinks> {
  const portalPath = options.portalPath ?? '/account/digital';
  const portalLink = `${options.siteUrl.replace(/\/+$/, '')}${portalPath}`;

  const { data: files, error } = await supabase
    .from('digital_product_files')
    .select('name, file_url, is_main, order_index, is_preview, requires_purchase')
    .eq('digital_product_id', options.digitalProductId)
    .order('is_main', { ascending: false })
    .order('order_index', { ascending: true });

  if (error) {
    console.warn('[buildDigitalDownloadLinks] failed to load files', error.message);
  }

  let fileRows = (files ?? []).filter(
    file =>
      Boolean(file.file_url?.trim()) &&
      file.is_preview !== true &&
      file.requires_purchase !== false
  );

  if (fileRows.length === 0 && options.fallbackMainFileUrl?.trim()) {
    fileRows = [
      {
        name: 'Fichier principal',
        file_url: options.fallbackMainFileUrl.trim(),
        is_main: true,
        order_index: 0,
      },
    ];
  }

  const links: Array<{ name: string; url: string }> = [];

  if (options.customerId) {
    for (const file of fileRows) {
      const url = await mintOrderDownloadLink(supabase, {
        siteUrl: options.siteUrl,
        productId: options.productId,
        fileUrl: file.file_url,
        customerId: options.customerId,
        licenseId: options.licenseId,
      });

      if (url) {
        links.push({
          name: file.name?.trim() || 'Fichier',
          url,
        });
      }
    }
  }

  const downloadLinksHtml =
    links.length > 0
      ? `<ul style="padding-left:20px;margin:12px 0;">${links
          .map(
            link =>
              `<li style="margin-bottom:8px;"><a href="${escapeHtml(link.url)}" style="color:#111;text-decoration:underline;">${escapeHtml(link.name)}</a></li>`
          )
          .join('')}</ul>`
      : '';

  const primaryDownloadLink =
    links.length === 1 ? links[0].url : links.length > 1 ? portalLink : portalLink;

  return {
    files: fileRows,
    links,
    downloadLinksHtml,
    primaryDownloadLink,
  };
}
