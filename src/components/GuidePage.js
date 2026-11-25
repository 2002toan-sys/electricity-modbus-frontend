import React, { useEffect, useState } from 'react';
import { AlertCircle, BookOpen, Loader2 } from 'lucide-react';
import guideDocumentUrl from '../docs/huong-dan-su-dung.md';

const isHeading = (line) => /^#{1,3}\s+/.test(line);
const isListItem = (line) => /^\s*(?:[-*]|\d+\.)\s+/.test(line);
const isTableRow = (line) => /^\|.*\|$/.test(line.trim());

const getCells = (line) => line.trim().slice(1, -1).split('|').map((cell) => cell.trim());

const STATE_HIGHLIGHTS = {
  'Trống': 'bg-green-100 text-green-800 ring-green-200',
  'Chờ khách': 'bg-blue-100 text-blue-800 ring-blue-200',
  'Có khách': 'bg-red-100 text-red-800 ring-red-200',
  'Bật cưỡng bức': 'bg-amber-100 text-amber-800 ring-amber-200',
  'Bảo trì': 'bg-slate-200 text-slate-800 ring-slate-300',
};

const renderInline = (text) => text.split(/(\*\*.*?\*\*)/g).map((part, index) => {
  if (part.startsWith('**') && part.endsWith('**')) {
    const value = part.slice(2, -2);
    const stateClass = STATE_HIGHLIGHTS[value];
    return (
      <strong
        key={index}
        className={`rounded px-1.5 py-0.5 font-semibold ${
          stateClass || 'bg-blue-50 text-blue-800'
        }`}
      >
        {value}
      </strong>
    );
  }
  return part;
});

const createId = (text) => text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const parseMarkdown = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const text = heading[2].replace(/\*\*/g, '');
      blocks.push({ type: 'heading', level: heading[1].length, text, id: createId(text) });
      index += 1;
      continue;
    }

    if (line === '---') {
      blocks.push({ type: 'separator' });
      index += 1;
      continue;
    }

    if (isTableRow(line) && lines[index + 1]?.trim().startsWith('|')) {
      const headers = getCells(line);
      index += 2;
      const rows = [];
      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(getCells(lines[index]));
        index += 1;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    if (isListItem(line)) {
      const ordered = /^\d+\./.test(line);
      const items = [];
      while (index < lines.length && isListItem(lines[index])) {
        const match = lines[index].match(/^(\s*)(?:[-*]|\d+\.)\s+(.*)$/);
        items.push({ text: match[2], depth: Math.floor(match[1].length / 2) });
        index += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isHeading(lines[index].trim()) &&
      !isListItem(lines[index]) &&
      !isTableRow(lines[index].trim()) &&
      lines[index].trim() !== '---'
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
};

const MarkdownContent = ({ markdown }) => {
  const blocks = parseMarkdown(markdown);

  return (
    <article className="w-full space-y-6 rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
      <div className="space-y-6 text-base leading-8 text-slate-700">
        {blocks.map((block, index) => {
          if (block.type === 'heading') {
            const HeadingTag = `h${block.level}`;
            const headingClass = block.level === 1
              ? 'border-b border-slate-200 pb-4 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl'
              : block.level === 2
                ? 'rounded-r-lg border-l-4 border-blue-500 bg-blue-50/70 px-4 py-3 text-2xl font-bold text-blue-950'
                : 'rounded-r border-l-2 border-indigo-300 bg-indigo-50/50 px-3 py-1 text-lg font-bold text-indigo-950';
            return (
              <HeadingTag key={block.id} id={block.id} className={headingClass}>
                {block.text}
              </HeadingTag>
            );
          }

          if (block.type === 'paragraph') {
            return <p key={index}>{renderInline(block.text)}</p>;
          }

          if (block.type === 'list') {
            const ListTag = block.ordered ? 'ol' : 'ul';
            return (
              <ListTag
                key={index}
                className={`space-y-1 pl-6 ${block.ordered ? 'list-decimal' : 'list-disc'}`}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} style={{ marginInlineStart: `${item.depth * 1.25}rem` }}>
                    {renderInline(item.text)}
                  </li>
                ))}
              </ListTag>
            );
          }

          if (block.type === 'table') {
            return (
              <div key={index} className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-left text-base">
                  <thead className="bg-slate-50 text-sm font-bold uppercase tracking-wide text-slate-600">
                    <tr>
                      {block.headers.map((cell, cellIndex) => (
                        <th key={cellIndex} scope="col" className="px-5 py-4">
                          {renderInline(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {block.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="align-top even:bg-slate-50/50">
                        {row.map((cell, cellIndex) => {
                          const state = cell.replace(/\*\*/g, '');
                          const stateClass = cellIndex === 0 && STATE_HIGHLIGHTS[state];
                          return (
                            <td key={cellIndex} className="px-5 py-4">
                              {stateClass ? (
                                <span className={`inline-flex rounded-full px-2.5 py-1 font-semibold ring-1 ring-inset ${stateClass}`}>
                                  {state}
                                </span>
                              ) : renderInline(cell)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          return <hr key={index} className="border-slate-200" />;
        })}
      </div>
    </article>
  );
};

const GuidePage = () => {
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!markdown || !window.location.hash) return undefined;
    const sectionId = decodeURIComponent(window.location.hash.slice(1));
    const timeoutId = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [markdown]);

  useEffect(() => {
    let active = true;

    fetch(guideDocumentUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Không thể tải tài liệu (mã ${response.status}).`);
        }
        return response.text();
      })
      .then((content) => {
        if (active) {
          setMarkdown(content);
          setError('');
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Không thể tải tài liệu hướng dẫn.');
      });

    return () => {
      active = false;
    };
  }, [retry]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-50">
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-800">Hướng dẫn sử dụng</h1>
          <p className="text-xs text-slate-500">Hệ thống điều khiển điện phòng</p>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {error ? (
          <div role="alert" className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-white p-5 text-base text-red-700 shadow-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setRetry((attempt) => attempt + 1)}
              className="rounded-lg border border-red-200 px-3 py-1.5 font-semibold hover:bg-red-50"
            >
              Thử lại
            </button>
          </div>
        ) : markdown ? (
          <MarkdownContent markdown={markdown} />
        ) : (
          <div role="status" className="flex h-40 items-center justify-center gap-2 text-base text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            Đang tải tài liệu...
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidePage;
