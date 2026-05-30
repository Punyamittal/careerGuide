import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { exportRoot } from "./paths.mjs";

export const writeSchemaArtifacts = (indexes) => {
  const schemaDir = join(exportRoot, "schema");
  mkdirSync(schemaDir, { recursive: true });

  const postgres = `-- CareerGUIDE O*NET export — PostgreSQL indexing (Supabase-compatible)
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
`;

  const mongo = {
    collections: {
      occupations: {
        indexes: [
          { key: { soc_code: 1 }, unique: true },
          { key: { title: "text", description: "text" } },
          { key: { "holland_codes": 1 } },
          { key: { job_zone: 1 } }
        ]
      },
      occupation_ratings: {
        indexes: [
          { key: { soc_code: 1, domain: 1 } },
          { key: { element_id: 1 } }
        ]
      },
      alternate_titles: {
        indexes: [{ key: { soc_code: 1 } }, { key: { alternate_title: "text" } }]
      }
    },
    recommendation_pipeline: {
      vector_field: "riasec_vector",
      profile_field: "profile_v1_vector",
      match_keys: ["ria_R", "ria_I", "ria_A", "ria_S", "ria_E", "ria_C"]
    }
  };

  const diagram = `# O*NET Export Schema

\`\`\`mermaid
erDiagram
  ONET_RELEASE ||--o{ OCCUPATION : contains
  OCCUPATION ||--o{ ALTERNATE_TITLE : has
  OCCUPATION ||--o{ RATING : has
  OCCUPATION ||--o{ VECTOR : has
  OCCUPATION ||--o{ TECHNOLOGY_SKILL : uses
  OCCUPATION ||--o{ RELATED_OCCUPATION : links
  ELEMENT ||--o{ RATING : defines

  OCCUPATION {
    text soc_code PK
    text title
    text description
    int job_zone
    text classification_status
  }
  RATING {
    text element_id FK
    text scale_id
    numeric data_value
  }
  VECTOR {
    text vector_type
    jsonb vector
  }
\`\`\`

## Classification rule
Only occupations with a **RIASEC vector** (\`vector_type = riasec\`) are exported as classified/accepted — aligned with the CareerGUIDE matching engine.
`;

  writeFileSync(join(schemaDir, "postgres_indexes.sql"), postgres, "utf8");
  writeFileSync(join(schemaDir, "mongodb.json"), JSON.stringify(mongo, null, 2), "utf8");
  writeFileSync(join(exportRoot, "SCHEMA.md"), diagram, "utf8");

  const indexDir = join(exportRoot, "indexes");
  mkdirSync(indexDir, { recursive: true });
  writeFileSync(join(indexDir, "soc_index.json"), JSON.stringify(indexes, null, 2), "utf8");
};
