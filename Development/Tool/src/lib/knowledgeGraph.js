// ── src/lib/knowledgeGraph.js

/**
 * Construye el array AREAS a partir de los scores de la sesión.
 * Los ángulos son fijos — definen la posición radial de cada dimensión.
 */
export function buildAreas(session) {
  return [
    {
      id: 'a1',
      name: 'Operations',
      score: Math.round(session.operations_score || 0),
      color: '#fbbf24',          // amber
      angle: -100 * Math.PI / 180
    },
    {
      id: 'a2',
      name: 'Digital',
      score: Math.round(session.digital_score || 0),
      color: '#7dd3fc',          // sky
      angle: 30 * Math.PI / 180
    },
    {
      id: 'a3',
      name: 'Market',
      score: Math.round(session.market_score || 0),
      color: '#c084fc',          // violet
      angle: 150 * Math.PI / 180
    }
  ];
}

/**
 * Determina el área dominante de un grant por mayor peso.
 * Retorna 'a1' | 'a2' | 'a3'
 */
function dominantArea(grant) {
  const ops = grant.operations_weight || 0.35;
  const dig = grant.digital_weight    || 0.40;
  const mkt = grant.market_weight     || 0.25;
  if (ops >= dig && ops >= mkt) return 'a1';
  if (dig >= ops && dig >= mkt) return 'a2';
  return 'a3';
}

/**
 * Asigna ángulos a grants agrupados por área.
 * Distribuye los grants de cada área en un arco de ±35° alrededor del ángulo del área.
 */
function assignGrantAngles(grantList, areas) {
  const SPREAD = 70; // grados totales del arco por área
  const byArea = { a1: [], a2: [], a3: [] };
  grantList.forEach(g => byArea[dominantArea(g)].push(g));

  const areaAngles = { a1: -100, a2: 30, a3: 150 }; // grados

  const result = {};
  Object.entries(byArea).forEach(([aId, grants]) => {
    const base = areaAngles[aId];
    grants.forEach((g, i) => {
      const offset = grants.length > 1
        ? (i / (grants.length - 1) - 0.5) * SPREAD
        : 0;
      result[g.id] = (base + offset) * Math.PI / 180;
    });
  });
  return result;
}

/**
 * Asigna ángulos a resources agrupados por área.
 * Similar a grants pero con arco de ±25° para no superponerse.
 */
function assignResourceAngles(resourceList, areaAngles) {
  const SPREAD = 50;
  const byArea = { a1: [], a2: [], a3: [] };
  resourceList.forEach(r => byArea[r._areaId || 'a2'].push(r));

  const result = {};
  Object.entries(byArea).forEach(([aId, items]) => {
    const base = areaAngles[aId];
    items.forEach((r, i) => {
      const offset = items.length > 1
        ? (i / (items.length - 1) - 0.5) * SPREAD
        : 0;
      // Offset adicional para no colisionar con grants del mismo área
      result[r.id] = (base + offset + 25) * Math.PI / 180;
    });
  });
  return result;
}

/**
 * Formatea el status del grant para display.
 */
function formatGrantStatus(grant) {
  if (grant.status === 'open') return 'Open';
  if (grant.status === 'ongoing') return 'Ongoing';
  if (grant.status === 'coming_soon') return 'Coming Soon';
  if (grant.status === 'closed') {
    const year = grant.close_date
      ? new Date(grant.close_date).getFullYear()
      : null;
    return year ? `Closed — ${year}` : 'Closed';
  }
  return grant.status || 'Unknown';
}

/**
 * Genera un tag de display corto para el grant (primera palabra del nombre).
 */
function grantShortName(name) {
  if (!name) return '';
  const words = name.trim().split(' ');
  if (words.length <= 4) return name;
  return words.slice(0, 4).join(' ');
}

/**
 * Formatea un tag interno a un formato legible en inglés (Title Case)
 */
export function formatTagName(name) {
  if (!name) return '';
  return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Genera abreviatura de provider (primeras letras de cada palabra, max 4 chars).
 */
function provAbbr(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(w => w.length > 2)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 4);
}

/**
 * Construye el array GRANTS a partir de match_results + grants detalle.
 * @param {Array} matchData - Filas de match_results con result_type='grant'
 * @param {Array} grantsDetail - Filas de la tabla grants
 * @param {Array} tagsData - Filas de tags para label mapping
 * @returns {Array} Array de objetos GRANT listos para el canvas
 */
export function buildGrants(matchData, grantsDetail, tagsData) {
  const tagsMap = {};
  (tagsData || []).forEach(t => { tagsMap[t.name] = t.label || t.name; });

  const grantMap = {};
  (grantsDetail || []).forEach(g => { grantMap[g.id] = g; });

  const grantMatches = (matchData || []).filter(r => r.result_type === 'grant');

  const grantObjects = grantMatches.map(mr => {
    const g = grantMap[mr.result_id] || {};
    return {
      id: mr.result_id,
      short: grantShortName(mr.result_name || g.name || ''),
      name: mr.result_name || g.name || '',
      match: Math.round((mr.match_score || 0) * 100),
      status: formatGrantStatus(g),
      tags: (mr.matched_tags || []).map(t => formatTagName(t)),
      weights: {
        ops: g.operations_weight || 0.35,
        dig: g.digital_weight    || 0.40,
        mkt: g.market_weight     || 0.25
      },
      reason: mr.eligibility_notes || 'Tag-based match via BFS traversal.',
      action: g.contact_url
        ? `Contact the administering body at: ${g.contact_url}`
        : g.application_channel
          ? `Apply via: ${g.application_channel}`
          : 'Contact DPIRD for application details.',
      url: g.url || null
    };
  });

  // Asignar ángulos
  const angles = assignGrantAngles(grantObjects.map(g => ({
    id: g.id,
    operations_weight: g.weights.ops,
    digital_weight: g.weights.dig,
    market_weight: g.weights.mkt
  })), null);

  return grantObjects.map(g => ({
    ...g,
    area: (() => {
      const w = g.weights;
      if (w.ops >= w.dig && w.ops >= w.mkt) return 'a1';
      if (w.dig >= w.ops && w.dig >= w.mkt) return 'a2';
      return 'a3';
    })(),
    angle: angles[g.id] || 0
  }));
}

/**
 * Construye el array RESOURCES a partir de match_results + resources detalle.
 */
export function buildResources(matchData, resourcesDetail, tagsData) {
  const tagsMap = {};
  (tagsData || []).forEach(t => { tagsMap[t.name] = t.label || t.name; });

  const resMap = {};
  (resourcesDetail || []).forEach(r => { resMap[r.id] = r; });

  const resourceMatches = (matchData || []).filter(r => r.result_type === 'resource');

  const AREA_ANGLES = { a1: -100, a2: 30, a3: 150 };
  const SPREAD = 50;

  const objects = resourceMatches.map((mr, i) => {
    const r = resMap[mr.result_id] || {};
    // Asignar área por tags — si matched_tags tiene 'digital' → a2, etc.
    const tags = mr.matched_tags || [];
    let areaId = 'a2';  // default: Digital
    if (tags.some(t => ['supply_chain','quality_control','compliance','process_automation'].includes(t))) areaId = 'a1';
    if (tags.some(t => ['export','import','b2b_sales','marketing_digital','brand_development'].includes(t))) areaId = 'a3';

    return {
      id: mr.result_id,
      short: (r.title || mr.result_name || '').split(' ').slice(0, 5).join(' '),
      name: r.title || mr.result_name || '',
      match: Math.round((mr.match_score || 0) * 100),
      type: formatResourceType(r.resource_type),
      tags: tags.map(t => formatTagName(t)),
      desc: r.summary || r.abstract || 'DPIRD library resource.',
      url: r.library_url || null,
      _areaId: areaId
    };
  });

  // Asignar ángulos
  const byArea = { a1: [], a2: [], a3: [] };
  objects.forEach(r => byArea[r._areaId].push(r));
  objects.forEach(r => {
    const group = byArea[r._areaId];
    const base = AREA_ANGLES[r._areaId] || 30;
    const i = group.indexOf(r);
    const offset = group.length > 1
      ? (i / (group.length - 1) - 0.5) * SPREAD
      : 0;
    r.angle = (base + offset + 25) * Math.PI / 180;
  });

  return objects;
}

function formatResourceType(type) {
  if (!type) return 'Resource';
  const map = {
    book_chapter: 'Book Chapter',
    journal_article: 'Journal Article',
    research_report: 'Research Report'
  };
  return map[type] || type;
}

/**
 * Construye el array PROVS a partir de match_results + providers detalle + grant_providers.
 * @param {Array} matchData - Filas de match_results
 * @param {Array} providersDetail - Filas de la tabla providers
 * @param {Array} grantProvidersData - Filas de grant_providers
 * @param {Array} grants - El array GRANTS ya construido (con angles)
 */
export function buildProviders(matchData, providersDetail, grantProvidersData, grants) {
  const provMap = {};
  (providersDetail || []).forEach(p => { provMap[p.id] = p; });

  // Construir mapa grant → providers
  const grantToProvs = {};
  (grantProvidersData || []).forEach(gp => {
    if (!grantToProvs[gp.grant_id]) grantToProvs[gp.grant_id] = [];
    grantToProvs[gp.grant_id].push(gp.provider_id);
  });

  // Construir mapa provider → grants (inverso)
  const provToGrants = {};
  Object.entries(grantToProvs).forEach(([grantId, provIds]) => {
    provIds.forEach(pid => {
      if (!provToGrants[pid]) provToGrants[pid] = [];
      provToGrants[pid].push(grantId);
    });
  });

  // Providers matcheados desde match_results (result_type = 'provider')
  const providerMatches = (matchData || []).filter(r => r.result_type === 'provider');

  // Si no hay providers en match_results, inferir desde grant_providers
  let providerIds = providerMatches.map(r => r.result_id);
  if (providerIds.length === 0) {
    // Usar providers vinculados a grants matcheados
    const matchedGrantIds = new Set(
      (matchData || []).filter(r => r.result_type === 'grant').map(r => r.result_id)
    );
    const inferredProvIds = new Set();
    matchedGrantIds.forEach(gid => {
      (grantToProvs[gid] || []).forEach(pid => inferredProvIds.add(pid));
    });
    providerIds = [...inferredProvIds];
  }

  // Construir array de grants para lookup de ángulos
  const grantAngleMap = {};
  (grants || []).forEach(g => { grantAngleMap[g.id] = g.angle; });

  const providerMatchesMap = {};
  providerMatches.forEach(r => { providerMatchesMap[r.result_id] = r; });

  return providerIds.map(pid => {
    const p = provMap[pid] || {};
    const linkedGrants = provToGrants[pid] || [];
    
    let matchScore = 0;
    let matchedTags = [];
    const pMatch = providerMatchesMap[pid];
    if (pMatch) {
      matchScore = Math.round((pMatch.match_score || 0) * 100);
      matchedTags = pMatch.matched_tags || [];
    }

    // Determine an area based on linked grants (if any)
    let areaId = null;
    if (linkedGrants.length > 0) {
      const g = grants.find(x => x.id === linkedGrants[0]);
      if (g) areaId = g.area;
    }

    return {
      id: pid,
      name: p.name || 'Unknown Provider',
      abbr: provAbbr(p.name || ''),
      grants: linkedGrants,
      email: p.email,
      phone: p.phone,
      website: p.website,
      contactName: p.contact_name,
      sector_tags: p.sector_tags || [],
      summary: p.summary || '',
      match: matchScore,
      matched_tags: matchedTags,
      area: areaId
    };
  });
}

/**
 * Calcula los "Improvement Areas" (gaps) a partir de los scores de la sesión.
 * Lógica: si un área está bajo umbral, es un gap con impacto estimado.
 */
export function buildGaps(session, grants) {
  const gaps = [];
  const opsScore  = Math.round(session.operations_score || 0);
  const digScore  = Math.round(session.digital_score    || 0);
  const mktScore  = Math.round(session.market_score     || 0);

  // Contar grants no alcanzados por área (match_score < 0.60 o sin match)
  // Para simplificar: contar grants en cada área con match < 70%
  const lowOps = (grants || []).filter(g => g.area === 'a1' && g.match < 70).length;
  const lowDig = (grants || []).filter(g => g.area === 'a2' && g.match < 70).length;
  const lowMkt = (grants || []).filter(g => g.area === 'a3' && g.match < 70).length;

  if (digScore < 60) {
    gaps.push({
      name: 'Digital Adoption',
      reason: `Digital score ${digScore}% — 60% threshold for premium programs`,
      impact: lowDig > 0 ? `+${lowDig} grants` : '+grants'
    });
  }
  if (mktScore < 65) {
    gaps.push({
      name: 'Market Profiling',
      reason: `Market score ${mktScore}% — export and market tags incomplete`,
      impact: lowMkt > 0 ? `+${lowMkt} grants` : '+grants'
    });
  }
  if (opsScore < 70) {
    gaps.push({
      name: 'Operations Readiness',
      reason: `Operations score ${opsScore}% — supply chain or compliance gap`,
      impact: lowOps > 0 ? `+${lowOps} grants` : '+grants'
    });
  }

  // Siempre mostrar al menos un gap si todos están por encima de umbral
  if (gaps.length === 0) {
    gaps.push({
      name: 'Environmental Certification',
      reason: 'Organic or ISO certification not documented on record',
      impact: '+2 grants'
    });
  }

  return gaps.slice(0, 3); // máximo 3 gaps en el panel
}

/**
 * Calcula el score overall de la sesión para el gauge.
 * Siempre recalcula basado en las áreas para mantener consistencia.
 */
export function overallScore(session) {
  const ops = (session.operations_score || 0) * 0.35;
  const dig = (session.digital_score    || 0) * 0.40;
  const mkt = (session.market_score     || 0) * 0.25;
  return Math.round(ops + dig + mkt);
}

/**
 * Formatea la fecha para el header chip.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formatea el DML level para display.
 */
export function formatDmlLevel(level) {
  const map = {
    foundational: 'Foundational',
    emerging: 'Emerging',
    established: 'Established',
    advanced: 'Advanced'
  };
  return map[level] || level || 'Unknown';
}