-- CareerGUIDE O*NET export — PostgreSQL indexing (Supabase-compatible)
CREATE INDEX IF NOT EXISTS idx_onet_export_occupations_title ON onet_occupations (release_id, title);
CREATE INDEX IF NOT EXISTS idx_onet_export_occupations_soc ON onet_occupations (soc_code);
CREATE INDEX IF NOT EXISTS idx_onet_export_ratings_soc_domain ON onet_occupation_ratings (release_id, soc_code);
CREATE INDEX IF NOT EXISTS idx_onet_export_alt_title_soc ON onet_alternate_titles (release_id, soc_code);
CREATE INDEX IF NOT EXISTS idx_onet_export_vectors_type ON onet_occupation_vectors (release_id, vector_type);

-- Materialized view suggestion for classified catalog
-- CREATE MATERIALIZED VIEW onet_classified_catalog AS
-- SELECT o.soc_code, o.title, v.vector AS riasec_vector
-- FROM onet_occupations o
-- JOIN onet_occupation_vectors v ON v.release_id = o.release_id AND v.soc_code = o.soc_code
-- WHERE v.vector_type = 'riasec';
