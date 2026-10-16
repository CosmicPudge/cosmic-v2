import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const source = join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destinationDirectory = join(process.cwd(), "public", "pdfjs");
mkdirSync(destinationDirectory, { recursive: true });
copyFileSync(source, join(destinationDirectory, "pdf.worker.min.mjs"));
console.log("PDF.js worker copied into public/pdfjs for local grade PDF parsing.");
