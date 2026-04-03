/**
 * Embeds a ZUGFeRD / Factur-X XML file into an existing PDF blob using pdf-lib.
 * The resulting PDF contains the XML as a named embedded file "factur-x.xml",
 * which accounting software can extract and process automatically.
 */
import { PDFDocument } from 'pdf-lib';

export async function embedZugferdXml(pdfBlob: Blob, xmlString: string): Promise<Blob> {
  const pdfBytes = await pdfBlob.arrayBuffer();
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const xmlBytes = new TextEncoder().encode(xmlString);

  await pdfDoc.attach(xmlBytes, 'factur-x.xml', {
    mimeType: 'text/xml',
    description: 'Factur-X / ZUGFeRD 2.3 BASIC Invoice XML',
    creationDate: new Date(),
    modificationDate: new Date(),
  });

  const modifiedBytes = await pdfDoc.save();
  return new Blob([modifiedBytes], { type: 'application/pdf' });
}
