/* Lightweight, local DOCX preview: extracts WordprocessingML in the browser without uploading the file elsewhere. */
(function () {
  const decoder = new TextDecoder();

  async function inflateRaw(bytes) {
    if (typeof DecompressionStream === 'undefined') throw new Error('DOCX preview needs a browser with compressed stream support.');
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function getZipXmlEntries(buffer, shouldRead) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('This DOCX file is invalid or incomplete.');
    const count = view.getUint16(eocd + 10, true);
    let cursor = view.getUint32(eocd + 16, true);
    const entries = [];
    for (let i = 0; i < count; i++) {
      if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('Could not read this DOCX archive.');
      const method = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const nameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localOffset = view.getUint32(cursor + 42, true);
      const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
      if (shouldRead(name)) {
        const localNameLength = view.getUint16(localOffset + 26, true);
        const localExtraLength = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + localNameLength + localExtraLength;
        const packed = bytes.subarray(dataStart, dataStart + compressedSize);
        const xmlBytes = method === 0 ? packed : method === 8 ? await inflateRaw(packed) : null;
        if (!xmlBytes) throw new Error('This DOCX compression format is not supported.');
        entries.push({ name, xml: new DOMParser().parseFromString(decoder.decode(xmlBytes), 'application/xml') });
      }
      cursor += 46 + nameLength + extraLength + commentLength;
    }
    return entries;
  }

  async function getDocumentXml(buffer) {
    const entries = await getZipXmlEntries(buffer, name => name === 'word/document.xml');
    if (!entries[0]) throw new Error('The DOCX file does not contain a readable document.');
    return entries[0].xml;
  }

  function renderInline(node) {
    return [...node.childNodes].map(child => {
      if (child.nodeType === Node.TEXT_NODE) return '';
      const name = child.localName;
      if (name === 't') return document.createTextNode(child.textContent).textContent;
      if (name === 'tab') return '&emsp;';
      if (name === 'br' || name === 'cr') return '<br>';
      if (name === 'drawing' || name === 'pict') return '<span class="docx-image-placeholder">[Embedded image]</span>';
      if (name !== 'r') return renderInline(child);
      let text = [...child.getElementsByTagNameNS('*', 't')].map(part => part.textContent).join('');
      text = text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
      if (child.getElementsByTagNameNS('*', 'br').length) text += '<br>';
      const props = child.getElementsByTagNameNS('*', 'rPr')[0];
      if (props?.getElementsByTagNameNS('*', 'b').length) text = `<strong>${text}</strong>`;
      if (props?.getElementsByTagNameNS('*', 'i').length) text = `<em>${text}</em>`;
      if (props?.getElementsByTagNameNS('*', 'u').length) text = `<u>${text}</u>`;
      return text;
    }).join('');
  }

  function renderBlock(node) {
    const name = node.localName;
    if (name === 'p') {
      const content = renderInline(node);
      const style = node.getElementsByTagNameNS('*', 'pStyle')[0]?.getAttribute('val') || '';
      const heading = /^Heading([1-6])$/i.exec(style);
      return heading ? `<h${heading[1]}>${content}</h${heading[1]}>` : `<p>${content || '&nbsp;'}</p>`;
    }
    if (name === 'tbl') {
      const rows = [...node.children].filter(child => child.localName === 'tr').map(row => `<tr>${[...row.children].filter(cell => cell.localName === 'tc').map(cell => `<td>${[...cell.children].map(renderBlock).join('')}</td>`).join('')}</tr>`).join('');
      return `<table><tbody>${rows}</tbody></table>`;
    }
    return [...node.children].map(renderBlock).join('');
  }

  async function render(url, host) {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error(`Could not load the document (${response.status}).`);
    const xml = await getDocumentXml(await response.arrayBuffer());
    if (xml.querySelector('parsererror')) throw new Error('This DOCX document could not be parsed.');
    const body = xml.getElementsByTagNameNS('*', 'body')[0];
    if (!body) throw new Error('This DOCX document has no readable content.');
    host.innerHTML = `<style>
      .docx-document{max-width:850px;margin:0 auto;padding:24px 34px;background:#fff;color:#1f2937;font:16px/1.75 Georgia,"Times New Roman",serif;box-shadow:0 2px 14px #0f172a12}
      .docx-document p{margin:0 0 12px;white-space:pre-wrap}.docx-document h1,.docx-document h2,.docx-document h3,.docx-document h4{font-family:Arial,sans-serif;line-height:1.3;margin:24px 0 12px;font-weight:700}
      .docx-document table{border-collapse:collapse;width:100%;margin:16px 0}.docx-document td{border:1px solid #cbd5e1;padding:7px;vertical-align:top}
      .docx-image-placeholder{color:#64748b;font-style:italic}@media(max-width:640px){.docx-document{padding:18px 16px;font-size:15px}}
    </style><article class="docx-document">${[...body.children].map(renderBlock).join('')}</article>`;
  }

  async function renderPowerPoint(url, host) {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error(`Could not load the presentation (${response.status}).`);
    const slides = await getZipXmlEntries(await response.arrayBuffer(), name => /^ppt\/slides\/slide\d+\.xml$/.test(name));
    slides.sort((a, b) => Number(a.name.match(/slide(\d+)/)[1]) - Number(b.name.match(/slide(\d+)/)[1]));
    if (!slides.length) throw new Error('This presentation has no readable slides.');
    host.innerHTML = '<style>.office-slide{max-width:900px;min-height:320px;margin:20px auto;padding:28px 34px;background:#fff;color:#1f2937;border-radius:12px;box-shadow:0 2px 14px #0f172a12}.office-slide h3{margin:0 0 18px;color:#64748b;font:700 12px Arial,sans-serif;text-transform:uppercase;letter-spacing:.08em}.office-slide p{font:18px/1.55 Arial,sans-serif;margin:0 0 12px;white-space:pre-wrap}@media(max-width:640px){.office-slide{margin:12px;padding:20px}}</style>';
    for (const slide of slides) {
      const section = document.createElement('section');
      section.className = 'office-slide';
      const heading = document.createElement('h3');
      heading.textContent = `Slide ${slide.name.match(/slide(\d+)/)[1]}`;
      section.append(heading);
      const strings = [...slide.xml.getElementsByTagNameNS('*', 't')].map(node => node.textContent).filter(Boolean);
      for (const value of strings) {
        const paragraph = document.createElement('p');
        paragraph.textContent = value;
        section.append(paragraph);
      }
      host.append(section);
    }
  }

  window.dbcmDocxReader = { render, renderPowerPoint };
})();
