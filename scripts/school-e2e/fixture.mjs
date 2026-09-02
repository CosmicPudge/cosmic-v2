import { deflateRawSync } from "node:zlib";

const encoder = new TextEncoder();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) { const output = Buffer.alloc(2); output.writeUInt16LE(value); return output; }
function u32(value) { const output = Buffer.alloc(4); output.writeUInt32LE(value); return output; }

export function syntheticDocx() {
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${"Synthetic E2E syllabus: MATH 1010 quiz Friday."}</w:t></w:r></w:p><w:sectPr/></w:body></w:document>`,
  };
  const local = []; const central = []; let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(name); const data = Buffer.from(encoder.encode(content)); const compressed = deflateRawSync(data);
    const header = Buffer.concat([Buffer.from("PK\x03\x04", "binary"), u16(20), u16(0), u16(8), u16(0), u16(0), u32(crc32(data)), u32(compressed.length), u32(data.length), u16(nameBytes.length), u16(0), Buffer.from(nameBytes), compressed]);
    local.push(header);
    central.push(Buffer.concat([Buffer.from("PK\x01\x02", "binary"), u16(20), u16(20), u16(0), u16(8), u16(0), u16(0), u32(crc32(data)), u32(compressed.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), Buffer.from(nameBytes)]));
    offset += header.length;
  }
  const centralDirectory = Buffer.concat(central); const body = Buffer.concat(local);
  const end = Buffer.concat([Buffer.from("PK\x05\x06", "binary"), u16(0), u16(0), u16(files ? Object.keys(files).length : 0), u16(Object.keys(files).length), u32(centralDirectory.length), u32(body.length), u16(0)]);
  return Buffer.concat([body, centralDirectory, end]);
}

export const syntheticPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
