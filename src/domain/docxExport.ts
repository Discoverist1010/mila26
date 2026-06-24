export function createDocxContentFromMarkdown(markdown: string, title: string): Uint8Array {
  const documentXml = markdownToWordDocumentXml(markdown, title);

  return createDocxArchive({
    '[Content_Types].xml': [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '<Default Extension="xml" ContentType="application/xml"/>',
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
      '</Types>',
    ].join(''),
    '_rels/.rels': [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
      '</Relationships>',
    ].join(''),
    'word/document.xml': documentXml,
  });
}

function markdownToWordDocumentXml(markdown: string, title: string): string {
  const body = markdown
    .split('\n')
    .flatMap((line) => markdownLineToWordParagraphs(line))
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    '<w:body>',
    wordParagraph(title, 'Title'),
    body,
    '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>',
    '</w:body>',
    '</w:document>',
  ].join('');
}

function markdownLineToWordParagraphs(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [wordParagraph('')];
  if (/^\|?[-\s|]+\|?$/.test(trimmed)) return [];
  if (trimmed.startsWith('# ')) return [wordParagraph(trimmed.slice(2), 'Heading1')];
  if (trimmed.startsWith('## ')) return [wordParagraph(trimmed.slice(3), 'Heading2')];
  if (trimmed.startsWith('- ')) return [wordParagraph(`• ${trimmed.slice(2)}`)];
  if (trimmed.startsWith('|')) {
    const cells = splitMarkdownTableRow(trimmed);
    return cells.length > 0 ? [wordParagraph(cells.join(' | '))] : [];
  }
  return [wordParagraph(trimmed)];
}

function splitMarkdownTableRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    const previous = index > 0 ? row[index - 1] : '';
    if (char === '|' && previous !== '\\') {
      if (current.trim()) cells.push(unescapeMarkdownTableCell(current.trim()));
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) cells.push(unescapeMarkdownTableCell(current.trim()));
  return cells;
}

function unescapeMarkdownTableCell(value: string): string {
  return value.replaceAll('\\|', '|').replaceAll('\\\\', '\\');
}

function wordParagraph(text: string, style?: 'Title' | 'Heading1' | 'Heading2'): string {
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : '';
  return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${escapeDocxXml(text)}</w:t></w:r></w:p>`;
}

export function escapeDocxXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function createDocxArchive(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder();
  const fileEntries = Object.entries(files).map(([name, content]) => ({
    name,
    nameBytes: encoder.encode(name),
    data: encoder.encode(content),
  }));
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of fileEntries) {
    const crc = crc32(entry.data);
    const localHeader = zipLocalHeader(entry.nameBytes, entry.data.length, crc);
    localParts.push(localHeader, entry.nameBytes, entry.data);
    centralParts.push(zipCentralHeader(entry.nameBytes, entry.data.length, crc, offset), entry.nameBytes);
    offset += localHeader.length + entry.nameBytes.length + entry.data.length;
  }

  const centralOffset = offset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = zipEndRecord(fileEntries.length, centralSize, centralOffset);
  return concatBytes([...localParts, ...centralParts, endRecord]);
}

function zipLocalHeader(fileName: Uint8Array, size: number, crc: number): Uint8Array {
  const header = new Uint8Array(30);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, size, true);
  view.setUint32(22, size, true);
  view.setUint16(26, fileName.length, true);
  return header;
}

function zipCentralHeader(fileName: Uint8Array, size: number, crc: number, localOffset: number): Uint8Array {
  const header = new Uint8Array(46);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, size, true);
  view.setUint32(24, size, true);
  view.setUint16(28, fileName.length, true);
  view.setUint32(42, localOffset, true);
  return header;
}

function zipEndRecord(fileCount: number, centralSize: number, centralOffset: number): Uint8Array {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, fileCount, true);
  view.setUint16(10, fileCount, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, centralOffset, true);
  return record;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

const crc32Table = new Uint32Array(
  Array.from({ length: 256 }, (_, index) => {
    let crc = index;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    return crc >>> 0;
  }),
);

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
