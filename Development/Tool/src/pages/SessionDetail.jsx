import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  buildAreas, buildGrants, buildResources, buildProviders, buildGaps,
  overallScore, formatDate, formatDmlLevel
} from '../lib/knowledgeGraph';
import '../styles/knowledge-graph.css';

// ── CANVAS UTILITIES ──────────────────────────────────────────────────────

function hexToRgba(hex, a) {
  hex = (hex || '#000000').replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function tok(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function matchColor(pct) {
  if (pct > 80) return tok('--kg-green') || '#4ade80';
  if (pct >= 60) return tok('--kg-amber') || '#fbbf24';
  return tok('--kg-rose') || '#fb7185';
}

function circularMean(angles) {
  const sinS = angles.reduce((s, a) => s + Math.sin(a), 0) / angles.length;
  const cosS = angles.reduce((s, a) => s + Math.cos(a), 0) / angles.length;
  return Math.atan2(sinS, cosS);
}

function radialLabel(nd, CX, CY, offsetDist) {
  const dx = nd.x - CX, dy = nd.y - CY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const lx = nd.x + ux * offsetDist;
  const ly = nd.y + uy * offsetDist;
  return {
    lx, ly,
    align: ux > 0.4 ? 'left' : ux < -0.4 ? 'right' : 'center',
    base: uy > 0.55 ? 'top' : uy < -0.55 ? 'bottom' : 'middle'
  };
}

// ── CANVAS GRAPH BUILDER ──────────────────────────────────────────────────

function buildGraphNodes(canvas, AREAS, GRANTS, RESOURCES, PROVS) {
  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);
  const CX = W * 0.5;
  const CY = H * 0.5;
  const sz = Math.min(W, H);
  const AR = sz * 0.115;
  const GR = sz * 0.250;
  const PR = sz * 0.375;

  const nodes = [];
  const edges = [];

  // Business center
  nodes.push({ id: 'biz', type: 'biz', x: CX, y: CY, r: 28, angle: 0 });

  // Area nodes
  AREAS.forEach(a => {
    nodes.push({
      id: a.id, type: 'area',
      x: CX + AR * Math.cos(a.angle),
      y: CY + AR * Math.sin(a.angle),
      r: 16, angle: a.angle, ad: a
    });
    edges.push({ a: 'biz', b: a.id, kind: 'ba', color: a.color });
  });

  // Grant nodes
  GRANTS.forEach(g => {
    nodes.push({
      id: g.id, type: 'grant',
      x: CX + GR * Math.cos(g.angle),
      y: CY + GR * Math.sin(g.angle),
      r: 22, angle: g.angle, gd: g
    });
    const aColor = AREAS.find(a => a.id === g.area)?.color || '#4ade80';
    edges.push({ a: g.area, b: g.id, kind: 'ag', color: aColor });
  });

  // Resource nodes
  RESOURCES.forEach(r => {
    nodes.push({
      id: r.id, type: 'resource',
      x: CX + GR * Math.cos(r.angle),
      y: CY + GR * Math.sin(r.angle),
      r: 15, angle: r.angle, rd: r
    });
    const aColor = AREAS.find(a => a.id === r._areaId)?.color || '#fbbf24';
    edges.push({ a: r._areaId || 'a2', b: r.id, kind: 'ar', color: aColor });
  });

  // Provider nodes
  PROVS.forEach(p => {
    const allItems = [...GRANTS, ...RESOURCES];
    const gAngles = p.grants
      .map(gid => allItems.find(x => x.id === gid)?.angle || 0);
    const angle = gAngles.length > 0 ? circularMean(gAngles) : 0;
    nodes.push({
      id: p.id, type: 'prov',
      x: CX + PR * Math.cos(angle),
      y: CY + PR * Math.sin(angle),
      r: 14, angle, pd: p
    });
    p.grants.forEach(gid => edges.push({ a: gid, b: p.id, kind: 'gp' }));
  });

  return { nodes, edges, CX, CY };
}

// ── CANVAS DRAW FUNCTION ──────────────────────────────────────────────────

function drawScene(canvas, ctx, ts, nodes, edges, CX, CY, hovN, selId, bizLabel) {
  const W = canvas.width / (window.devicePixelRatio || 1);
  const H = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, W * (window.devicePixelRatio || 1), H * (window.devicePixelRatio || 1));
  ctx.save();
  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

  // Background
  const bgC = tok('--kg-bg') || '#0c1410';
  ctx.fillStyle = bgC;
  ctx.fillRect(0, 0, W, H);

  // Dot grid
  ctx.fillStyle = hexToRgba(tok('--kg-border') || '#2c3e33', 0.4);
  for (let x = 36; x < W; x += 36)
    for (let y = 36; y < H; y += 36) {
      ctx.beginPath(); ctx.arc(x, y, 0.75, 0, Math.PI * 2); ctx.fill();
    }

  // Radial vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.08, W / 2, H / 2, H * 0.68);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, hexToRgba(bgC, 0.6));
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // ── Edges
  for (const e of edges) {
    const A = nodes.find(nd => nd.id === e.a);
    const B = nodes.find(nd => nd.id === e.b);
    if (!A || !B) continue;
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
    if (d < 1) continue;
    const arA = A.r + 4, arB = B.r + 4;
    const sx = A.x + (dx / d) * arA, sy = A.y + (dy / d) * arA;
    const ex = B.x - (dx / d) * arB, ey = B.y - (dy / d) * arB;
    const isSel = selId && (e.a === selId || e.b === selId);
    let defA, selA;
    if (e.kind === 'ba')                   { defA = 0.55; selA = 0.9; }
    else if (e.kind === 'ag' || e.kind === 'ar') { defA = 0.40; selA = 0.85; }
    else                                   { defA = 0.30; selA = 0.75; }
    const alpha = selId ? (isSel ? selA : 0.05) : defA;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
    if (e.kind === 'ba') {
      ctx.strokeStyle = e.color; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    } else if (e.kind === 'ag' || e.kind === 'ar') {
      ctx.strokeStyle = e.color; ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]); ctx.lineDashOffset = -(ts * 0.008) % 8;
    } else {
      ctx.strokeStyle = tok('--kg-violet') || '#c084fc';
      ctx.lineWidth = 1; ctx.setLineDash([3, 5]);
      ctx.lineDashOffset = -(ts * 0.016) % 8;
    }
    ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  // ── Nodes
  for (const nd of nodes) {
    const hov = hovN === nd.id, sel = selId === nd.id;
    const pulse = sel ? 1 + Math.sin(ts * 0.0038) * 0.028 : 1;
    const r = nd.r * pulse;
    ctx.save();

    if (nd.type === 'biz') {
      const gc = tok('--kg-green') || '#4ade80';
      if (hov || sel) { ctx.shadowBlur = 14; ctx.shadowColor = gc; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(gc, 0.08); ctx.fill();
      ctx.strokeStyle = hexToRgba(gc, sel || hov ? 0.9 : 0.5);
      ctx.lineWidth = 1.5; ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = gc;
      ctx.font = 'bold 9px "Libre Franklin", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // Iniciales del negocio (ej: "GOW" para Greenfields Organics WA)
      ctx.fillText(bizLabel.abbr, nd.x, nd.y - 4);
      ctx.fillStyle = tok('--kg-text2') || '#8aaa90';
      ctx.font = '8px "DM Sans", sans-serif';
      ctx.fillText(bizLabel.short, nd.x, nd.y + 6);

    } else if (nd.type === 'area') {
      const a = nd.ad;
      if (hov) { ctx.shadowBlur = 12; ctx.shadowColor = a.color; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(a.color, 0.12); ctx.fill();
      ctx.strokeStyle = hexToRgba(a.color, hov ? 0.9 : 0.6);
      ctx.lineWidth = 2; ctx.stroke();
      // Score arc
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r + 5, -Math.PI / 2, -Math.PI / 2 + (a.score / 100) * Math.PI * 2);
      ctx.strokeStyle = a.color; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = a.color;
      ctx.font = 'bold 9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(a.score + '%', nd.x, nd.y);
      // Label
      const { lx, ly, align, base } = radialLabel(nd, CX, CY, r + 14);
      ctx.fillStyle = a.color;
      ctx.font = 'bold 10px "Libre Franklin", sans-serif';
      ctx.textAlign = align; ctx.textBaseline = base;
      ctx.fillText(a.name, lx, ly);

    } else if (nd.type === 'grant') {
      const g = nd.gd;
      const c = matchColor(g.match);
      if (hov || sel) { ctx.shadowBlur = 12; ctx.shadowColor = c; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(c, 0.1); ctx.fill();
      ctx.strokeStyle = c; ctx.lineWidth = hov || sel ? 2.5 : 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(nd.x, nd.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = c; ctx.fill();
      ctx.fillStyle = c;
      ctx.font = 'bold 8px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(g.match + '%', nd.x, nd.y);
      const { lx, ly, align, base } = radialLabel(nd, CX, CY, r + 9);
      ctx.fillStyle = hov || sel ? tok('--kg-text') || '#d0e4d5' : tok('--kg-text2') || '#8aaa90';
      ctx.font = (hov || sel ? '500 ' : '') + '9px "DM Sans", sans-serif';
      ctx.textAlign = align; ctx.textBaseline = base;
      const words = g.short.split(' ');
      if (words.length <= 2) { ctx.fillText(g.short, lx, ly); }
      else {
        const mid = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, mid).join(' '), lx, ly - 5);
        ctx.fillText(words.slice(mid).join(' '), lx, ly + 5);
      }

    } else if (nd.type === 'resource') {
      const res = nd.rd;
      if (hov || sel) { ctx.shadowBlur = 10; ctx.shadowColor = tok('--kg-amber') || '#fbbf24'; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(tok('--kg-amber') || '#fbbf24', 0.08); ctx.fill();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = tok('--kg-amber') || '#fbbf24';
      ctx.lineWidth = 1.8; ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(nd.x, nd.y); ctx.rotate(Math.PI / 4);
      ctx.beginPath(); ctx.rect(-4, -4, 8, 8);
      ctx.fillStyle = tok('--kg-amber') || '#fbbf24'; ctx.fill();
      ctx.restore();
      const { lx, ly, align, base } = radialLabel(nd, CX, CY, r + 9);
      ctx.fillStyle = hov || sel ? tok('--kg-amber') || '#fbbf24' : tok('--kg-text2') || '#8aaa90';
      ctx.font = '9px "DM Sans", sans-serif';
      ctx.textAlign = align; ctx.textBaseline = base;
      const words = res.short.split(' ');
      if (words.length <= 2) { ctx.fillText(res.short, lx, ly); }
      else {
        const mid = Math.ceil(words.length / 2);
        ctx.fillText(words.slice(0, mid).join(' '), lx, ly - 5);
        ctx.fillText(words.slice(mid).join(' '), lx, ly + 5);
      }

    } else if (nd.type === 'prov') {
      const p = nd.pd;
      if (hov) { ctx.shadowBlur = 10; ctx.shadowColor = tok('--kg-violet') || '#c084fc'; }
      ctx.beginPath(); ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(tok('--kg-violet') || '#c084fc', 0.1); ctx.fill();
      ctx.strokeStyle = hexToRgba(tok('--kg-violet') || '#c084fc', hov ? 0.9 : 0.45);
      ctx.lineWidth = 1.5; ctx.stroke();
      const { lx, ly, align, base } = radialLabel(nd, CX, CY, r + 7);
      ctx.fillStyle = tok('--kg-text3') || '#536a59';
      ctx.font = '8px "DM Sans", sans-serif';
      ctx.textAlign = align; ctx.textBaseline = base;
      ctx.fillText(p.abbr, lx, ly);
    }
    ctx.restore();
  }
  ctx.restore();
}

// ── BIZ LABEL HELPER ──────────────────────────────────────────────────────

function bizLabelFromName(name) {
  if (!name) return { abbr: '?', short: '' };
  const words = name.trim().split(/\s+/);
  const abbr = words
    .filter(w => w.length > 2)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 3);
  const short = words[0].slice(0, 8);
  return { abbr: abbr || '?', short };
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────

export default function SessionDetail() {
  const { sessionId } = useParams();
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const nodesRef  = useRef([]);
  const edgesRef  = useRef([]);
  const CXRef     = useRef(0);
  const CYRef     = useRef(0);
  const hovNRef   = useRef(null);
  const selIdRef  = useRef(null);
  const tooltipRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Graph data
  const [session,   setSession]   = useState(null);
  const [AREAS,     setAREAS]     = useState([]);
  const [GRANTS,    setGRANTS]    = useState([]);
  const [RESOURCES, setRESOURCES] = useState([]);
  const [PROVS,     setPROVS]     = useState([]);
  const [GAPS,      setGAPS]      = useState([]);
  const [overall,   setOverall]   = useState(0);

  // UI state
  const [selId, setSelId]       = useState(null);
  const [selKind, setSelKind]   = useState(null); // 'grant' | 'resource'
  const [gaugeAnim, setGaugeAnim] = useState(false);
  const [showGrants, setShowGrants] = useState(true);
  const [showResources, setShowResources] = useState(false);
  const [showProviders, setShowProviders] = useState(false);

  // ── DATA LOADING
  useEffect(() => {
    if (!sessionId) return;
    loadSessionData(sessionId);
  }, [sessionId]);

  async function loadSessionData(sId) {
    setLoading(true);
    try {
      // ── Query 1: Sesión
      const { data: sessionData, error: e1 } = await supabase
        .from('diagnostic_sessions')
        .select('id, business_name, contact_name, location, dml_level, operations_score, digital_score, market_score, total_score, activated_tags, completed_at, created_at, sectors!sector_id(name, slug)')
        .eq('id', sId)
        .single();
      if (e1) throw e1;

      // ── Query 2: Match results
      const { data: matchData = [] } = await supabase
        .from('match_results')
        .select('id, result_type, result_id, result_name, match_score, matched_tags, reasoning_path, eligibility_met, eligibility_notes')
        .eq('session_id', sId)
        .order('match_score', { ascending: false });

      // ── Query 3: Tags map
      const { data: tagsData = [] } = await supabase
        .from('tags')
        .select('name, label, category');

      // ── Queries 4-7: Details (en paralelo)
      const grantIds    = (matchData || []).filter(r => r.result_type === 'grant').map(r => r.result_id);
      const resourceIds = (matchData || []).filter(r => r.result_type === 'resource').map(r => r.result_id);
      const providerIds = (matchData || []).filter(r => r.result_type === 'provider').map(r => r.result_id);

      const [grantsRes, resourcesRes, providersRes, gpRes] = await Promise.all([
        grantIds.length > 0
          ? supabase.from('grants').select('id, name, slug, status, close_date, operations_weight, digital_weight, market_weight, contact_url, application_channel, url').in('id', grantIds)
          : Promise.resolve({ data: [] }),
        resourceIds.length > 0
          ? supabase.from('resources').select('id, title, resource_type, abstract, summary, library_url').in('id', resourceIds)
          : Promise.resolve({ data: [] }),
        providerIds.length > 0
          ? supabase.from('providers').select('id, name, slug, summary, email, phone, website, contact_name, sector_tags').in('id', providerIds)
          : Promise.resolve({ data: [] }),
        grantIds.length > 0
          ? supabase.from('grant_providers').select('grant_id, provider_id').in('grant_id', grantIds)
          : Promise.resolve({ data: [] })
      ]);

      // ── Transform
      const areas     = buildAreas(sessionData);
      const grants    = buildGrants(matchData, grantsRes.data, tagsData);
      const resources = buildResources(matchData, resourcesRes.data, tagsData);
      const provs     = buildProviders(matchData, providersRes.data, gpRes.data, grants);
      const gaps      = buildGaps(sessionData, grants);
      const score     = overallScore(sessionData);

      setSession(sessionData);
      setAREAS(areas);
      setGRANTS(grants);
      setRESOURCES(resources);
      setPROVS(provs);
      setGAPS(gaps);
      setOverall(score);

      // Trigger gauge animation after data loads
      setTimeout(() => setGaugeAnim(true), 400);

    } catch (err) {
      console.error('SessionDetail load error:', err);
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }

  // ── CANVAS SETUP + ANIMATION LOOP
  const buildAndDraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || AREAS.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;

    const { nodes, edges, CX, CY } = buildGraphNodes(canvas, AREAS, GRANTS, RESOURCES, PROVS);
    nodesRef.current = nodes;
    edgesRef.current = edges;
    CXRef.current = CX;
    CYRef.current = CY;

    const bizLabel = bizLabelFromName(session?.business_name);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const loop = (ts) => {
      drawScene(
        canvas, ctx, ts, nodes, edges, CX, CY,
        hovNRef.current, selIdRef.current, bizLabel
      );
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [AREAS, GRANTS, RESOURCES, PROVS, session]);

  useEffect(() => {
    buildAndDraw();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [buildAndDraw]);

  // ResizeObserver para el canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => buildAndDraw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [buildAndDraw]);

  // ── CANVAS INTERACTION
  function nodeAt(x, y) {
    return [...nodesRef.current].reverse().find(
      nd => Math.hypot(x - nd.x, y - nd.y) <= nd.r + 8
    ) || null;
  }

  function handleMouseMove(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const nd = nodeAt(mx, my);
    hovNRef.current = nd?.id || null;
    canvas.style.cursor = nd ? 'pointer' : 'default';
    const tt = tooltipRef.current;
    if (!tt) return;
    if (nd && nd.type !== 'biz') {
      let name = '', sub = '';
      if (nd.type === 'area')     { name = nd.ad.name + ' Area';  sub = 'Score: ' + nd.ad.score + '%'; }
      if (nd.type === 'grant')    { name = nd.gd.name;            sub = 'Match: ' + nd.gd.match + '%  ·  ' + nd.gd.status; }
      if (nd.type === 'resource') { name = nd.rd.name;            sub = 'Relevance: ' + nd.rd.match + '%  ·  ' + nd.rd.type; }
      if (nd.type === 'prov')     { name = nd.pd.name;            sub = 'Provider'; }
      tt.querySelector('.kg-tt-n').textContent = name;
      tt.querySelector('.kg-tt-s').textContent = sub;
      tt.style.left = (e.clientX + 12) + 'px';
      tt.style.top  = (e.clientY - 8)  + 'px';
      tt.classList.add('kg-tt-v');
    } else {
      tt.classList.remove('kg-tt-v');
    }
  }

  function handleMouseLeave() {
    hovNRef.current = null;
    tooltipRef.current?.classList.remove('kg-tt-v');
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
  }

  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nd = nodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (!nd) return;
    if (nd.type === 'grant') {
      if (selIdRef.current === nd.id) { clearSelection(); return; }
      openDetail(nd.id, 'grant');
    }
    if (nd.type === 'resource') {
      if (selIdRef.current === nd.id) { clearSelection(); return; }
      openDetail(nd.id, 'resource');
    }
  }

  function openDetail(id, kind) {
    selIdRef.current = id;
    setSelId(id);
    setSelKind(kind);
  }

  function clearSelection() {
    selIdRef.current = null;
    setSelId(null);
    setSelKind(null);
  }

  // ── GAUGE ANIMATION
  useEffect(() => {
    if (!gaugeAnim) return;
    const fill = document.getElementById('kg-gauge-fill');
    const lbl  = document.getElementById('kg-gauge-pct');
    if (!fill || !lbl) return;
    const circ = 2 * Math.PI * 38;
    const target = overall / 100;
    let cur = 0;
    const step = () => {
      cur = Math.min(cur + 0.013, target);
      fill.setAttribute('stroke-dasharray', `${cur * circ} ${circ}`);
      lbl.textContent = Math.round(cur * 100) + '%';
      if (cur < target) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [gaugeAnim, overall]);

  // ── AREA BAR ANIMATION
  useEffect(() => {
    if (!AREAS.length) return;
    requestAnimationFrame(() => {
      AREAS.forEach(a => {
        setTimeout(() => {
          const b = document.getElementById('kg-abar-' + a.id);
          if (b) b.style.width = a.score + '%';
        }, 300);
      });
    });
  }, [AREAS]);

  // ── CARD BAR ANIMATION
  useEffect(() => {
    if (!GRANTS.length && !RESOURCES.length) return;
    requestAnimationFrame(() => {
      [...GRANTS, ...RESOURCES].forEach(item => {
        setTimeout(() => {
          const b = document.getElementById('kg-bar-' + item.id);
          if (b) b.style.width = item.match + '%';
        }, 250);
      });
    });
  }, [GRANTS, RESOURCES]);

  // ── LOADING / ERROR STATES
  if (loading) {
    return (
      <div className="kg-wrapper" style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ color: 'var(--kg-green)', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          Loading session…
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="kg-wrapper" style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ color: 'var(--kg-rose)', fontFamily: 'IBM Plex Mono', fontSize: 13 }}>
          {error || 'Session not found.'}
        </div>
        <Link to="/consultant/dashboard" className="kg-back-btn">← Back to Dashboard</Link>
      </div>
    );
  }

  const sector = session.sectors?.name || '';
  const location = session.location || '';
  const sectorSub = [sector, location].filter(Boolean).join(' · ');
  const dmlLabel = formatDmlLevel(session.dml_level);
  const dateLabel = formatDate(session.completed_at || session.created_at);
  const grantCount = GRANTS.length;
  const resCount = RESOURCES.length;
  const provCount = PROVS.length;

  // Detail data
  const selectedGrant    = selKind === 'grant'    ? GRANTS.find(g => g.id === selId) : null;
  const selectedResource = selKind === 'resource' ? RESOURCES.find(r => r.id === selId) : null;
  const selectedProv     = selectedGrant
    ? PROVS.find(p => p.grants.includes(selectedGrant.id))
    : null;
  const selectedProvDetail = selKind === 'provider' ? PROVS.find(p => p.id === selId) : null;
  const selectedArea     = selectedGrant
    ? AREAS.find(a => a.id === selectedGrant.area)
    : selectedResource
      ? AREAS.find(a => a.id === selectedResource._areaId)
      : selectedProvDetail
        ? AREAS.find(a => a.id === selectedProvDetail.area)
        : null;

  return (
    <div className="kg-wrapper">

      {/* Tooltip */}
      <div ref={tooltipRef} className="kg-tt">
        <div className="kg-tt-n"></div>
        <div className="kg-tt-s"></div>
      </div>

      {/* Header */}
      <header className="kg-hdr">
        <Link to="/consultant/dashboard" className="kg-back-btn" style={{ marginRight: 4 }}>←</Link>
        <div className="kg-hdr-mark">WA</div>
        <div className="kg-hdr-biz">
          <div className="kg-hdr-name">{session.business_name || 'Unknown Business'}</div>
          {sectorSub && <div className="kg-hdr-sub">{sectorSub}</div>}
        </div>
        <div className="kg-chips">
          <span className="kg-chip kg-chip-amber">DML: {dmlLabel}</span>
          <span className="kg-chip kg-chip-amber">Score: {overall}%</span>
          <span className="kg-chip kg-chip-muted">{dateLabel}</span>
        </div>
      </header>

      <div className="kg-main">

        {/* ── LEFT PANEL ── */}
        <aside className="kg-pnl-l">

          {/* Gauge */}
          <div className="kg-card">
            <div className="kg-sec-lbl">Match Overview</div>
            <div className="kg-gauge-wrap">
              <svg width="100" height="100" viewBox="0 0 100 100"
                   role="img" aria-label={`${overall} percent overall match score`}>
                <circle className="kg-gauge-track" cx="50" cy="50" r="38" />
                <circle className="kg-gauge-fill" id="kg-gauge-fill" cx="50" cy="50" r="38" />
                <text id="kg-gauge-pct" x="50" y="47" textAnchor="middle"
                  fontFamily="'IBM Plex Mono', monospace" fontSize="16" fontWeight="500"
                  fill="var(--kg-text)">0%</text>
                <text x="50" y="60" textAnchor="middle"
                  fontFamily="'DM Sans', sans-serif" fontSize="8"
                  fill="var(--kg-text3)">overall</text>
              </svg>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, fontWeight: 500, color: 'var(--kg-amber)', display: 'block' }}>
                  {grantCount + resCount + provCount}
                </span>
                <span style={{ fontSize: 11, color: 'var(--kg-text2)' }}>results matched</span>
                <div style={{ fontSize: 10, color: 'var(--kg-text3)', marginTop: 2 }}>
                  {grantCount} grants · {resCount} resources · {provCount} providers
                </div>
              </div>
            </div>
          </div>

          {/* Area Scores */}
          <div className="kg-card">
            <div className="kg-sec-lbl">Area Scores</div>
            {AREAS.map(a => (
              <div key={a.id} className="kg-area-row">
                <div className="kg-area-top">
                  <span className="kg-area-name">{a.name}</span>
                  <span className="kg-area-pct" style={{ color: a.color }}>{a.score}%</span>
                </div>
                <div className="kg-bar-track">
                  <div className="kg-bar-fill" id={`kg-abar-${a.id}`}
                       style={{ background: a.color, width: 0 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Gaps */}
          <div className="kg-card" style={{ flex: 1 }}>
            <div className="kg-sec-lbl">Improvement Areas</div>
            {GAPS.map((g, i) => (
              <div key={i} className="kg-gap-row">
                <div className="kg-gap-top">
                  <span className="kg-gap-name">{g.name}</span>
                  <span className="kg-gap-impact">{g.impact}</span>
                </div>
                <div className="kg-gap-reason">{g.reason}</div>
              </div>
            ))}
          </div>

        </aside>

        {/* ── CENTER PANEL (Canvas) ── */}
        <div className="kg-pnl-c">
          <canvas
            ref={canvasRef}
            className="kg-canvas"
            tabIndex={0}
            aria-label="DPIRD knowledge graph showing business areas, matched grants, resources and providers"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleCanvasClick}
          />
          <div className="kg-legend">
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-green)' }} />Business</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-amber)' }} />Operations</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-sky)' }} />Digital</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-violet)' }} />Market</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: '#4ade80' }} />Grant ≥80%</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-amber)' }} />Grant 60–80%</div>
            <div className="kg-leg-item"><div className="kg-leg-dot" style={{ background: 'var(--kg-rose)' }} />Grant &lt;60%</div>
            <div className="kg-leg-item"><div className="kg-leg-dot-dashed" />Resource</div>
            <div className="kg-leg-item"><div className="kg-leg-dash" />Provider</div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <aside className="kg-pnl-r">

          {/* LIST VIEW */}
          {!selId && (
            <>
              <div className="kg-r-hdr">
                <div className="kg-r-title">Recommendations</div>
              </div>
              <div className="kg-r-list">
                {GRANTS.length > 0 && (
                  <div className="kg-collapse-sec">
                    <div className="kg-r-sec flex justify-between items-center cursor-pointer select-none" onClick={() => setShowGrants(!showGrants)}>
                      <span>Grants · {GRANTS.length} matched</span>
                      <span className="material-symbols-outlined">{showGrants ? 'expand_less' : 'expand_more'}</span>
                    </div>
                    {showGrants && (
                      <div className="kg-collapse-body mt-2 flex flex-col gap-2">
                        {GRANTS.map(g => {
                          const a = AREAS.find(x => x.id === g.area);
                          const p = PROVS.find(x => x.grants.includes(g.id));
                          const c = matchColor(g.match);
                          return (
                            <div key={g.id} className={`kg-r-card${selId === g.id ? ' kg-sel' : ''}`}
                                 tabIndex={0}
                                 onClick={() => openDetail(g.id, 'grant')}
                                 onKeyDown={e => e.key === 'Enter' && openDetail(g.id, 'grant')}>
                              <div className="kg-rc-top">
                                <div className="kg-rc-name">{g.name}</div>
                                <div className="kg-rc-pct" style={{ color: c }}>{g.match}%</div>
                              </div>
                              <div className="kg-rc-bar-wrap">
                                <div className="kg-rc-bar" id={`kg-bar-${g.id}`} style={{ background: c }} />
                              </div>
                              <div className="kg-rc-meta">
                                <span className="kg-rc-area" style={{ color: a?.color }}>{a?.name}</span>
                                <span style={{ color: 'var(--kg-violet)', fontSize: 11 }}>{p?.abbr || ''}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                
                {RESOURCES.length > 0 && (
                  <div className="kg-collapse-sec mt-4">
                    <div className="kg-r-sec flex justify-between items-center cursor-pointer select-none" onClick={() => setShowResources(!showResources)}>
                      <span>Resources · {RESOURCES.length} matched</span>
                      <span className="material-symbols-outlined">{showResources ? 'expand_less' : 'expand_more'}</span>
                    </div>
                    {showResources && (
                      <div className="kg-collapse-body mt-2 flex flex-col gap-2">
                        {RESOURCES.map(r => {
                          const a = AREAS.find(x => x.id === r._areaId);
                          const c = matchColor(r.match);
                          return (
                            <div key={r.id} className={`kg-r-card${selId === r.id ? ' kg-sel' : ''}`}
                                 tabIndex={0}
                                 onClick={() => openDetail(r.id, 'resource')}
                                 onKeyDown={e => e.key === 'Enter' && openDetail(r.id, 'resource')}>
                              <div className="kg-rc-top">
                                <div className="kg-rc-name">{r.name}</div>
                                <div className="kg-rc-pct" style={{ color: c }}>{r.match}%</div>
                              </div>
                              <div className="kg-rc-bar-wrap">
                                <div className="kg-rc-bar" id={`kg-bar-${r.id}`} style={{ background: c }} />
                              </div>
                              <div className="kg-rc-meta">
                                <span className="kg-rc-area" style={{ color: a?.color }}>{a?.name}</span>
                                <span style={{ color: 'var(--kg-amber)', fontSize: 11 }}>{r.type}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {PROVS.length > 0 && (
                  <div className="kg-collapse-sec mt-4">
                    <div className="kg-r-sec flex justify-between items-center cursor-pointer select-none" onClick={() => setShowProviders(!showProviders)}>
                      <span>Providers · {PROVS.length} matched</span>
                      <span className="material-symbols-outlined">{showProviders ? 'expand_less' : 'expand_more'}</span>
                    </div>
                    {showProviders && (
                      <div className="kg-collapse-body mt-2 flex flex-col gap-2">
                        {PROVS.map(p => {
                          const a = AREAS.find(x => x.id === p.area);
                          const c = matchColor(p.match);
                          return (
                            <div key={p.id} className={`kg-r-card${selId === p.id ? ' kg-sel' : ''}`}
                                 tabIndex={0}
                                 onClick={() => openDetail(p.id, 'provider')}
                                 onKeyDown={e => e.key === 'Enter' && openDetail(p.id, 'provider')}>
                              <div className="kg-rc-top">
                                <div className="kg-rc-name">{p.name}</div>
                                <div className="kg-rc-pct" style={{ color: c }}>{p.match}%</div>
                              </div>
                              <div className="kg-rc-bar-wrap">
                                <div className="kg-rc-bar" id={`kg-bar-${p.id}`} style={{ background: c }} />
                              </div>
                              <div className="kg-rc-meta">
                                <span className="kg-rc-area" style={{ color: a?.color }}>{a?.name || 'Cross-Sector'}</span>
                                <span style={{ color: 'var(--kg-violet)', fontSize: 11 }}>Provider</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="kg-hint">Click a card or graph node for full details</div>
            </>
          )}

          {/* DETAIL VIEW — GRANT */}
          {selId && selKind === 'grant' && selectedGrant && (
            <>
              <div className="kg-r-hdr">
                <button className="kg-back-btn" onClick={clearSelection}>← All</button>
                <div className="kg-r-title">Grant Detail</div>
              </div>
              <div className="kg-detail">
                <div className="kg-d-score-row">
                  <div className="kg-d-score" style={{ color: matchColor(selectedGrant.match) }}>
                    {selectedGrant.match}%
                  </div>
                  <div className="kg-d-score-lbl">match score</div>
                </div>
                <div>
                  <div className="kg-d-blk-title">Grant Info</div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Name</span>
                    <span className="kg-d-row-v">{selectedGrant.name}</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Status</span>
                    <span className="kg-d-row-v" style={{ color: 'var(--kg-amber)' }}>{selectedGrant.status}</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Area</span>
                    <span className="kg-d-row-v" style={{ color: selectedArea?.color }}>{selectedArea?.name}</span>
                  </div>
                  {selectedProv && (
                    <div className="kg-d-row">
                      <span className="kg-d-row-k">Provider</span>
                      <span className="kg-d-row-v" style={{ color: 'var(--kg-violet)' }}>{selectedProv.name}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="kg-d-blk-title">Area Weights</div>
                  <div className="kg-wt-grid">
                    <div className="kg-wt-cell">
                      <div className="kg-wt-lbl">Ops</div>
                      <div className="kg-wt-val" style={{ color: 'var(--kg-amber)' }}>
                        {Math.round(selectedGrant.weights.ops * 100)}%
                      </div>
                    </div>
                    <div className="kg-wt-cell">
                      <div className="kg-wt-lbl">Dig</div>
                      <div className="kg-wt-val" style={{ color: 'var(--kg-sky)' }}>
                        {Math.round(selectedGrant.weights.dig * 100)}%
                      </div>
                    </div>
                    <div className="kg-wt-cell">
                      <div className="kg-wt-lbl">Mkt</div>
                      <div className="kg-wt-val" style={{ color: 'var(--kg-violet)' }}>
                        {Math.round(selectedGrant.weights.mkt * 100)}%
                      </div>
                    </div>
                  </div>
                  {[
                    { label: 'Operations', val: selectedGrant.weights.ops, color: 'var(--kg-amber)' },
                    { label: 'Digital',    val: selectedGrant.weights.dig, color: 'var(--kg-sky)' },
                    { label: 'Market',     val: selectedGrant.weights.mkt, color: 'var(--kg-violet)' }
                  ].map(wt => (
                    <div key={wt.label} className="kg-wt-bar-wrap">
                      <div className="kg-wt-bar-lbl">
                        <span>{wt.label}</span>
                        <span style={{ color: wt.color }}>{Math.round(wt.val * 100)}%</span>
                      </div>
                      <div className="kg-wt-bar-track">
                        <div className="kg-wt-bar-fill" style={{ width: `${wt.val * 100}%`, background: wt.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                {selectedGrant.tags.length > 0 && (
                  <div>
                    <div className="kg-d-blk-title">Matched Tags</div>
                    <div className="kg-tags-row">
                      {selectedGrant.tags.map(t => <span key={t} className="kg-t-chip">{t}</span>)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="kg-d-blk-title">Match Reasoning</div>
                  <p className="kg-reasoning">{selectedGrant.reason}</p>
                </div>
                <div className="kg-action-box">
                  <div className="kg-action-title">Recommended Action</div>
                  <div className="kg-action-text">{selectedGrant.action}</div>
                </div>
              </div>
            </>
          )}

          {/* DETAIL VIEW — RESOURCE */}
          {selId && selKind === 'resource' && selectedResource && (
            <>
              <div className="kg-r-hdr">
                <button className="kg-back-btn" onClick={clearSelection}>← All</button>
                <div className="kg-r-title">Resource Detail</div>
              </div>
              <div className="kg-detail">
                <div className="kg-d-score-row">
                  <div className="kg-d-score" style={{ color: matchColor(selectedResource.match) }}>
                    {selectedResource.match}%
                  </div>
                  <div className="kg-d-score-lbl">relevance score</div>
                </div>
                <div>
                  <div className="kg-d-blk-title">Resource Info</div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Title</span>
                    <span className="kg-d-row-v">{selectedResource.name}</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Type</span>
                    <span className="kg-d-row-v" style={{ color: 'var(--kg-amber)' }}>{selectedResource.type}</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Area</span>
                    <span className="kg-d-row-v" style={{ color: selectedArea?.color }}>{selectedArea?.name}</span>
                  </div>
                  {selectedResource.url && (
                    <div className="kg-d-row">
                      <span className="kg-d-row-k">Library</span>
                      <a className="kg-d-row-v" href={selectedResource.url} target="_blank" rel="noopener noreferrer"
                         style={{ color: 'var(--kg-sky)' }}>View in DPIRD Library ↗</a>
                    </div>
                  )}
                </div>
                {selectedResource.tags.length > 0 && (
                  <div>
                    <div className="kg-d-blk-title">Matched Tags</div>
                    <div className="kg-tags-row">
                      {selectedResource.tags.map(t => <span key={t} className="kg-t-chip">{t}</span>)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="kg-d-blk-title">Description</div>
                  <p className="kg-reasoning">{selectedResource.desc}</p>
                </div>
              </div>
            </>
          )}

          {/* DETAIL VIEW — PROVIDER */}
          {selId && selKind === 'provider' && selectedProvDetail && (
            <>
              <div className="kg-r-hdr">
                <button className="kg-back-btn" onClick={clearSelection}>← All</button>
                <div className="kg-r-title">Provider Detail</div>
              </div>
              <div className="kg-detail">
                <div className="kg-d-score-row">
                  <div className="kg-d-score" style={{ color: matchColor(selectedProvDetail.match) }}>
                    {selectedProvDetail.match}%
                  </div>
                  <div className="kg-d-score-lbl">relevance score</div>
                </div>
                <div>
                  <div className="kg-d-blk-title">Provider Info</div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Name</span>
                    <span className="kg-d-row-v">{selectedProvDetail.name}</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Type</span>
                    <span className="kg-d-row-v" style={{ color: 'var(--kg-violet)' }}>Service Provider</span>
                  </div>
                  <div className="kg-d-row">
                    <span className="kg-d-row-k">Area</span>
                    <span className="kg-d-row-v" style={{ color: selectedArea?.color || 'var(--kg-text2)' }}>{selectedArea?.name || 'Cross-Sector'}</span>
                  </div>
                  {selectedProvDetail.website && (
                    <div className="kg-d-row">
                      <span className="kg-d-row-k">Website</span>
                      <a className="kg-d-row-v" href={selectedProvDetail.website} target="_blank" rel="noopener noreferrer"
                         style={{ color: 'var(--kg-sky)' }}>Visit Website ↗</a>
                    </div>
                  )}
                </div>
                {selectedProvDetail.sector_tags && selectedProvDetail.sector_tags.length > 0 && (
                  <div>
                    <div className="kg-d-blk-title">Matched Tags</div>
                    <div className="kg-tags-row">
                      {selectedProvDetail.sector_tags.map(t => (
                        <span key={t} className="kg-t-chip capitalize">{t.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProvDetail.summary && (
                  <div>
                    <div className="kg-d-blk-title">Description</div>
                    <p className="kg-reasoning">{selectedProvDetail.summary}</p>
                  </div>
                )}
              </div>
            </>
          )}

        </aside>
      </div>
    </div>
  );
}