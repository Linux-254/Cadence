export async function downloadSpecPdf(onError?: (message: string) => void): Promise<boolean> {
  const endpoints = ['/api/docs/pdf', '/Cadence_Complete_Documentation.pdf'];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, { method: 'GET' });
      if (!res.ok) continue;

      const buffer = await res.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Verify %PDF- header bytes (0x25 0x50 0x44 0x46 0x2D)
      if (
        bytes.length < 1024 ||
        bytes[0] !== 0x25 ||
        bytes[1] !== 0x50 ||
        bytes[2] !== 0x44 ||
        bytes[3] !== 0x46 ||
        bytes[4] !== 0x2d
      ) {
        continue;
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Cadence_Complete_Documentation.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
      return true;
    } catch {
      // Try next fallback endpoint
    }
  }

  onError?.('Unable to download the specification PDF right now. Try refreshing or printing from Docs.');
  return false;
}
