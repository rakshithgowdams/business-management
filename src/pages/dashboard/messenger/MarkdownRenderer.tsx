import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  content: string;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-white/[0.06]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-dark-600/80 border-b border-white/[0.06]">
        <span className="text-[10px] text-gray-500 font-mono uppercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-3 py-2.5 bg-dark-800/60 overflow-x-auto">
        <code className="text-[12px] text-gray-300 font-mono leading-relaxed whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function InlineCode({ children }: { children: string }) {
  return (
    <code className="px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.06] rounded-md text-[12px] text-cyan-300 font-mono">
      {children}
    </code>
  );
}

export default function MarkdownRenderer({ content }: Props) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let listBuffer: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    if (listBuffer.type === 'ul') {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-1.5 ml-4 space-y-1">
          {listBuffer.items.map((item, idx) => (
            <li key={idx} className="text-[13px] text-gray-200 leading-relaxed flex gap-2">
              <span className="text-brand-400 shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400/60 inline-block" />
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`list-${elements.length}`} className="my-1.5 ml-4 space-y-1">
          {listBuffer.items.map((item, idx) => (
            <li key={idx} className="text-[13px] text-gray-200 leading-relaxed flex gap-2">
              <span className="text-brand-400 shrink-0 font-semibold text-[12px] min-w-[18px]">{idx + 1}.</span>
              <span className="flex-1">{item}</span>
            </li>
          ))}
        </ol>
      );
    }
    listBuffer = null;
  };

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let partIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      const inlineCodeMatch = remaining.match(/`([^`]+)`/);

      let nextMatch: { index: number; length: number; node: React.ReactNode } | null = null;

      if (boldMatch && boldMatch.index !== undefined) {
        const candidate = { index: boldMatch.index, length: boldMatch[0].length, node: <strong key={`b-${partIdx}`} className="font-semibold text-white">{boldMatch[1]}</strong> };
        if (!nextMatch || candidate.index < nextMatch.index) nextMatch = candidate;
      }
      if (inlineCodeMatch && inlineCodeMatch.index !== undefined) {
        const candidate = { index: inlineCodeMatch.index, length: inlineCodeMatch[0].length, node: <InlineCode key={`c-${partIdx}`}>{inlineCodeMatch[1]}</InlineCode> };
        if (!nextMatch || candidate.index < nextMatch.index) nextMatch = candidate;
      }

      if (!nextMatch) {
        parts.push(remaining);
        break;
      }

      if (nextMatch.index > 0) {
        parts.push(remaining.slice(0, nextMatch.index));
      }
      parts.push(nextMatch.node);
      remaining = remaining.slice(nextMatch.index + nextMatch.length);
      partIdx++;
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  while (i < lines.length) {
    const line = lines[i];

    const codeBlockMatch = line.match(/^```(\w*)/);
    if (codeBlockMatch) {
      flushList();
      const lang = codeBlockMatch[1] || '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(<CodeBlock key={`code-${elements.length}`} code={codeLines.join('\n')} language={lang} />);
      continue;
    }

    if (line.match(/^#{1,3}\s/)) {
      flushList();
      const level = line.match(/^(#{1,3})\s/)![1].length;
      const text = line.replace(/^#{1,3}\s/, '');
      const className = level === 1
        ? 'text-[15px] font-bold text-white mt-3 mb-1.5'
        : level === 2
          ? 'text-[14px] font-semibold text-white mt-2.5 mb-1'
          : 'text-[13px] font-semibold text-gray-200 mt-2 mb-1';
      elements.push(<p key={`h-${elements.length}`} className={className}>{renderInline(text)}</p>);
      i++;
      continue;
    }

    if (line.match(/^[-*]\s/)) {
      const text = line.replace(/^[-*]\s/, '');
      if (!listBuffer || listBuffer.type !== 'ul') {
        flushList();
        listBuffer = { type: 'ul', items: [] };
      }
      listBuffer.items.push(renderInline(text));
      i++;
      continue;
    }

    if (line.match(/^\d+\.\s/)) {
      const text = line.replace(/^\d+\.\s/, '');
      if (!listBuffer || listBuffer.type !== 'ol') {
        flushList();
        listBuffer = { type: 'ol', items: [] };
      }
      listBuffer.items.push(renderInline(text));
      i++;
      continue;
    }

    if (line.match(/^>\s/)) {
      flushList();
      const text = line.replace(/^>\s?/, '');
      elements.push(
        <div key={`bq-${elements.length}`} className="my-1.5 pl-3 border-l-2 border-brand-500/40">
          <p className="text-[13px] text-gray-300 italic leading-relaxed">{renderInline(text)}</p>
        </div>
      );
      i++;
      continue;
    }

    if (line.match(/^---$|^\*\*\*$/)) {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-white/[0.06]" />);
      i++;
      continue;
    }

    if (line.trim() === '') {
      flushList();
      i++;
      continue;
    }

    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="text-[13px] text-gray-200 leading-relaxed my-0.5">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}
