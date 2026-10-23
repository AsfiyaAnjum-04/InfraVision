"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import MermaidDiagram from './components/MermaidDiagram';
import {
  Activity, ArrowRight, ArrowUpRight, BadgeCheck, Check, ChevronRight,
  Cloud, Code2, Database, FileImage, Layers3, LoaderCircle, LockKeyhole,
  Network, ScanLine, Server, ShieldCheck, Sparkles, Trash2, Upload, X, Zap,
} from 'lucide-react';

const spring = { type: 'spring', stiffness: 260, damping: 22 } as const;
const softSpring = { type: 'spring', stiffness: 180, damping: 24 } as const;
const rise = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

const sphereField = [
  { x: '4%', y: '18%', size: 13, duration: 24, delay: -5, tint: 'from-white via-cyan-200 to-blue-500' },
  { x: '17%', y: '43%', size: 9, duration: 31, delay: -17, tint: 'from-white via-violet-200 to-indigo-500' },
  { x: '31%', y: '8%', size: 17, duration: 27, delay: -12, tint: 'from-white via-blue-200 to-violet-500' },
  { x: '46%', y: '57%', size: 11, duration: 29, delay: -21, tint: 'from-white via-emerald-200 to-cyan-500' },
  { x: '61%', y: '21%', size: 10, duration: 23, delay: -8, tint: 'from-white via-fuchsia-200 to-violet-500' },
  { x: '76%', y: '52%', size: 16, duration: 33, delay: -25, tint: 'from-white via-sky-200 to-blue-500' },
  { x: '91%', y: '29%', size: 12, duration: 26, delay: -10, tint: 'from-white via-rose-200 to-orange-400' },
  { x: '9%', y: '75%', size: 18, duration: 32, delay: -19, tint: 'from-white via-indigo-200 to-violet-500' },
  { x: '27%', y: '88%', size: 10, duration: 25, delay: -3, tint: 'from-white via-cyan-200 to-teal-500' },
  { x: '53%', y: '91%', size: 14, duration: 30, delay: -14, tint: 'from-white via-amber-200 to-orange-400' },
  { x: '70%', y: '83%', size: 9, duration: 28, delay: -22, tint: 'from-white via-violet-200 to-fuchsia-500' },
  { x: '96%', y: '68%', size: 19, duration: 34, delay: -7, tint: 'from-white via-cyan-200 to-blue-500' },
];

function RollingSpheres({ reduced }: { reduced: boolean | null }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[1] hidden overflow-hidden [perspective:900px] md:block">
      {sphereField.map((sphere, index) => (
        <motion.span
          key={index}
          className={`absolute block rounded-full border border-white/10 bg-gradient-to-br ${sphere.tint} shadow-[inset_-3px_-4px_7px_rgba(43,66,130,.2),inset_3px_3px_5px_rgba(255,255,255,.95),0_8px_20px_rgba(83,105,185,.14)]`}
          style={{ left: sphere.x, top: sphere.y, width: sphere.size, height: sphere.size, transformStyle: 'preserve-3d' }}
          animate={reduced ? {} : {
            x: [0, 34 + (index % 3) * 10, -18, 0],
            y: [0, -25 - (index % 4) * 7, 20, 0],
            rotateX: [0, 160, 360],
            rotateY: [0, -180, -360],
            rotateZ: [0, 220, 360],
          }}
          transition={{ duration: sphere.duration, delay: sphere.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="absolute left-[18%] top-[14%] h-[32%] w-[32%] rounded-full bg-[#111827]/90 blur-[1px]" />
        </motion.span>
      ))}
    </div>
  );
}

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [yamlCode, setYamlCode] = useState('');
  const [mermaidCode, setMermaidCode] = useState('');
  const [auditReport, setAuditReport] = useState<string[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const pointerX = useMotionValue(-500);
  const pointerY = useMotionValue(-500);
  const auraX = useSpring(pointerX, { stiffness: 90, damping: 24, mass: .55 });
  const auraY = useSpring(pointerY, { stiffness: 90, damping: 24, mass: .55 });
  const { scrollYProgress } = useScroll();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const move = (event: PointerEvent) => { pointerX.set(event.clientX); pointerY.set(event.clientY); };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, [pointerX, pointerY]);

  const choose = useCallback((file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('Choose an image file to continue.'); return; }
    if (file.size > 10 * 1024 * 1024) { setMessage('Image must be 10 MB or smaller.'); return; }
    const reader = new FileReader();
    reader.onerror = () => setMessage('Could not read that image file.');
    reader.onload = () => {
      const raw = String(reader.result);
      const source = new Image();
      source.onload = () => {
        const limit = 1600, scale = Math.min(1, limit / Math.max(source.naturalWidth, source.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(source.naturalWidth * scale);
        canvas.height = Math.round(source.naturalHeight * scale);
        const context = canvas.getContext('2d');
        if (!context) setImage(raw);
        else {
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(source, 0, 0, canvas.width, canvas.height);
          setImage(canvas.toDataURL('image/jpeg', .88));
        }
        setFileName(file.name);
        setYamlCode('');
        setMermaidCode('');
        setAuditReport([]);
        setIsFallback(false);
        setMessage('');
        setDeployed(false);
      };
      source.onerror = () => { setImage(raw); setFileName(file.name); };
      source.src = raw;
    };
    reader.readAsDataURL(file);
  }, []);

  async function handleAnalyze() {
    if (!image) return;
    setIsAnalyzing(true);
    setMessage('');
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image }), signal: AbortSignal.timeout(160000) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setYamlCode(data.yaml);
      setMermaidCode(data.mermaid || '');
      setAuditReport(Array.isArray(data.audit) ? data.audit : [data.audit]);
      setIsFallback(Boolean(data.fallback));
      setMessage(data.notice || `Sketch analyzed with ${data.model || 'Gemini'}. Review the generated design before deployment.`);
    } catch (e) {
      const reason = e instanceof DOMException && e.name === 'TimeoutError' ? 'Browser request timed out after 160 seconds.' : e instanceof Error ? e.message : 'Unable to reach the analysis service.';
      const { fallbackYaml, fallbackMermaid, fallbackAudit } = await import('../lib/infravision-fallback');
      setYamlCode(fallbackYaml);
      setMermaidCode(fallbackMermaid);
      setAuditReport(fallbackAudit(reason));
      setIsFallback(true);
      setMessage('Gemini analysis did not finish. A clearly labeled starter preview is shown; deployment is disabled.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleDeploy() {
    setIsDeploying(true);
    setMessage('');
    try {
      const res = await fetch('/api/deploy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ yaml: yamlCode }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deployment failed');
      setDeployed(true);
      if (data.yaml) setYamlCode(data.yaml);
      setMessage(data.message || 'Stack deployment started.');
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 2200);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Deployment failed.');
    } finally {
      setIsDeploying(false);
    }
  }

  async function handleDestroy() {
    if (!window.confirm('Delete InfraVisionStack and its resources? This action may permanently remove data.')) return;
    setMessage('');
    try {
      const res = await fetch('/api/destroy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stackName: 'InfraVisionStack' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');
      setDeployed(false);
      setMessage(data.message || 'Stack deletion started.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to delete the stack.');
    }
  }

  const drop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    choose(event.dataTransfer.files?.[0]);
  };

  const enterWorkspace = () => document.getElementById('workspace')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#080b13] text-slate-100 selection:bg-violet-200 selection:text-violet-950">
      <motion.div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500" style={{ scaleX: scrollYProgress }} />
      <motion.div aria-hidden className="pointer-events-none fixed left-0 top-0 z-0 hidden h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(116,130,255,0.13),rgba(79,209,197,0.05)_38%,transparent_70%)] md:block" style={{ x: auraX, y: auraY }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_12%_5%,rgba(42,75,190,.35),transparent_35%),radial-gradient(ellipse_at_88%_13%,rgba(102,45,180,.24),transparent_28%),radial-gradient(ellipse_at_80%_75%,rgba(16,115,146,.16),transparent_32%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[.22] [background-image:linear-gradient(rgba(125,143,181,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(125,143,181,.1)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      <RollingSpheres reduced={reduceMotion} />
      <AnimatePresence>{celebrating && <motion.div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">{Array.from({ length: 34 }, (_, i) => <motion.i key={i} className="absolute top-[-14px] h-3 w-2 rounded-sm" style={{ left: `${(i * 37) % 100}%`, backgroundColor: ['#645cf0', '#19aeb1', '#ed8296', '#ffb454'][i % 4] }} initial={{ y: -20, opacity: 0, rotate: 0 }} animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 650 }} transition={{ duration: 1.8, delay: (i % 8) * .06, ease: [.18, .72, .3, 1] }} />)}</motion.div>}</AnimatePresence>

      <motion.header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: .08 } } }}>
        <motion.a href="#top" variants={rise} whileHover={{ y: -2, rotateX: 8 }} whileTap={{ scale: .96 }} transition={spring} className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-violet-600 to-fuchsia-500 text-white shadow-lg shadow-violet-300/40 transition-shadow group-hover:shadow-xl group-hover:shadow-violet-300/60"><Layers3 size={20}/></span>
          <span className="text-[17px] font-bold tracking-[-.06em] text-white">Infra<span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Vision</span><sup className="ml-0.5 align-top text-[8px] text-slate-400">®</sup></span>
        </motion.a>
        <nav className="hidden items-center gap-8 text-[13px] font-medium text-slate-400 md:flex">
          <motion.a href="#workspace" whileHover={{ y: -2, color: '#a5b4fc' }} whileTap={{ scale: .96 }} transition={spring}>Workspace</motion.a>
          <motion.a href="#how" whileHover={{ y: -2, color: '#a5b4fc' }} whileTap={{ scale: .96 }} transition={spring}>How it works</motion.a>
        </nav>
        <motion.button onClick={enterWorkspace} whileHover={{ y: -2, scale: 1.025 }} whileTap={{ scale: .97 }} transition={spring} className="flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/80 px-4 py-2.5 text-[11px] font-semibold text-slate-200 shadow-sm shadow-black/30 backdrop-blur-xl">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60"/><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400/100"/></span> Studio ready <ArrowUpRight size={13}/>
        </motion.button>
      </motion.header>

      <section id="top" className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-4 px-5 pb-10 pt-10 sm:px-8 sm:pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-20 lg:pt-12">
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: .12, delayChildren: .12 } } }} className="relative z-10">
          <motion.div variants={rise} className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-[#111827]/80 px-3.5 py-2 text-[9px] font-semibold uppercase tracking-[.18em] text-indigo-300 shadow-sm shadow-indigo-100/60 backdrop-blur-xl"><Sparkles size={13} className="text-fuchsia-500"/> AI-powered architecture studio</motion.div>
          <motion.h1 variants={rise} className="max-w-3xl text-[clamp(3.4rem,8.5vw,6.8rem)] font-semibold leading-[.95] tracking-[-.085em] text-white">Your sketch.<br/><span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">A cloud, built.</span></motion.h1>
          <motion.p variants={rise} className="mt-6 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">InfraVision turns a whiteboard idea into a reviewable AWS architecture, a security audit, and a deployable CloudFormation blueprint.</motion.p>
          <motion.div variants={rise} className="mt-8 flex flex-wrap items-center gap-3">
            <motion.button onClick={enterWorkspace} whileHover={{ y: -3, scale: 1.025 }} whileTap={{ scale: .97 }} transition={spring} className="group flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 px-5 py-3.5 text-xs font-bold text-white shadow-lg shadow-indigo-300/45 transition-shadow hover:shadow-xl hover:shadow-indigo-300/55"><ScanLine size={16}/> Start building <ArrowRight size={15} className="transition-transform group-hover:translate-x-1"/></motion.button>
            <span className="flex items-center gap-2 px-2 text-[10px] text-slate-400"><LockKeyhole size={12}/> Your sketch is not stored</span>
          </motion.div>
          <motion.div variants={rise} className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/10 pt-5 text-[10px] font-medium text-slate-400">
            <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-blue-400/10 text-blue-300"><Network size={13}/></span> Architecture map</span>
            <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-violet-400/10 text-violet-300"><ShieldCheck size={13}/></span> Well-Architected audit</span>
            <span className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-lg bg-orange-400/10 text-orange-300"><Cloud size={13}/></span> One-click deploy</span>
          </motion.div>
        </motion.div>

        <motion.div className="relative mx-auto w-full max-w-[550px] [perspective:1400px]" initial={{ opacity: 0, scale: .92, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...softSpring, delay: .2 }} whileHover={{ rotateY: -4, rotateX: 2, y: -5 }} style={{ transformStyle: 'preserve-3d' }}>
          <motion.div className="absolute -inset-7 rounded-[3rem] bg-gradient-to-br from-blue-600/20 via-violet-600/20 to-cyan-400/10 blur-3xl" animate={reduceMotion ? {} : { opacity: [.45, .8, .45], scale: [1, 1.07, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}/>
          <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#101522]/95 p-4 shadow-[0_35px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:p-5">
            <div className="flex items-center justify-between border-b border-white/[.08] pb-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg shadow-indigo-950/50"><Layers3 size={17}/></span><div><span className="block text-[10px] font-semibold text-white">Architecture studio</span><span className="mt-1 block font-mono text-[8px] uppercase tracking-[.18em] text-slate-500">INFRA / DESIGN SESSION</span></div></div><span className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-2.5 py-1.5 font-mono text-[8px] text-emerald-300"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"/>{deployed ? 'STACK ACCEPTED' : isAnalyzing ? 'ANALYZING' : 'READY'}</span></div>
            <div className="flex items-end justify-between py-5"><div><span className="font-mono text-[8px] uppercase tracking-[.2em] text-slate-500">YOUR CLOUD BLUEPRINT</span><h3 className="mt-1.5 text-xl font-semibold tracking-tight text-white sm:text-2xl">Everything, connected.</h3></div><span className="rounded-lg border border-white/10 bg-white/[.04] px-2.5 py-1.5 font-mono text-[8px] text-slate-400">AWS · us-east-1</span></div>
            <div className="relative rounded-2xl border border-white/[.08] bg-[#0b0f19] p-4 sm:p-5"><div className="pointer-events-none absolute inset-x-[15%] top-1/2 h-px bg-gradient-to-r from-orange-400/10 via-violet-400/70 to-cyan-300/10"/><div className="relative grid grid-cols-3 gap-2.5 sm:gap-3">
              <motion.div whileHover={{ y: -5, rotateY: 8 }} transition={spring} className="rounded-xl border border-orange-400/20 bg-gradient-to-b from-orange-400/[.1] to-white/[.02] p-3 text-center shadow-[0_12px_30px_rgba(0,0,0,.18)]"><span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-orange-400/15 text-orange-300"><Database size={17}/></span><b className="mt-2 block text-[9px] text-slate-100">S3</b><small className="mt-1 block font-mono text-[7px] text-slate-500">STORAGE</small></motion.div>
              <motion.div whileHover={{ y: -5 }} transition={spring} className="rounded-xl border border-violet-400/20 bg-gradient-to-b from-violet-400/[.1] to-white/[.02] p-3 text-center shadow-[0_12px_30px_rgba(0,0,0,.18)]"><span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-violet-400/15 text-violet-300"><Zap size={17}/></span><b className="mt-2 block text-[9px] text-slate-100">Lambda</b><small className="mt-1 block font-mono text-[7px] text-slate-500">COMPUTE</small></motion.div>
              <motion.div whileHover={{ y: -5, rotateY: -8 }} transition={spring} className="rounded-xl border border-cyan-400/20 bg-gradient-to-b from-cyan-400/[.1] to-white/[.02] p-3 text-center shadow-[0_12px_30px_rgba(0,0,0,.18)]"><span className="mx-auto grid h-9 w-9 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300"><Server size={17}/></span><b className="mt-2 block text-[9px] text-slate-100">DynamoDB</b><small className="mt-1 block font-mono text-[7px] text-slate-500">DATA</small></motion.div>
            </div><div className="mt-4 flex items-center justify-between rounded-xl border border-white/[.06] bg-white/[.025] px-3 py-2.5"><span className="flex items-center gap-2 text-[8px] text-slate-400"><ShieldCheck size={13} className="text-emerald-400"/> Well-Architected review</span><span className="flex items-center gap-1.5 font-mono text-[7px] text-emerald-300"><span className="h-1 w-1 rounded-full bg-emerald-400"/>{auditReport.length ? 'REPORT READY' : 'SECURITY · COST · RELIABILITY'}</span></div></div>
            <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3"><div><div className="mb-2 flex justify-between font-mono text-[7px] uppercase tracking-[.16em] text-slate-500"><span>Design pipeline</span><span>{deployed ? '03 / 03' : yamlCode ? '02 / 03' : image ? '01 / 03' : 'READY'}</span></div><div className="h-1 overflow-hidden rounded-full bg-white/[.08]"><motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400" animate={{ width: deployed ? '100%' : yamlCode ? '68%' : image ? '34%' : '12%' }} transition={{ duration: .8, ease: 'easeOut' }}/></div></div><span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-slate-300"><Network size={15}/></span></div>
          </div>
          <motion.div className="absolute -right-2 -top-5 flex items-center gap-2 rounded-xl border border-white/10 bg-[#171c2c]/95 px-3 py-2 shadow-xl shadow-black/30 backdrop-blur-xl sm:-right-5" animate={reduceMotion ? {} : { y: [0, -5, 0] }} transition={{ duration: 4.4, repeat: Infinity, ease: 'easeInOut' }}><span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><BadgeCheck size={14}/></span><span className="font-mono text-[8px] text-slate-300">SECURE BY DESIGN</span></motion.div>
        </motion.div>
      </section>

      <section id="workspace" className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-10 px-5 pb-20 pt-3 sm:px-8 lg:px-10">
        <motion.div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end" initial="hidden" whileInView="show" viewport={{ once: true, amount: .3 }} variants={{ show: { transition: { staggerChildren: .1 } } }}>
          <div><motion.div variants={rise} className="mb-2 text-[9px] font-bold uppercase tracking-[.22em] text-indigo-300">The InfraVision workspace</motion.div><motion.h2 variants={rise} className="text-3xl font-semibold tracking-[-.06em] text-white sm:text-4xl">Make your idea <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">deployable.</span></motion.h2></div>
          <motion.div variants={rise} className="flex items-center gap-2 text-[10px] text-slate-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400/100"/> Private workspace <span className="text-slate-300">·</span> AWS region from server config</motion.div>
        </motion.div>

        <nav aria-label="Workspace steps" className="mb-5 flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl border border-white/10 bg-[#111827]/70 p-1.5 shadow-[0_10px_30px_rgba(42,58,103,.06)] backdrop-blur-xl">
          {[
            { href: '#upload-panel', label: 'Sketch', icon: Upload },
            { href: '#audit-panel', label: 'Review', icon: ShieldCheck },
            { href: '#deploy-panel', label: 'Deploy', icon: Cloud },
          ].map((tab, index) => {
            const Icon = tab.icon;
            return <motion.a key={tab.href} href={tab.href} whileHover={{ y: -2, rotateX: 5 }} whileTap={{ scale: .96 }} transition={spring} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[10px] font-semibold transition-colors ${index === 0 ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-indigo-950/50' : 'text-slate-400 hover:bg-white/[.06] hover:text-indigo-300'}`}><Icon size={13}/><span>0{index + 1} · {tab.label}</span></motion.a>;
          })}
        </nav>

        <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <motion.section id="upload-panel" className="group relative rounded-[1.75rem] border border-white/10 bg-[#111827]/75 p-4 shadow-[0_24px_80px_rgba(42,58,103,.1)] backdrop-blur-2xl sm:p-6" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...softSpring, delay: .05 }} whileHover={{ y: -4, rotateX: .5 }} style={{ transformStyle: 'preserve-3d' }}>
            <div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-400/10 to-violet-400/10 text-indigo-300"><FileImage size={18}/></span><div><div className="text-sm font-semibold text-white">Architecture sketch</div><div className="mt-1 text-[10px] text-slate-400">Your whiteboard is the starting point</div></div></div><span className="rounded-full border border-white/10 bg-[#111827]/80 px-2.5 py-1 font-mono text-[8px] tracking-widest text-slate-400">01 / INPUT</span></div>
            <motion.div role="button" tabIndex={0} aria-label="Upload an architecture sketch" onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); inputRef.current?.click(); } }} onDragEnter={event => { event.preventDefault(); setIsDragging(true); }} onDragOver={event => event.preventDefault()} onDragLeave={() => setIsDragging(false)} onDrop={event => { event.preventDefault(); setIsDragging(false); choose(event.dataTransfer.files?.[0]); }} onClick={() => inputRef.current?.click()} whileHover={{ scale: 1.02, rotateX: 3, rotateY: -3 }} whileTap={{ scale: .99 }} transition={spring} style={{ transformStyle: 'preserve-3d', perspective: 1000 }} className={`relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.35rem] border border-dashed bg-gradient-to-br from-[#0b1020] via-[#15192e] to-[#17132b] text-center transition-colors duration-300 sm:min-h-[360px] ${isDragging ? 'border-indigo-400 shadow-[inset_0_0_0_2px_rgba(99,102,241,.14)]' : 'border-slate-300/80 hover:border-indigo-300'}`}>
              {image ? <>
                <div className={`absolute inset-0 grid place-items-center ${isAnalyzing ? 'scan-frame' : ''}`}><img src={image} alt="Uploaded architecture sketch" className="h-full w-full object-contain p-4"/></div>
                <div className="absolute bottom-3 left-3 z-[4] flex max-w-[75%] items-center gap-2 rounded-xl border border-white/10 bg-[#111827]/85 px-3 py-2 text-[10px] font-medium text-slate-200 shadow-lg backdrop-blur-xl"><FileImage size={14} className="shrink-0 text-indigo-300"/><span className="truncate">{fileName}</span></div>
                <motion.button type="button" aria-label="Remove image" onClick={event => { event.stopPropagation(); setImage(null); setFileName(''); }} whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: .9 }} className="absolute right-3 top-3 z-[5] grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-[#111827]/90 text-slate-300 shadow-lg backdrop-blur-xl"><X size={16}/></motion.button>
                {isAnalyzing && <div className="absolute inset-x-0 bottom-4 z-[5] mx-auto w-max rounded-full border border-white/10 bg-slate-950/75 px-4 py-2 font-mono text-[9px] uppercase tracking-[.2em] text-white shadow-xl backdrop-blur-xl"><span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300"/>Scanning architecture</div>}
              </> : <motion.div className="relative z-[2] flex flex-col items-center px-5" animate={reduceMotion ? {} : { y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <motion.span whileHover={{ rotateY: 18, y: -5, scale: 1.05 }} transition={spring} className="mb-5 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-300/50"><Upload size={27}/></motion.span>
                <strong className="text-base font-semibold tracking-tight text-slate-100">Drop your sketch into the cloud</strong><span className="mt-2 text-xs text-slate-400">or <span className="font-semibold text-indigo-300">browse files</span> from your device</span>
                <span className="mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/80 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[.16em] text-slate-400 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"/> PNG · JPG · up to 10 MB</span>
              </motion.div>}
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={event => choose(event.target.files?.[0])}/>
            </motion.div>
            <motion.button onClick={handleAnalyze} disabled={!image || isAnalyzing} whileHover={{ y: -2, scale: 1.012 }} whileTap={{ scale: .975 }} transition={spring} className="mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 text-xs font-bold text-white shadow-lg shadow-indigo-300/40 transition-shadow hover:shadow-xl hover:shadow-indigo-300/50 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none">
              {isAnalyzing ? <><LoaderCircle size={16} className="animate-spin"/> Reading your architecture…</> : <><ScanLine size={16}/> Analyze sketch <ArrowUpRight size={15}/></>}
            </motion.button>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-slate-400"><LockKeyhole size={11} className="text-emerald-300"/> Image is processed securely and not stored</div>
          </motion.section>

          <div className="flex flex-col gap-4">
            <motion.section id="audit-panel" layout className="rounded-[1.5rem] border border-white/10 bg-[#111827]/80 p-4 shadow-[0_18px_60px_rgba(42,58,103,.08)] backdrop-blur-2xl sm:p-5" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...softSpring, delay: .1 }} whileHover={{ y: -3, rotateX: .5 }} style={{ transformStyle: 'preserve-3d' }}>
              <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><ShieldCheck size={17}/></span><div><div className="text-xs font-semibold text-white">Well-Architected audit</div><div className="mt-1 text-[9px] text-slate-400">Security · reliability · cost</div></div></div><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 font-mono text-[8px] tracking-widest text-emerald-300">02 / REVIEW</span></div>
              <div className="min-h-[118px] rounded-xl border border-white/10 bg-gradient-to-br from-[#111827] to-[#151a2d] p-3.5">
                <AnimatePresence mode="wait" initial={false}>
                  {auditReport.length > 0 ? <motion.ul key="audit" layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={softSpring} className="space-y-2.5">
                    {auditReport.map((item, index) => <motion.li key={`${index}-${item}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: index * .08 }} className="flex gap-2.5 text-[10px] leading-5 text-slate-300"><span className="mt-0.5 grid h-[17px] w-[17px] shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300"><Check size={11}/></span><span>{item.replace(/^[-•\s]+/, '')}</span></motion.li>)}
                  </motion.ul> : <motion.div key="audit-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex min-h-[88px] items-center justify-center gap-2 text-[10px] text-slate-400"><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-indigo-500 shadow-sm"><Activity size={14}/></span>{isAnalyzing ? 'Reviewing your architecture…' : 'Your audit will appear here'}</motion.div>}
                </AnimatePresence>
              </div>
            </motion.section>

            <AnimatePresence initial={false}>
              {mermaidCode && <motion.section key="diagram" layout initial={{ opacity: 0, height: 0, y: 14 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -8 }} transition={softSpring} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111827]/80 shadow-[0_18px_60px_rgba(42,58,103,.08)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5"><div className="flex items-center gap-2 text-xs font-semibold text-slate-100"><Network size={15} className="text-violet-300"/> Architecture flow</div><span className="font-mono text-[8px] tracking-widest text-slate-400">03 / MAP</span></div><MermaidDiagram source={mermaidCode}/>
              </motion.section>}
            </AnimatePresence>

            <motion.section id="deploy-panel" layout className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#111827]/80 shadow-[0_18px_60px_rgba(42,58,103,.09)] backdrop-blur-2xl" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...softSpring, delay: .16 }} whileHover={{ y: -3, rotateX: .35 }} style={{ transformStyle: 'preserve-3d' }}>
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><Code2 size={17}/></span><div><div className="text-xs font-semibold text-white">CloudFormation blueprint</div><div className="mt-1 text-[9px] text-slate-400">Ready to inspect and deploy</div></div></div><span className="flex items-center gap-1.5 rounded-md border border-white/10 bg-slate-950/70 px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-slate-400">YAML <i className="h-1.5 w-1.5 rounded-full bg-emerald-400/100"/></span></div>
              <div className="relative min-h-[150px] overflow-hidden bg-gradient-to-br from-[#0b1020] to-[#10152a]">
                <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(129,140,248,.07)_1px,transparent_1px)] [background-size:100%_24px]"/>
                <AnimatePresence mode="wait" initial={false}>
                  {yamlCode ? <motion.pre key="yaml" layout initial={{ opacity: 0, height: 0, y: 12 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0 }} transition={softSpring} className="relative z-[1] max-h-[245px] min-h-[150px] overflow-auto p-4 font-mono text-[10px] leading-[1.8] text-slate-200 sm:p-5"><code>{yamlCode}</code></motion.pre> : <motion.div key="yaml-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-[1] flex min-h-[150px] flex-col items-center justify-center gap-2 p-6 text-center"><span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-indigo-500 shadow-sm"><Code2 size={16}/></span><span className="text-[10px] text-slate-400">Your generated YAML will land here</span><span className="font-mono text-[8px] text-slate-400">UPLOAD A SKETCH TO BEGIN</span></motion.div>}
                </AnimatePresence>
              </div>
              <div className="flex flex-col gap-2 border-t border-white/10 bg-[#111827]/80 p-3 sm:flex-row">
                <motion.button onClick={handleDeploy} disabled={!yamlCode || isFallback || isDeploying || deployed} animate={isDeploying ? { boxShadow: ['0 0 0 0 rgba(249,115,22,.15)', '0 0 0 8px rgba(249,115,22,0)', '0 0 0 0 rgba(249,115,22,.15)'] } : {}} transition={isDeploying ? { duration: 1.6, repeat: Infinity } : spring} whileHover={{ y: -2, scale: 1.012 }} whileTap={{ scale: .97 }} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 text-[11px] font-bold text-white shadow-lg shadow-orange-300/35 transition-shadow hover:shadow-xl hover:shadow-orange-300/50 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none">
                  {isDeploying ? <><LoaderCircle size={15} className="animate-spin"/> Deploying to AWS…</> : <><Cloud size={16}/>{isFallback ? 'Preview only · deployment disabled' : deployed ? 'Deployment started' : 'Deploy to AWS'}<ArrowUpRight size={14}/></>}
                </motion.button>
                {deployed && <motion.button onClick={handleDestroy} initial={{ opacity: 0, scale: .85, x: 8 }} animate={{ opacity: 1, scale: 1, x: 0 }} whileHover={{ y: -2, scale: 1.015 }} whileTap={{ scale: .96 }} transition={spring} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-gradient-to-b from-red-500 to-rose-600 px-4 text-[10px] font-bold text-white shadow-lg shadow-rose-300/35"><Trash2 size={14}/> Kill Switch</motion.button>}
              </div>
            </motion.section>
            <AnimatePresence mode="wait">{message && <motion.div key={message} role="status" initial={{ opacity: 0, y: 8, scale: .99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={softSpring} className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-[10px] leading-5 shadow-sm backdrop-blur-xl ${isFallback ? 'border-amber-400/25 bg-amber-400/10 text-amber-200' : 'border-indigo-400/20 bg-[#111827]/80 text-slate-300'}`}><Sparkles size={14} className="mt-0.5 shrink-0 text-indigo-300"/><span>{message}</span></motion.div>}</AnimatePresence>
          </div>
        </div>
      </section>

      <motion.section id="how" className="relative z-10 mx-auto mb-10 w-full max-w-7xl px-5 sm:px-8 lg:px-10" initial="hidden" whileInView="show" viewport={{ once: true, amount: .2 }} variants={{ show: { transition: { staggerChildren: .1 } } }}>
        <motion.div variants={rise} className="mb-5 flex items-end justify-between"><div><span className="text-[9px] font-bold uppercase tracking-[.2em] text-indigo-300">A simple path to launch</span><h2 className="mt-2 text-2xl font-semibold tracking-[-.05em] text-white">Sketch it. See it. <span className="text-violet-300">Ship it.</span></h2></div><BadgeCheck size={22} className="mb-1 text-emerald-500"/></motion.div>
        <div className="grid gap-3 md:grid-cols-3">
          {[{ n: '01', t: 'Bring the idea', d: 'Start with a sketch, anywhere inspiration strikes.', icon: Upload, color: 'from-blue-500 to-cyan-500' }, { n: '02', t: 'Review the design', d: 'Inspect the architecture map, audit, and YAML.', icon: ShieldCheck, color: 'from-violet-500 to-fuchsia-500' }, { n: '03', t: 'Deploy with confidence', d: 'Send the reviewed template to AWS CloudFormation.', icon: Cloud, color: 'from-orange-400 to-amber-500' }].map((step, index) => {
            const Icon = step.icon;
            return <motion.div key={step.n} variants={rise} whileHover={{ y: -5, rotateX: 1.5, rotateY: index === 1 ? 0 : index === 0 ? -1 : 1 }} whileTap={{ scale: .99 }} transition={spring} style={{ transformStyle: 'preserve-3d' }} className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-[#111827]/75 p-4 shadow-[0_12px_40px_rgba(42,58,103,.06)] backdrop-blur-2xl"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${step.color} text-white shadow-md`}><Icon size={17}/></span><div className="flex-1"><span className="font-mono text-[8px] tracking-[.18em] text-slate-400">{step.n} / STEP</span><h3 className="mt-1 text-xs font-semibold text-slate-100">{step.t}</h3><p className="mt-1 text-[10px] leading-5 text-slate-400">{step.d}</p></div><ChevronRight size={15} className="mt-1 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-indigo-500"/></motion.div>;
          })}
        </div>
      </motion.section>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/10 px-5 py-6 text-[9px] text-slate-400 sm:flex-row sm:px-8 lg:px-10"><a href="#top" className="flex items-center gap-2 font-semibold tracking-tight text-slate-200"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white"><Layers3 size={14}/></span>InfraVision</a><span>See it, build it, ship it.</span><span className="flex items-center gap-2 font-mono uppercase tracking-wider"><Server size={12}/> AWS CloudFormation <span className="text-slate-300">·</span> Gemini</span></footer>
    </main>
  );
}
