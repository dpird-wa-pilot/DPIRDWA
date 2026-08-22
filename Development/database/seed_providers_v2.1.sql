-- ============================================================
-- DPIRD Digital Advisory Platform — Supabase Seed File
-- Tabla: providers
-- Versión de schema: 2.1
-- Change Control: CC-003 v1.3
-- Fecha: 2026-08-19
-- Generado por: Eleven June Consulting
-- ============================================================
-- INSTRUCCIONES PARA ANTIGRAVITY:
--   1. Ejecutar primero las migraciones de schema v2.1 (ALTER TABLE en CC-003 §3.1)
--   2. Ejecutar este archivo en Supabase SQL Editor o con psql
--   3. Verificar con: SELECT COUNT(*) FROM providers WHERE dpird_approved = true;
--      → debe retornar 15
-- ============================================================

BEGIN;

-- Limpiar providers existentes de prueba (si aplica)
-- DELETE FROM provider_tags WHERE provider_id LIKE 'a1b2c3d4%';
-- DELETE FROM providers WHERE id LIKE 'a1b2c3d4%';

INSERT INTO providers (
    id,
    name,
    slug,
    description,
    summary,
    website,
    email,
    phone,
    contact_name,
    service_types,
    service_category,
    sector_tags,
    trigger_tags,
    dml_levels,
    objective_tags,
    location,
    operates_online,
    status,
    dpird_approved,
    approval_date,
    is_featured,
    sort_order
) VALUES

-- 1. AccuWeigh
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
    'AccuWeigh',
    'accuweigh',
    'Australia''s largest weigh packaging group with branches in all mainland states providing sales and service support on weighing, packaging and food inspection equipment.',
    'WA''s leading supplier of weighing, packaging and food inspection equipment for the food industry.',
    'https://accuweigh.com.au/',
    NULL,
    '+61 (0)8 9259 5535',
    'Phyllis Dodley',
    ARRAY['implementation'],
    ARRAY['factory_equipment'],
    ARRAY['food_beverage', 'food_manufacturing'],
    ARRAY['process_automation', 'quality_control'],
    ARRAY['foundational', 'emerging'],
    ARRAY['reduce_waste', 'increase_productivity'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    1
),

-- 2. Aco Australia
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567802',
    'Aco Australia',
    'aco-australia',
    'ACO Pty Ltd is an Australian manufacturer, sales and marketing company offering an extensive portfolio of stormwater, building drainage systems, cable pit and ducting systems.',
    'Drainage and waste management solutions for food & beverage facilities across WA.',
    'https://www.acoaus.com.au/',
    NULL,
    '+61 (0)8 6250 3700',
    NULL,
    ARRAY['implementation'],
    ARRAY['waste_management'],
    ARRAY['food_beverage', 'food_manufacturing'],
    ARRAY['compliance', 'food_safety'],
    ARRAY['foundational', 'emerging'],
    ARRAY['reduce_waste', 'improve_compliance'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    2
),

-- 3. Adam Equipment
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567803',
    'Adam Equipment',
    'adam-equipment',
    'Adam Equipment offers a wide selection of digital scales and balances for food and drink industry testing, processing, production and service tasks.',
    'Professional food scales and balances for testing, processing and production in the food industry.',
    'https://www.adamequipment.com.au/',
    NULL,
    '+61 (0)8 6461 6236',
    NULL,
    ARRAY['implementation'],
    ARRAY['factory_equipment'],
    ARRAY['food_beverage', 'food_manufacturing'],
    ARRAY['quality_control', 'process_automation'],
    ARRAY['foundational', 'emerging'],
    ARRAY['increase_productivity', 'reduce_costs'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    3
),

-- 4. Adapt
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567804',
    'Adapt',
    'adapt',
    'The Adapt Way is a framework developed from decades of experience building, coaching and researching small and medium businesses, deeply rooted in the philosophy of building enduring businesses.',
    'Business strategy and coaching framework for small and medium businesses focused on sustainable growth.',
    'https://theadaptway.com/',
    NULL,
    '+61 (0)458 330 668',
    'Adam Wilce',
    ARRAY['consulting'],
    ARRAY['management_consulting'],
    ARRAY['food_beverage', 'professional_services', 'retail'],
    ARRAY['supply_chain', 'logistics'],
    ARRAY['emerging', 'established'],
    ARRAY['increase_productivity', 'access_new_markets'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    4
),

-- 5. Adaptus Pty Ltd
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567805',
    'Adaptus Pty Ltd',
    'adaptus',
    'Carbon emissions baselines, decarbonisation identification and strategy development for food and beverage manufacturers.',
    'Carbon management strategy and decarbonisation roadmaps for WA food & beverage manufacturers.',
    'https://adaptus.com.au/',
    NULL,
    '+61 (0)415 935 696',
    'Jerome Bowen',
    ARRAY['consulting'],
    ARRAY['carbon_management'],
    ARRAY['food_beverage', 'food_manufacturing', 'environmental'],
    ARRAY['compliance', 'certification'],
    ARRAY['established', 'advanced'],
    ARRAY['improve_compliance', 'reduce_costs'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    5
),

-- 6. Adept Turkey
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567806',
    'Adept Turkey',
    'adept-turkey',
    'Offering a wide range of world-class machine vision products and systems, providing expert advice on all aspects of machine vision needs for food and beverage production.',
    'Machine vision systems and expert advice for quality control and automation in food production.',
    'https://www.adept.net.au/',
    NULL,
    '+61 (0)8 9242 5411',
    NULL,
    ARRAY['implementation'],
    ARRAY['factory_equipment'],
    ARRAY['food_beverage', 'food_manufacturing'],
    ARRAY['process_automation', 'quality_control'],
    ARRAY['emerging', 'established'],
    ARRAY['increase_productivity', 'improve_traceability'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    6
),

-- 7. Aeozo Australia Pty Ltd
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567807',
    'Aeozo Australia Pty Ltd',
    'aeozo-australia',
    'Full-service branding and marketing agency specialising in F&B. We have helped previous successful voucher recipients and offer a free strategy session to explore how we can help.',
    'Branding and marketing agency specialising in food & beverage businesses across WA.',
    'https://aeozo.com/',
    NULL,
    '+61 (0)432 531 116',
    'Abhishek Jha',
    ARRAY['marketing'],
    ARRAY['branding_design'],
    ARRAY['food_beverage', 'retail'],
    ARRAY['digital_marketing', 'brand_development'],
    ARRAY['foundational', 'emerging'],
    ARRAY['access_new_markets'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    7
),

-- 8. Agknowledge
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567808',
    'Agknowledge',
    'agknowledge',
    'Agknowledge principals Peter Cooke and Nicol Taylor work nationally from Western Australia with over 60 years combined involvement in agribusiness at all levels, from farm strategic and succession planning to retail engagement.',
    'Senior agribusiness consultants offering strategic planning, succession and retail engagement for WA food businesses.',
    'https://www.linkedin.com/in/peterwcooke',
    NULL,
    '+61 (0)417 953 957',
    'Peter Cooke',
    ARRAY['consulting'],
    ARRAY['management_consulting'],
    ARRAY['agriculture', 'food_beverage'],
    ARRAY['supply_chain', 'b2b_sales'],
    ARRAY['emerging', 'established'],
    ARRAY['access_new_markets', 'increase_productivity'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    8
),

-- 9. AgriFood Technology
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567809',
    'AgriFood Technology',
    'agrifood-technology',
    'NATA accredited food testing laboratory offering nutrition information panels, fibre, pesticides, allergens, oilseed, stockfeed and microbiological testing.',
    'NATA accredited food testing lab — nutrition panels, allergens, pesticides and microbiological testing.',
    'https://agrifood.com.au/services/',
    NULL,
    '+61 (0)8 9418 5333',
    NULL,
    ARRAY['audit'],
    ARRAY['food_testing'],
    ARRAY['food_beverage', 'food_manufacturing', 'agriculture'],
    ARRAY['food_safety', 'certification', 'compliance'],
    ARRAY['foundational', 'emerging', 'established'],
    ARRAY['improve_compliance', 'improve_traceability'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    9
),

-- 10. Agristart
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567810',
    'Agristart',
    'agristart',
    'Agristart enables businesses to innovate and grow faster, specialising in Agtech and innovation programs with expert advice and industry connections that fuel growth.',
    'Agtech innovation programs and expert advisory to help food and agri businesses grow faster.',
    'https://innovationcluster.com.au/agristart/',
    NULL,
    '+61 (0)8 9755 4997',
    NULL,
    ARRAY['consulting'],
    ARRAY['management_consulting'],
    ARRAY['agriculture', 'food_beverage', 'regional_development'],
    ARRAY['supply_chain', 'process_automation'],
    ARRAY['emerging', 'established'],
    ARRAY['access_new_markets', 'increase_productivity'],
    ARRAY['regional_wa', 'south_west'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    10
),

-- 11. AHG Refrigerated Logistics
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567811',
    'AHG Refrigerated Logistics',
    'ahg-refrigerated-logistics',
    'AHG Refrigerated Logistics represents Australia''s only truly national temperature controlled supply chain network with world-class warehousing facilities in all state capitals and regional depots.',
    'National temperature-controlled logistics network with WA presence for food & beverage supply chains.',
    'https://www.ahgrl.com.au/',
    NULL,
    '+61 (0)8 9455 4960',
    NULL,
    ARRAY['logistics'],
    ARRAY['cold_chain_logistics'],
    ARRAY['food_beverage', 'food_manufacturing'],
    ARRAY['supply_chain', 'logistics', 'food_safety'],
    ARRAY['foundational', 'emerging'],
    ARRAY['reduce_waste', 'improve_traceability'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    11
),

-- 12. Albany Business Centre — Commercial Kitchen
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567812',
    'Albany Business Centre — Commercial Kitchen',
    'albany-business-centre',
    'Fully equipped commercial kitchen (28-32sqm) available for hire by the hour, half-day, full-day or 24 hours. Perfect for bakers, caterers and cooking classes with 24/7 access.',
    'Commercial kitchen hire in Albany — 24/7 access, fully equipped, ideal for bakers and caterers.',
    'https://albanybusinesscentre.com.au/hire-spaces-albany-wa',
    NULL,
    '+61 (0)8 9841 8477',
    NULL,
    ARRAY['facilities'],
    ARRAY['commercial_kitchen'],
    ARRAY['food_beverage', 'regional_development'],
    ARRAY['food_safety', 'compliance'],
    ARRAY['foundational'],
    ARRAY['reduce_costs'],
    ARRAY['regional_wa', 'great_southern'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    12
),

-- 13. Allen Air and Refrigeration
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567813',
    'Allen Air and Refrigeration',
    'allen-air-refrigeration',
    'Supply and installation of the latest energy saving refrigeration plant using Co2 refrigerant, saving up to 30% on power whilst being nearly 4000 times better for global warming.',
    'Energy-efficient CO2 refrigeration installation for food businesses — up to 30% power savings.',
    'https://allenair.net.au/',
    NULL,
    '+61 (0)8 9524 6534',
    'Kim Allen',
    ARRAY['implementation', 'logistics'],
    ARRAY['cold_chain_logistics'],
    ARRAY['food_beverage', 'food_manufacturing'],
    ARRAY['food_safety', 'compliance'],
    ARRAY['foundational', 'emerging'],
    ARRAY['reduce_costs', 'improve_compliance'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    13
),

-- 14. AMAC Customs and Logistics
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567814',
    'AMAC Customs and Logistics',
    'amac-customs-logistics',
    'Experienced global logistics firm solving complex logistical problems with speed, accuracy and agility. Proudly 100% Australian owned and operated local small business.',
    'Australian-owned customs and freight forwarding specialists for food export and import logistics.',
    'https://amaccustoms.com.au/',
    NULL,
    '+61 (0)426 447 582',
    'Aaron',
    ARRAY['logistics'],
    ARRAY['freight_forwarding'],
    ARRAY['food_beverage', 'agriculture'],
    ARRAY['export', 'supply_chain', 'international_trade'],
    ARRAY['emerging', 'established'],
    ARRAY['access_new_markets', 'reduce_costs'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    14
),

-- 15. Amplify Creative Lab
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567815',
    'Amplify Creative Lab',
    'amplify-creative-lab',
    'Specialised commercial photography and digital marketing capturing the essence of food and beverage brands. Helping WA food businesses stand out with compelling visual content.',
    'Specialised food & beverage commercial photography and digital marketing for WA brands.',
    'https://amplifycreativelab.com/',
    NULL,
    '+61 (0)460 526 441',
    'Stefano Meoni',
    ARRAY['marketing'],
    ARRAY['food_photography'],
    ARRAY['food_beverage', 'retail'],
    ARRAY['digital_marketing', 'brand_development'],
    ARRAY['foundational', 'emerging'],
    ARRAY['access_new_markets'],
    ARRAY['metro_wa'],
    TRUE,
    'active',
    TRUE,
    '2026-08-01',
    FALSE,
    15
);

-- ============================================================
-- Tabla: provider_tags  (junction table)
-- ============================================================

INSERT INTO provider_tags (provider_id, tag_id) VALUES
-- AccuWeigh
('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'e7a89fcc-8494-4e6a-be31-200a35dce16d'), -- process_automation
('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'a1d7c7cb-676f-4483-a58f-1aadf8b36ee6'), -- quality_control

-- Aco Australia
('a1b2c3d4-e5f6-7890-abcd-ef1234567802', '81f6f16e-9b7d-4877-bda3-8b61739b03de'), -- compliance
('a1b2c3d4-e5f6-7890-abcd-ef1234567802', '1adaf9e6-9ecc-4821-bf01-e19777697a0b'), -- food_safety

-- Adam Equipment
('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'a1d7c7cb-676f-4483-a58f-1aadf8b36ee6'), -- quality_control
('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'e7a89fcc-8494-4e6a-be31-200a35dce16d'), -- process_automation

-- Adapt
('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'a62e4ba2-10ce-419d-9b99-d08063a6943b'), -- supply_chain
('a1b2c3d4-e5f6-7890-abcd-ef1234567804', '1cf003c4-7c3d-4da7-8206-b359d091f320'), -- logistics

-- Adaptus Pty Ltd
('a1b2c3d4-e5f6-7890-abcd-ef1234567805', '81f6f16e-9b7d-4877-bda3-8b61739b03de'), -- compliance
('a1b2c3d4-e5f6-7890-abcd-ef1234567805', '0c255912-62d6-49df-b550-1c0a9d6a83a1'), -- certification

-- Adept Turkey
('a1b2c3d4-e5f6-7890-abcd-ef1234567806', 'e7a89fcc-8494-4e6a-be31-200a35dce16d'), -- process_automation
('a1b2c3d4-e5f6-7890-abcd-ef1234567806', 'a1d7c7cb-676f-4483-a58f-1aadf8b36ee6'), -- quality_control

-- Aeozo Australia Pty Ltd
('a1b2c3d4-e5f6-7890-abcd-ef1234567807', '85952210-8cca-4610-b066-acc7f4cdff3f'), -- digital_marketing
('a1b2c3d4-e5f6-7890-abcd-ef1234567807', '3e330a87-8044-4111-8268-50d663bbb469'), -- brand_development

-- Agknowledge
('a1b2c3d4-e5f6-7890-abcd-ef1234567808', 'a62e4ba2-10ce-419d-9b99-d08063a6943b'), -- supply_chain
('a1b2c3d4-e5f6-7890-abcd-ef1234567808', '28c3c30c-e791-4ee7-82fc-9bc4a4186125'), -- b2b_sales

-- AgriFood Technology
('a1b2c3d4-e5f6-7890-abcd-ef1234567809', '1adaf9e6-9ecc-4821-bf01-e19777697a0b'), -- food_safety
('a1b2c3d4-e5f6-7890-abcd-ef1234567809', '0c255912-62d6-49df-b550-1c0a9d6a83a1'), -- certification
('a1b2c3d4-e5f6-7890-abcd-ef1234567809', '81f6f16e-9b7d-4877-bda3-8b61739b03de'), -- compliance

-- Agristart
('a1b2c3d4-e5f6-7890-abcd-ef1234567810', 'a62e4ba2-10ce-419d-9b99-d08063a6943b'), -- supply_chain
('a1b2c3d4-e5f6-7890-abcd-ef1234567810', 'e7a89fcc-8494-4e6a-be31-200a35dce16d'), -- process_automation

-- AHG Refrigerated Logistics
('a1b2c3d4-e5f6-7890-abcd-ef1234567811', 'a62e4ba2-10ce-419d-9b99-d08063a6943b'), -- supply_chain
('a1b2c3d4-e5f6-7890-abcd-ef1234567811', '1cf003c4-7c3d-4da7-8206-b359d091f320'), -- logistics
('a1b2c3d4-e5f6-7890-abcd-ef1234567811', '1adaf9e6-9ecc-4821-bf01-e19777697a0b'), -- food_safety

-- Albany Business Centre
('a1b2c3d4-e5f6-7890-abcd-ef1234567812', '1adaf9e6-9ecc-4821-bf01-e19777697a0b'), -- food_safety
('a1b2c3d4-e5f6-7890-abcd-ef1234567812', '81f6f16e-9b7d-4877-bda3-8b61739b03de'), -- compliance

-- Allen Air and Refrigeration
('a1b2c3d4-e5f6-7890-abcd-ef1234567813', '1adaf9e6-9ecc-4821-bf01-e19777697a0b'), -- food_safety
('a1b2c3d4-e5f6-7890-abcd-ef1234567813', '81f6f16e-9b7d-4877-bda3-8b61739b03de'), -- compliance

-- AMAC Customs and Logistics
('a1b2c3d4-e5f6-7890-abcd-ef1234567814', '412e2167-14db-4b92-9ae7-107cde52a1b7'), -- export
('a1b2c3d4-e5f6-7890-abcd-ef1234567814', 'a62e4ba2-10ce-419d-9b99-d08063a6943b'), -- supply_chain
('a1b2c3d4-e5f6-7890-abcd-ef1234567814', '8ecaf72e-03cd-44be-a91b-d9ae7189b0ad'), -- international_trade

-- Amplify Creative Lab
('a1b2c3d4-e5f6-7890-abcd-ef1234567815', '85952210-8cca-4610-b066-acc7f4cdff3f'), -- digital_marketing
('a1b2c3d4-e5f6-7890-abcd-ef1234567815', '3e330a87-8044-4111-8268-50d663bbb469'); -- brand_development

-- ============================================================
-- Verificación final
-- ============================================================
-- SELECT COUNT(*) FROM providers WHERE dpird_approved = true;       -- → 15
-- SELECT COUNT(*) FROM provider_tags pt
--   JOIN providers p ON p.id = pt.provider_id
--   WHERE p.dpird_approved = true;                                   -- → 33

COMMIT;
