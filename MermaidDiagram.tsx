"use client";
import { useId } from 'react';

type NodeItem = { id: string; label: string };
type Edge = { from: string; to: string };
function parseDiagram(source: string) {
  const nodes = new Map<string, NodeItem>();
  const edges: Edge[] = [];
  const readNode = (segment: string, preferLast = false) => {
    const clean = segment.replace(/^\s*\|[^|]*\|\s*/, '').trim();
    const matches = Array.from(clean.matchAll(/([A-Za-z][\w-]*)(?:\[([^\]]*)\]|\(\(([^)]*)\)\)|\(([^)]*)\)|\{([^}]*)\})?/g));
    const match = preferLast ? matches[matches.length - 1] : matches[0];
    if (!match || /^(flowchart|graph|subgraph|end|classDef|class|style|click)$/i.test(match[1])) return null;
    const label = (match[2] || match[3] || match[4] || match[5] || match[1]).replace(/<br\s*\/?\s*>/gi, ' ');
    nodes.set(match[1], { id: match[1], label });
    return match[1];
  };
  for (const line of source.split(/\r?\n/)) {
    const text = line.trim();
    if (!text || /^(flowchart|graph|subgraph|end|classDef|class|style|%%)/i.test(text)) continue;
    const parts = text.split(/(?:-->|==>|-\.->|---|--o|--x|<--|<==)/);
    if (parts.length > 1) {
      let previous = readNode(parts[0]);
      for (const part of parts.slice(1)) {
        const current = readNode(part);
        if (previous && current) edges.push({ from: previous, to: current });
        previous = current;
      }
    } else readNode(text);
  }
  return { nodes: Array.from(nodes.values()), edges };
}

export default function MermaidDiagram({ source }: { source: string }) {
  const { nodes, edges } = parseDiagram(source);
  const markerId = `arrow-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const cardW = 164, cardH = 64, gap = 58, pad = 24;
  const width = Math.max(500, pad * 2 + nodes.length * cardW + Math.max(0, nodes.length - 1) * gap);
  const height = 128;
  const positions = new Map(nodes.map((node, i) => [node.id, { x: pad + i * (cardW + gap), y: 32 }]));
  return <div className="overflow-x-auto p-4">
    {nodes.length > 0 ? <svg role="img" aria-label="Architecture flow diagram" viewBox={`0 0 ${width} ${height}`} className="mx-auto h-auto min-w-[500px] max-w-full" style={{ width }}>
      <defs><marker id={markerId} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#8b83ff" /></marker></defs>
      {edges.map((edge, i) => { const a = positions.get(edge.from), b = positions.get(edge.to); if (!a || !b) return null; const forward = b.x >= a.x; const x1 = a.x + (forward ? cardW : 0), x2 = b.x + (forward ? 0 : cardW); return <line key={`${edge.from}-${edge.to}-${i}`} x1={x1} y1={a.y + cardH / 2} x2={x2} y2={b.y + cardH / 2} stroke={i % 2 ? '#22d3ee' : '#8b83ff'} strokeOpacity=".82" strokeWidth="2" markerEnd={`url(#${markerId})`} />; })}
      {nodes.map((node, i) => { const pos = positions.get(node.id)!; const accent = ['#8b83ff', '#22d3ee', '#fb7185'][i % 3]; return <g key={node.id}><rect x={pos.x} y={pos.y} width={cardW} height={cardH} rx="12" fill="#111827" stroke={accent} strokeOpacity=".58"/><text x={pos.x + 14} y={pos.y + 23} fill="#94a3b8" fontSize="10" fontFamily="monospace">{String(i + 1).padStart(2, '0')} / {node.id}</text><text x={pos.x + 14} y={pos.y + 45} fill="#f1f5f9" fontSize="13" fontFamily="sans-serif">{node.label.slice(0, 19)}</text></g>; })}
    </svg> : <p className="p-3 text-xs text-muted">Diagram source is shown below.</p>}
    <details className="mx-auto mt-3 max-w-3xl rounded-lg border border-white/[.06] bg-black/20">
      <summary className="cursor-pointer px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted">View Mermaid source</summary>
      <pre className="overflow-auto px-3 pb-3 font-mono text-[11px] leading-5 text-slate-300"><code>{source}</code></pre>
    </details>
  </div>;
}

