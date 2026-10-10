/**
 * Chrome MediaRecorder writes WebM Duration as "unknown" — HTML <audio> then shows 0:00.
 * Patch the EBML Duration element using the known wall-clock length from our timer.
 * Adapted from the widely used fix-webm-duration approach (MIT).
 */

function readUint(view: DataView, offset: number, length: number): number {
  let value = 0;
  for (let i = 0; i < length; i++) {
    value = (value << 8) + view.getUint8(offset + i);
  }
  return value;
}

function writeFloat64(view: DataView, offset: number, value: number): void {
  view.setFloat64(offset, value, false);
}

function findDurationElement(buffer: ArrayBuffer): { offset: number; sizeLen: number } | null {
  const bytes = new Uint8Array(buffer);
  // EBML ID for Duration: 0x4489
  for (let i = 0; i < bytes.length - 10; i++) {
    if (bytes[i] === 0x44 && bytes[i + 1] === 0x89) {
      const sizeByte = bytes[i + 2];
      let sizeLen = 1;
      if ((sizeByte & 0x80) === 0x80) sizeLen = 1;
      else if ((sizeByte & 0x40) === 0x40) sizeLen = 2;
      else if ((sizeByte & 0x20) === 0x20) sizeLen = 3;
      else if ((sizeByte & 0x10) === 0x10) sizeLen = 4;
      else continue;

      const dataOffset = i + 2 + sizeLen;
      const dataLen =
        readUint(new DataView(buffer), i + 2, sizeLen) & ~(0x80 << (8 * (sizeLen - 1)));
      // Duration is float64 (8 bytes) in Info
      if (dataLen === 8 && dataOffset + 8 <= bytes.length) {
        return { offset: dataOffset, sizeLen };
      }
    }
  }
  return null;
}

/** Returns a new Blob with Duration set to durationMs (milliseconds). */
export async function fixWebmDuration(blob: Blob, durationMs: number): Promise<Blob> {
  if (!durationMs || durationMs < 1) return blob;
  const type = (blob.type || 'audio/webm').split(';')[0] || 'audio/webm';
  if (!type.includes('webm') && !type.includes('matroska')) return blob;

  try {
    const buffer = await blob.arrayBuffer();
    const found = findDurationElement(buffer);
    if (!found) return blob;

    const copy = buffer.slice(0);
    const view = new DataView(copy);
    // Matroska Duration is in milliseconds as float64
    writeFloat64(view, found.offset, durationMs);
    return new Blob([copy], { type });
  } catch {
    return blob;
  }
}
