import fs from "fs";

// Resume PDF parsing utility

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  let pdfParse: any;
  try {
    pdfParse = require('pdf-parse');
  } catch (e) {
    pdfParse = (await import('pdf-parse')).default;
  }
  const data = await pdfParse(dataBuffer);
  return data.text;
}
