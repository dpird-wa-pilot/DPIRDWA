-- ==============================================================================
-- [CC-002] DPIRD Database Seed - Resources
-- Data generated from DPIRD_Database_Prototype_v2.xlsx
-- ==============================================================================

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '685cb327-0e57-481c-a6f2-aff7507daa0b', 'Strategic tillage for sustaining the productivity of broadacre cropping in arid and semi-arid regions', 'strategic-tillage-broadacre-cropping', 'book_chapter',
  ARRAY['Gaus Azam', 'Md. Shahinur Rahman', 'Kanch Wickramarachchi']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Examines how deep strategic tillage addresses soil water repellence, subsoil acidity, pH stratification and compaction in broadacre cropping systems of southern Australia.', 'Research on strategic tillage for WA broadacre crops — covers soil management, water efficiency and nutrient redistribution in dry farming systems.',
  '2024-06-19', 'IntechOpen', NULL, NULL, '10.5772/intechopen.112875', '978-1-83769-223-1', NULL, 'https://library.dpird.wa.gov.au/books/33/',
  ARRAY['Agronomy and Crop Sciences', 'Natural Resources Management and Policy', 'Soil Science']::text[], ARRAY['agriculture', 'horticulture']::text[], ARRAY['compliance', 'water_management', 'quality_control']::text[], NULL, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  'bf18aa6c-a22b-446b-9c1c-d05174e7c82f', 'Control of Barley Grass in the Low Rainfall Zone Farming Systems', 'barley-grass-control-low-rainfall', 'book_chapter',
  ARRAY['Gurjeet Gill', 'Catherine Borger']::text[], ARRAY['University of Adelaide', 'DPIRD Western Australia']::text[],
  'GRDC-funded research on integrated weed management strategies for barley grass infestations in cereal crops across southern and western Australia low-rainfall zones.', 'Practical guide for managing barley grass in low-rainfall WA farming zones — integrated weed management for cereal crop producers.',
  '2023-02-01', 'GRDC', NULL, NULL, NULL, '978-1-922342-36-2', NULL, 'https://library.dpird.wa.gov.au/books/24/',
  ARRAY['Agricultural Science', 'Agriculture', 'Agronomy and Crop Sciences', 'Biosecurity']::text[], ARRAY['agriculture']::text[], ARRAY['biosecurity', 'compliance', 'food_safety']::text[], NULL, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  'bd71414f-b884-4e39-8873-6dca291c3d8f', 'Electric weed control — how does it compare to conventional weed control methods?', 'electric-weed-control-comparison', 'journal_article',
  ARRAY['Catherine Borger', 'Miranda J. Slaven']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Compared electric weed control (Zasso XPower) against conventional methods in vineyard settings. Electric control at 24–36 kW reduced weed biomass by 84–87%, comparable to herbicide (88%) and superior to mowing (65%).', 'Research comparing electric weed control technology against herbicides and mowing in viticulture — promising results for spring applications in Mediterranean climates.',
  '2025-06-11', NULL, 'Weed Science', '73(1), e46', '10.1017/wsc.2025.18', NULL, NULL, 'https://library.dpird.wa.gov.au/j_article/104/',
  ARRAY['Agronomy and Crop Sciences', 'Viticulture and Oenology', 'Weed Science']::text[], ARRAY['agriculture', 'horticulture']::text[], ARRAY['process_automation', 'compliance', 'quality_control']::text[], NULL, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '3e53cd5a-d5f6-4f33-92aa-93566a83a574', 'Electric interrow control of lupine plants does not adversely affect neighbouring non-target lupine plants', 'electric-interrow-lupine-control', 'journal_article',
  ARRAY['Catherine Borger', 'Miranda J. Slaven']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Three trials (2022–2023) comparing electric weed control with mowing for interrow weed management in lupine crops. Electric weed control and mowing did not reduce density, biomass or seed quality of adjacent lupine plants.', 'Study confirming electric weed control is safe for neighbouring lupine crops — supports adoption of non-chemical interrow weed management for WA grain legume producers.',
  '2024-10-29', NULL, 'Weed Science', '73, e7', '10.1017/wsc.2024.83', NULL, NULL, 'https://library.dpird.wa.gov.au/j_article/105/',
  ARRAY['Agronomy and Crop Sciences', 'Weed Science']::text[], ARRAY['agriculture']::text[], ARRAY['process_automation', 'compliance']::text[], NULL, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '76fe70b2-bed0-42de-9387-6a5e9b72a3b7', 'Fast-tracking trait combination in triticale through doubled haploid technology', 'triticale-doubled-haploid-technology', 'journal_article',
  ARRAY['Sue Broughton', 'Marieclaire Castello', 'Yong Han', 'Richard G. Bennett', 'Manisha Shankar', 'Ryan Varischetti', 'Daniel Real']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Developed an anther culture protocol for triticale and created doubled haploid lines combining awnlessness with stripe rust resistance. From 1,130 regenerant plants, 480 DH lines harvested with 114 awnless lines selected for field evaluation.', 'Breeding research enabling faster development of disease-resistant triticale varieties for WA grain producers — relevant to crop quality and supply chain consistency.',
  '2026-05-12', NULL, 'Agronomy', '16(9), 923', '10.3390/agronomy16090923', NULL, NULL, 'https://library.dpird.wa.gov.au/j_article/106/',
  ARRAY['Agronomy and Crop Sciences', 'Plant Breeding and Genetics']::text[], ARRAY['agriculture', 'food_manufacturing']::text[], ARRAY['quality_control', 'certification']::text[], NULL, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  'd655d271-1e7d-49a4-a2ce-45194f3c619a', 'Western Australia''s bulk and containerised grain exports in a national context', 'wa-grain-exports-bulk-containerised', 'research_report',
  ARRAY['Ross Kingwell', 'Dipesh Maharjan']::text[], ARRAY['Australian Export Grains Innovation Centre', 'University of Western Australia']::text[],
  'Examines containerised and bulk grain exports from WA and other main grain-producing Australian states, covering 2011–12 through 2021–22 data on grain varieties, quantities and destination markets.', 'Analysis of WA grain export performance across bulk and containerised channels — useful context for agricultural exporters assessing international market opportunities.',
  '2022-08-30', 'Australian Export Grains Innovation Centre', NULL, NULL, NULL, NULL, NULL, 'https://library.dpird.wa.gov.au/reports/37/',
  ARRAY['Agricultural Economics', 'Agricultural Science', 'Operations and Supply Chain Management']::text[], ARRAY['agriculture']::text[], ARRAY['export', 'b2b_sales', 'international_trade', 'supply_chain']::text[], ARRAY['established', 'advanced']::text[], false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '8bfee450-c285-4cc0-94d0-04ece17165b9', 'Improving Australia''s containerised grain exports', 'improving-containerised-grain-exports', 'research_report',
  ARRAY['Ross Kingwell', 'Scott McKay', 'Peter White']::text[], ARRAY['Australian Export Grains Innovation Centre']::text[],
  'Analyses containerised grain export supply chains in Australia, comparing with bulk grain operations, and identifies improvement opportunities through investment, policy reform and educational initiatives.', '142-page analysis of Australian containerised grain export supply chains with improvement recommendations — relevant to agricultural exporters and logistics-focused agribusinesses.',
  '2022-08-24', 'Australian Export Grains Innovation Centre', NULL, NULL, NULL, NULL, NULL, 'https://library.dpird.wa.gov.au/reports/36/',
  ARRAY['Agricultural Economics', 'Operations and Supply Chain Management']::text[], ARRAY['agriculture']::text[], ARRAY['supply_chain', 'export', 'logistics', 'process_automation']::text[], ARRAY['emerging', 'established']::text[], false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '93ee3aa3-dc4b-4726-aa2d-c053448d8c8b', 'The rationale for taxpayer support for primary industry research and innovation in Western Australia', 'taxpayer-support-primary-industry-research', 'research_report',
  ARRAY['Ross Kingwell']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Addresses government investment in primary industry research and innovation in WA, examining value of research to industry and the broader economy, context of staff reductions at DPIRD over 2008–2018.', 'Policy context for DPIRD research investment in WA primary industries — background reading for businesses engaging with government innovation programs.',
  '2018-09-01', 'DPIRD', NULL, NULL, NULL, NULL, '13', 'https://library.dpird.wa.gov.au/reports/13/',
  ARRAY['Agricultural and Resource Economics', 'Agricultural Economics', 'Business Analytics']::text[], NULL, ARRAY['compliance']::text[], NULL, false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '241a83ff-28c3-4885-86e6-4b50b01e284c', 'Digital Tools for Farm Management: A Practical Guide for WA Primary Producers', 'digital-tools-farm-management-wa', 'research_report',
  ARRAY['DPIRD Digital Advisory Team']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Practical overview of digital tools available for farm management in Western Australia, covering inventory systems, IoT sensors, supply chain software and data-driven decision-making for producers at any digital maturity level.', 'Step-by-step guide to adopting affordable digital tools on your farm — from basic record-keeping apps to smart sensors. Designed for WA producers starting their digital journey.',
  '2025-06-01', 'DPIRD', NULL, NULL, NULL, NULL, NULL, 'https://library.dpird.wa.gov.au/reports/',
  ARRAY['Agricultural Science', 'Business Analytics']::text[], ARRAY['agriculture', 'food_beverage', 'horticulture', 'aquaculture']::text[], ARRAY['no_digital_presence', 'business_software', 'inventory_software', 'process_automation', 'foundational', 'emerging']::text[], ARRAY['foundational', 'emerging']::text[], true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  'f2f36d86-ee0a-440b-8e7c-82274d74023f', 'Export Readiness for WA Food and Beverage Producers: Market Access Guide', 'export-readiness-wa-food-producers', 'research_report',
  ARRAY['DPIRD Trade Development Team']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Practical roadmap for WA food and beverage businesses considering international export markets, covering compliance requirements, food safety certification pathways, market entry strategies and government support programs.', 'Practical export guide for WA food businesses — covers compliance, certification and market entry steps for producers considering international markets.',
  '2025-03-15', 'DPIRD', NULL, NULL, NULL, NULL, NULL, 'https://library.dpird.wa.gov.au/reports/',
  ARRAY['Agricultural Economics', 'Operations and Supply Chain Management']::text[], ARRAY['food_beverage', 'food_manufacturing', 'agriculture']::text[], ARRAY['export', 'international_trade', 'compliance', 'certification', 'b2b_sales']::text[], ARRAY['established', 'advanced']::text[], true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '166b29c4-d933-48c5-bbe9-fd67b5210597', 'Food Safety Compliance for Small Food Processors in Western Australia', 'food-safety-compliance-small-processors-wa', 'research_report',
  ARRAY['DPIRD Food Safety Team']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Practical compliance guide for small WA food processors covering HACCP implementation, food safety plans, regulatory obligations under WA and national food standards, and approved compliance pathways.', 'Plain-language food safety guide for small WA processors — HACCP, food safety plans and regulatory requirements explained step by step.',
  '2024-11-20', 'DPIRD', NULL, NULL, NULL, NULL, NULL, 'https://library.dpird.wa.gov.au/reports/',
  ARRAY['Agricultural Science', 'Biosecurity']::text[], ARRAY['food_beverage', 'food_manufacturing']::text[], ARRAY['food_safety', 'compliance', 'certification', 'quality_control']::text[], ARRAY['foundational', 'emerging', 'established']::text[], true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '4e7a81fe-6d37-4960-96e4-706d852d27bc', 'Supply Chain Digitalisation for WA Agribusiness: Practical Adoption Guide', 'supply-chain-digitalisation-wa-agribusiness', 'research_report',
  ARRAY['DPIRD Agribusiness Advisory Team']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Guide to digitising supply chain operations for WA agricultural and food businesses, covering inventory management software, logistics platforms, supplier integration tools and low-cost implementation options.', 'How to digitise your supply chain — practical tool comparisons and implementation roadmap for WA agribusinesses.',
  '2025-08-01', 'DPIRD', NULL, NULL, NULL, NULL, NULL, 'https://library.dpird.wa.gov.au/reports/',
  ARRAY['Operations and Supply Chain Management', 'Business Analytics']::text[], ARRAY['agriculture', 'food_beverage', 'food_manufacturing']::text[], ARRAY['supply_chain', 'process_automation', 'inventory_software', 'logistics', 'emerging', 'established']::text[], ARRAY['emerging', 'established']::text[], false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '26a544a3-27a6-415a-893b-702c0f204565', 'Building a Digital Presence for Rural and Regional WA Businesses', 'digital-presence-rural-regional-wa', 'research_report',
  ARRAY['DPIRD Regional Business Team']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Step-by-step guide for rural WA businesses to build their first digital presence, covering website basics, social media setup, Google Business Profile optimisation, and digital marketing fundamentals on a limited budget.', 'First steps to getting online for rural WA businesses — website, social media and Google listing setup explained in plain language.',
  '2024-07-10', 'DPIRD', NULL, NULL, NULL, NULL, NULL, 'https://library.dpird.wa.gov.au/reports/',
  ARRAY['Business Analytics']::text[], NULL, ARRAY['no_digital_presence', 'website', 'social_media', 'digital_marketing', 'foundational', 'emerging']::text[], ARRAY['foundational', 'emerging']::text[], true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  '6858c255-bc44-4bac-b743-782eaa41214b', 'Water Efficiency Technologies for WA Primary Producers: Assessment and Adoption Guide', 'water-efficiency-technologies-wa-producers', 'research_report',
  ARRAY['DPIRD Water Resources Team']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Technical guide to water efficiency technologies for WA farmers, including soil moisture monitoring, precision irrigation systems, water accounting tools and eligibility for subsidy programs.', 'Practical guide to water-saving technologies for WA farms — tool comparisons, costs and subsidy pathways for primary producers.',
  '2024-09-05', 'DPIRD', NULL, NULL, NULL, NULL, NULL, 'https://library.dpird.wa.gov.au/reports/',
  ARRAY['Natural Resources Management and Policy', 'Agricultural Science']::text[], ARRAY['agriculture', 'horticulture', 'aquaculture']::text[], ARRAY['water_management', 'process_automation', 'compliance', 'certification']::text[], ARRAY['emerging', 'established']::text[], false
) ON CONFLICT (id) DO NOTHING;

INSERT INTO resources (id, title, slug, resource_type, authors, author_affiliations, abstract, summary, publication_date, publisher, journal_name, volume_issue, doi, isbn, report_number, library_url, raw_disciplines, sector_tags, trigger_tags, dml_levels, is_featured) VALUES (
  'cc1b2aa9-7eb9-462e-9c7f-1f2fd09286f4', 'Carbon Farming Opportunities for WA Landholders: A Practical Primer', 'carbon-farming-opportunities-wa-landholders', 'research_report',
  ARRAY['DPIRD Environmental Programs Team']::text[], ARRAY['DPIRD Western Australia']::text[],
  'Introduction to carbon farming methods available in WA, eligible methodologies under the Australian Carbon Credit Unit scheme, co-benefits for landholders, market mechanisms and how to get started as a registered project proponent.', 'Plain-language introduction to carbon farming in WA — how to earn ACCUs, eligible land use changes and project registration steps.',
  '2025-01-20', 'DPIRD', NULL, NULL, NULL, NULL, NULL, 'https://library.dpird.wa.gov.au/reports/',
  ARRAY['Natural Resources Management and Policy', 'Agricultural Economics']::text[], ARRAY['agriculture', 'environmental', 'horticulture']::text[], ARRAY['carbon_farming', 'compliance', 'certification', 'export']::text[], NULL, false
) ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- Resource Tags
-- --------------------------------------------------------
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('685cb327-0e57-481c-a6f2-aff7507daa0b', '81f6f16e-9b7d-4877-bda3-8b61739b03de') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('685cb327-0e57-481c-a6f2-aff7507daa0b', 'aabdc91e-2d8f-4b26-91c9-f29c1ce9bd41') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('685cb327-0e57-481c-a6f2-aff7507daa0b', 'a1d7c7cb-676f-4483-a58f-1aadf8b36ee6') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('bf18aa6c-a22b-446b-9c1c-d05174e7c82f', '83296f97-bdc2-4f26-8c1b-3ef4e7ae9cc4') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('bf18aa6c-a22b-446b-9c1c-d05174e7c82f', '81f6f16e-9b7d-4877-bda3-8b61739b03de') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('bf18aa6c-a22b-446b-9c1c-d05174e7c82f', '1adaf9e6-9ecc-4821-bf01-e19777697a0b') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('bd71414f-b884-4e39-8873-6dca291c3d8f', 'e7a89fcc-8494-4e6a-be31-200a35dce16d') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('bd71414f-b884-4e39-8873-6dca291c3d8f', '81f6f16e-9b7d-4877-bda3-8b61739b03de') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('bd71414f-b884-4e39-8873-6dca291c3d8f', 'a1d7c7cb-676f-4483-a58f-1aadf8b36ee6') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('3e53cd5a-d5f6-4f33-92aa-93566a83a574', 'e7a89fcc-8494-4e6a-be31-200a35dce16d') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('3e53cd5a-d5f6-4f33-92aa-93566a83a574', '81f6f16e-9b7d-4877-bda3-8b61739b03de') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('76fe70b2-bed0-42de-9387-6a5e9b72a3b7', 'a1d7c7cb-676f-4483-a58f-1aadf8b36ee6') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('76fe70b2-bed0-42de-9387-6a5e9b72a3b7', '0c255912-62d6-49df-b550-1c0a9d6a83a1') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('d655d271-1e7d-49a4-a2ce-45194f3c619a', '412e2167-14db-4b92-9ae7-107cde52a1b7') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('d655d271-1e7d-49a4-a2ce-45194f3c619a', '28c3c30c-e791-4ee7-82fc-9bc4a4186125') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('d655d271-1e7d-49a4-a2ce-45194f3c619a', '8ecaf72e-03cd-44be-a91b-d9ae7189b0ad') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('d655d271-1e7d-49a4-a2ce-45194f3c619a', 'a62e4ba2-10ce-419d-9b99-d08063a6943b') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('8bfee450-c285-4cc0-94d0-04ece17165b9', 'a62e4ba2-10ce-419d-9b99-d08063a6943b') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('8bfee450-c285-4cc0-94d0-04ece17165b9', '412e2167-14db-4b92-9ae7-107cde52a1b7') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('8bfee450-c285-4cc0-94d0-04ece17165b9', '1cf003c4-7c3d-4da7-8206-b359d091f320') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('8bfee450-c285-4cc0-94d0-04ece17165b9', 'e7a89fcc-8494-4e6a-be31-200a35dce16d') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('93ee3aa3-dc4b-4726-aa2d-c053448d8c8b', '81f6f16e-9b7d-4877-bda3-8b61739b03de') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('241a83ff-28c3-4885-86e6-4b50b01e284c', '77de9702-cc16-42e0-b360-1d09a933bb83') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('241a83ff-28c3-4885-86e6-4b50b01e284c', 'abbfb89e-ca98-492b-881f-e82d52f3108b') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('241a83ff-28c3-4885-86e6-4b50b01e284c', '22b1a7e2-ed63-4892-b735-1e27fe64b97b') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('241a83ff-28c3-4885-86e6-4b50b01e284c', 'e7a89fcc-8494-4e6a-be31-200a35dce16d') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('241a83ff-28c3-4885-86e6-4b50b01e284c', '7182067a-0dc3-4a6c-a224-8c21cf8b59d7') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('241a83ff-28c3-4885-86e6-4b50b01e284c', '908de6ca-7e3c-4bc5-8809-62d2fd547bd1') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('f2f36d86-ee0a-440b-8e7c-82274d74023f', '412e2167-14db-4b92-9ae7-107cde52a1b7') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('f2f36d86-ee0a-440b-8e7c-82274d74023f', '8ecaf72e-03cd-44be-a91b-d9ae7189b0ad') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('f2f36d86-ee0a-440b-8e7c-82274d74023f', '81f6f16e-9b7d-4877-bda3-8b61739b03de') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('f2f36d86-ee0a-440b-8e7c-82274d74023f', '0c255912-62d6-49df-b550-1c0a9d6a83a1') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('f2f36d86-ee0a-440b-8e7c-82274d74023f', '28c3c30c-e791-4ee7-82fc-9bc4a4186125') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('166b29c4-d933-48c5-bbe9-fd67b5210597', '1adaf9e6-9ecc-4821-bf01-e19777697a0b') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('166b29c4-d933-48c5-bbe9-fd67b5210597', '81f6f16e-9b7d-4877-bda3-8b61739b03de') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('166b29c4-d933-48c5-bbe9-fd67b5210597', '0c255912-62d6-49df-b550-1c0a9d6a83a1') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('166b29c4-d933-48c5-bbe9-fd67b5210597', 'a1d7c7cb-676f-4483-a58f-1aadf8b36ee6') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('4e7a81fe-6d37-4960-96e4-706d852d27bc', 'a62e4ba2-10ce-419d-9b99-d08063a6943b') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('4e7a81fe-6d37-4960-96e4-706d852d27bc', 'e7a89fcc-8494-4e6a-be31-200a35dce16d') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('4e7a81fe-6d37-4960-96e4-706d852d27bc', '22b1a7e2-ed63-4892-b735-1e27fe64b97b') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('4e7a81fe-6d37-4960-96e4-706d852d27bc', '1cf003c4-7c3d-4da7-8206-b359d091f320') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('26a544a3-27a6-415a-893b-702c0f204565', '77de9702-cc16-42e0-b360-1d09a933bb83') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('26a544a3-27a6-415a-893b-702c0f204565', 'd96a8352-0b30-41b3-85ae-dce02e579cf2') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('26a544a3-27a6-415a-893b-702c0f204565', 'a3b83735-cbd7-43f5-9984-753f2fa55c8f') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('26a544a3-27a6-415a-893b-702c0f204565', '85952210-8cca-4610-b066-acc7f4cdff3f') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('26a544a3-27a6-415a-893b-702c0f204565', '7182067a-0dc3-4a6c-a224-8c21cf8b59d7') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('26a544a3-27a6-415a-893b-702c0f204565', '908de6ca-7e3c-4bc5-8809-62d2fd547bd1') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('6858c255-bc44-4bac-b743-782eaa41214b', 'aabdc91e-2d8f-4b26-91c9-f29c1ce9bd41') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('6858c255-bc44-4bac-b743-782eaa41214b', 'e7a89fcc-8494-4e6a-be31-200a35dce16d') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('6858c255-bc44-4bac-b743-782eaa41214b', '81f6f16e-9b7d-4877-bda3-8b61739b03de') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('6858c255-bc44-4bac-b743-782eaa41214b', '0c255912-62d6-49df-b550-1c0a9d6a83a1') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('cc1b2aa9-7eb9-462e-9c7f-1f2fd09286f4', 'c05145b7-22ce-42b5-aa43-94b1e2e66ae6') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('cc1b2aa9-7eb9-462e-9c7f-1f2fd09286f4', '81f6f16e-9b7d-4877-bda3-8b61739b03de') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('cc1b2aa9-7eb9-462e-9c7f-1f2fd09286f4', '0c255912-62d6-49df-b550-1c0a9d6a83a1') ON CONFLICT DO NOTHING;
INSERT INTO resource_tags (resource_id, tag_id) VALUES ('cc1b2aa9-7eb9-462e-9c7f-1f2fd09286f4', '412e2167-14db-4b92-9ae7-107cde52a1b7') ON CONFLICT DO NOTHING;
