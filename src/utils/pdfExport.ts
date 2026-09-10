import { jsPDF } from 'jspdf';

/**
 * Convert an SVG element to high-resolution JPEG Data URL
 */
async function svgToImageData(svgEl: SVGSVGElement): Promise<string> {
  const clonedSvg = svgEl.cloneNode(true) as SVGSVGElement;
  clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clonedSvg.setAttribute('width', '1150');
  clonedSvg.setAttribute('height', '780');

  // Serialize SVG to XML string
  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clonedSvg);

  // Ensure standard xml namespace
  if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const blobURL = window.URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = blobURL;
  });

  // High-resolution canvas (2x: 2300 x 1560)
  const canvas = document.createElement('canvas');
  canvas.width = 2300;
  canvas.height = 1560;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get canvas 2D context');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  window.URL.revokeObjectURL(blobURL);

  return canvas.toDataURL('image/jpeg', 0.98);
}

/**
 * Export the complete Seating Plan & Sub-zone Plans to a downloadable multi-page A4 Landscape PDF
 * 
 * Order of 5 pages:
 * 1. ผังรวมที่นั่งทั้งหมด (Overall Seating Plan)
 * 2. โซนสีชมพู (แถว A, B, C, D, E รวม 60 ที่นั่ง)
 * 3. โซนสีเหลือง (แถว F, G, H รวม 18 ที่นั่ง)
 * 4. โซนสีเขียวด้านขวา (แถว I รวม 8 ที่นั่ง)
 * 5. โซนสีส้มอ่อน/พีชด้านขวา (แถว J & K รวม 17 ที่นั่ง)
 */
export async function exportSeatingPlanToPdf(): Promise<boolean> {
  const pageSpecs = [
    { id: 'seating-plan-canvas', fallbackIds: [], title: 'ผังรวมที่นั่งทั้งหมด' },
    { id: 'zone-subplan-svg-pink', fallbackIds: ['zone-subplan-svg-green'], title: 'ผังย่อยโซนสีชมพู (แถว A - E)' },
    { id: 'zone-subplan-svg-yellow', fallbackIds: ['zone-subplan-svg-blue'], title: 'ผังย่อยโซนสีเหลือง (แถว F - H)' },
    { id: 'zone-subplan-svg-right-green', fallbackIds: ['zone-subplan-svg-right-blue'], title: 'ผังย่อยโซนสีเขียวด้านขวา (แถว I)' },
    { id: 'zone-subplan-svg-right-peach', fallbackIds: ['zone-subplan-svg-right-yellow'], title: 'ผังย่อยโซนสีส้มอ่อนด้านขวา (แถว J & K)' },
  ];

  try {
    // Create A4 Landscape PDF: 297mm x 210mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = 281;
    const pdfHeight = pdfWidth / (1150 / 780); // ~190.6mm
    const x = (297 - pdfWidth) / 2; // ~8mm
    const y = (210 - pdfHeight) / 2; // ~9.7mm

    let renderedPagesCount = 0;

    for (let i = 0; i < pageSpecs.length; i++) {
      const spec = pageSpecs[i];
      let el = document.getElementById(spec.id) as unknown as SVGSVGElement | null;
      if (!el && spec.fallbackIds.length > 0) {
        for (const fbId of spec.fallbackIds) {
          el = document.getElementById(fbId) as unknown as SVGSVGElement | null;
          if (el) break;
        }
      }

      if (!el) {
        console.warn(`Element #${spec.id} for "${spec.title}" not found, skipping`);
        continue;
      }

      const imgData = await svgToImageData(el);

      if (renderedPagesCount > 0) {
        pdf.addPage('a4', 'landscape');
      }

      pdf.addImage(imgData, 'JPEG', x, y, pdfWidth, pdfHeight);
      renderedPagesCount++;
    }

    if (renderedPagesCount === 0) {
      window.print();
      return false;
    }

    // Save with standardized filename
    const dateStr = new Date().toISOString().slice(0, 10);
    pdf.save(`Silpa_Bhirasri_Seating_Plan_Complete_${dateStr}.pdf`);
    return true;
  } catch (err) {
    console.error('Error generating multi-page PDF:', err);
    window.print();
    return false;
  }
}
