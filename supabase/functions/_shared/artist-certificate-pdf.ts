/**
 * Génération PDF certificat d'authenticité (Edge / Deno) — pdf-lib
 */

import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1.17.1';

export interface ArtistCertificatePdfInput {
  certificateNumber: string;
  artworkTitle: string;
  artistName: string;
  artworkMedium?: string | null;
  artworkYear?: number | null;
  editionNumber?: number | null;
  totalEdition?: number | null;
  signedByArtist?: boolean;
  signedDate?: string | null;
  purchaseDate: string;
  buyerName: string;
  buyerEmail?: string | null;
  certificateType: 'authenticity' | 'limited_edition' | 'handmade';
  verificationCode?: string | null;
}

function formatFrDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function typeLabel(type: ArtistCertificatePdfInput['certificateType']): string {
  switch (type) {
    case 'limited_edition':
      return "Certificat d'édition limitée";
    case 'handmade':
      return "Certificat d'œuvre artisanale";
    default:
      return "Certificat d'authenticité";
  }
}

export async function buildArtistCertificatePdfBytes(
  data: ArtistCertificatePdfInput
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([841.89, 595.28]);
  const { width, height } = page.getSize();
  const margin = 48;

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const primary = rgb(0.24, 0.24, 0.24);
  const accent = rgb(0.545, 0.361, 0.965);
  const muted = rgb(0.29, 0.33, 0.39);

  page.drawRectangle({
    x: margin,
    y: margin,
    width: width - margin * 2,
    height: height - margin * 2,
    borderColor: accent,
    borderWidth: 2,
  });

  page.drawRectangle({
    x: margin,
    y: height - margin - 8,
    width: width - margin * 2,
    height: 8,
    color: accent,
  });

  let y = height - margin - 36;

  const title = "CERTIFICAT D'AUTHENTICITÉ";
  const titleSize = 26;
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: titleSize,
    font: fontBold,
    color: primary,
  });
  y -= 22;

  const subtitle = typeLabel(data.certificateType);
  const subtitleSize = 12;
  const subtitleWidth = fontRegular.widthOfTextAtSize(subtitle, subtitleSize);
  page.drawText(subtitle, {
    x: (width - subtitleWidth) / 2,
    y,
    size: subtitleSize,
    font: fontRegular,
    color: muted,
  });
  y -= 28;

  page.drawLine({
    start: { x: margin + 24, y },
    end: { x: width - margin - 24, y },
    thickness: 0.5,
    color: accent,
  });
  y -= 24;

  const introLines = [
    "Le présent certificat atteste que l'œuvre décrite ci-dessous",
    "est authentique et provient directement de l'artiste.",
  ];
  for (const line of introLines) {
    page.drawText(line, {
      x: margin + 24,
      y,
      size: 10,
      font: fontRegular,
      color: muted,
    });
    y -= 14;
  }
  y -= 20;

  const drawSection = (heading: string, lines: Array<[string, string]>) => {
    page.drawText(heading, {
      x: margin + 24,
      y,
      size: 11,
      font: fontBold,
      color: primary,
    });
    y -= 16;
    for (const [label, value] of lines) {
      page.drawText(`${label}:`, {
        x: margin + 32,
        y,
        size: 10,
        font: fontBold,
        color: muted,
      });
      page.drawText(value, {
        x: margin + 32 + fontBold.widthOfTextAtSize(`${label}:`, 10) + 8,
        y,
        size: 10,
        font: fontRegular,
        color: muted,
      });
      y -= 14;
    }
    y -= 10;
  };

  const artworkLines: Array<[string, string]> = [
    ["Titre de l'œuvre", data.artworkTitle],
    ['Artiste', data.artistName],
  ];
  if (data.artworkMedium) artworkLines.push(['Médium', data.artworkMedium]);
  if (data.artworkYear) artworkLines.push(['Année', String(data.artworkYear)]);
  if (data.editionNumber != null && data.totalEdition != null) {
    artworkLines.push(['Édition', `${data.editionNumber} / ${data.totalEdition}`]);
  }
  drawSection("INFORMATIONS SUR L'ŒUVRE", artworkLines);

  const buyerLines: Array<[string, string]> = [
    ['Nom', data.buyerName],
    ["Date d'achat", formatFrDate(data.purchaseDate)],
  ];
  if (data.buyerEmail) buyerLines.push(['Email', data.buyerEmail]);
  drawSection("INFORMATIONS SUR L'ACHETEUR", buyerLines);

  if (data.signedByArtist) {
    page.drawText("SIGNATURE DE L'ARTISTE", {
      x: margin + 24,
      y,
      size: 11,
      font: fontBold,
      color: primary,
    });
    y -= 16;
    page.drawText("✓ Cette œuvre est signée par l'artiste", {
      x: margin + 32,
      y,
      size: 10,
      font: fontRegular,
      color: muted,
    });
    y -= 14;
    if (data.signedDate) {
      page.drawText(`Date de signature: ${formatFrDate(data.signedDate)}`, {
        x: margin + 32,
        y,
        size: 10,
        font: fontRegular,
        color: muted,
      });
      y -= 20;
    }
  }

  const footerY = margin + 52;
  page.drawText('Numéro de certificat:', {
    x: margin + 24,
    y: footerY + 14,
    size: 9,
    font: fontBold,
    color: primary,
  });
  page.drawText(data.certificateNumber, {
    x: margin + 24,
    y: footerY,
    size: 12,
    font: fontBold,
    color: accent,
  });

  if (data.verificationCode) {
    page.drawText(`Code de vérification: ${data.verificationCode}`, {
      x: margin + 24,
      y: footerY - 14,
      size: 8,
      font: fontRegular,
      color: muted,
    });
  }

  const footer =
    'Ce certificat est un document officiel émis par Emarzona. Conservez-le pour toute revente ou expertise.';
  const footerWidth = fontItalic.widthOfTextAtSize(footer, 8);
  page.drawText(footer, {
    x: (width - footerWidth) / 2,
    y: margin + 16,
    size: 8,
    font: fontItalic,
    color: muted,
  });

  return doc.save();
}

export async function uploadArtistCertificatePdf(
  supabase: {
    storage: {
      from: (b: string) => {
        upload: (p: string, b: Uint8Array, o: object) => Promise<{ error: Error | null }>;
        getPublicUrl: (p: string) => { data: { publicUrl: string } };
      };
    };
  },
  orderId: string,
  certificateNumber: string,
  pdfBytes: Uint8Array
): Promise<string> {
  const fileName = `certificate-${certificateNumber}-${Date.now()}.pdf`;
  const filePath = `artist-certificates/${orderId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-files')
    .upload(filePath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload PDF: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from('product-files').getPublicUrl(filePath);
  return urlData.publicUrl;
}
