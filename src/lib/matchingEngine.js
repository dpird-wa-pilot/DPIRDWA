// src/lib/matchingEngine.js
// [CC-004] BFS Matching Engine — pure JS module, no server calls

// Human-readable explanations for each tag
const TAG_EXPLANATIONS = {
  inventory_software: 'Inventory management needs identified',
  supply_chain: 'Supply chain challenges identified',
  compliance: 'Compliance and certification needs identified',
  process_automation: 'Process automation opportunities identified',
  website: 'Website and online presence gap identified',
  ecommerce: 'E-commerce capability gap identified',
  crm: 'Customer management needs identified',
  cybersecurity: 'Cybersecurity baseline needs identified',
  export: 'Export readiness interest identified',
  brand_development: 'Brand development needs identified',
  marketing_digital: 'Digital marketing needs identified',
  quality_control: 'Quality control improvement needs identified',
  social_media: 'Social media presence gap identified',
  ai_tools: 'Data and analytics adoption potential identified',
  customer_retention: 'Customer retention improvement needs identified',
  international_supply_chain: 'International supply chain potential identified',
  certification: 'Certification pathway needs identified',
  fleet_management: 'Fleet or logistics management needs identified'
};

/**
 * Build reasoning path — explains WHY this result matched
 */
function buildReasoningPath(activatedTags, result) {
  const matchedTags = activatedTags.filter(tag => (result.trigger_tags || []).includes(tag));
  return {
    matched_tags: matchedTags,
    total_trigger_tags: (result.trigger_tags || []).length,
    match_count: matchedTags.length,
    explanation: matchedTags.map(tag => TAG_EXPLANATIONS[tag] || tag)
  };
}

const WA_LOCATIONS = ['metro_wa', 'regional_wa', 'remote_wa'];

/**
 * Geographic compatibility factor
 */
function calculateGeoFactor(result, businessLocation) {
  const resultLocations = result.location || result.geographic_scope || [];
  if (resultLocations.length === 0) return 1.0; // No restriction = applies everywhere

  // Location not captured yet — cannot determine incompatibility, so don't exclude
  if (!businessLocation) return 1.0;

  if (resultLocations.includes(businessLocation)) return 1.0;
  // 'all_wa' covers all WA locations (metro, regional, remote) — treat as wildcard within WA
  if (resultLocations.includes('all_wa') && WA_LOCATIONS.includes(businessLocation)) return 1.0;
  if (result.operates_online || resultLocations.includes('national')) return 0.8;
  return 0.0;
}

/**
 * Eligibility factor for grants
 */
function calculateEligibilityFactor(result, profile) {
  if (result.result_type !== 'grant') return 1.0;

  const grant = result;
  let score = 1.0;

  // Parse profile numerics — profile values arrive as strings from form selects
  const businessAgeYears = profile.businessAgeYears !== '' && profile.businessAgeYears != null
    ? parseInt(profile.businessAgeYears, 10)
    : null;
  const employeeCount = profile.employeeCount !== '' && profile.employeeCount != null
    ? parseInt(profile.employeeCount, 10)
    : null;

  // Business age check — only penalise when both values are known
  if (grant.business_age_min > 0 && businessAgeYears !== null && businessAgeYears < grant.business_age_min) {
    score *= 0.3;
  }

  // ABN requirement — hard exclusion
  if (grant.requires_abn && !profile.hasAbn) return 0.0;

  // Employee count check — only penalise when both values are known
  if (grant.employee_max != null && employeeCount !== null && employeeCount > grant.employee_max) {
    score *= 0.4;
  }

  // DML range check — dml_min=0 means no minimum; dml_max=100 means no maximum
  if (grant.dml_min > 0 && profile.dmlScore < grant.dml_min) score *= 0.5;
  if (grant.dml_max < 100 && profile.dmlScore > grant.dml_max) score *= 0.5;

  return score;
}

/**
 * Calculate match score between SME activated tags and a result's trigger tags
 */
export function calculateMatchScore(activatedTags, result, businessProfile) {
  const triggerTags = result.trigger_tags || [];
  if (triggerTags.length === 0) return 0;

  const intersection = activatedTags.filter(tag => triggerTags.includes(tag));
  if (intersection.length === 0) return 0;
  
  // Blend percentage match with absolute match depth to prevent uniform scores
  const percentageScore = intersection.length / triggerTags.length;
  const depthBonus = Math.min(intersection.length * 0.05, 0.2); // Up to +20% for deep matches
  const tagScore = Math.min(percentageScore * 0.8 + depthBonus, 1.0);

  const geoFactor = calculateGeoFactor(result, businessProfile.location);
  const eligibilityFactor = calculateEligibilityFactor(result, businessProfile);

  return tagScore * geoFactor * eligibilityFactor;
}

/**
 * Main matching function — returns ranked results for all three types
 */
export function runBFSMatching(activatedTags, { grants, providers, resources }, businessProfile) {
  const scoreAndRank = (items, type) =>
    items
      .map(item => ({
        ...item,
        result_type: type,
        match_score: calculateMatchScore(activatedTags, { ...item, result_type: type }, businessProfile),
        matched_tags: activatedTags.filter(tag => (item.trigger_tags || []).includes(tag)),
        reasoning_path: buildReasoningPath(activatedTags, item)
      }))
      .filter(item => item.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5); // Top 5 per type

  return {
    grants: scoreAndRank(grants, 'grant'),
    providers: scoreAndRank(providers, 'provider'),
    resources: scoreAndRank(resources, 'resource')
  };
}
