-- Normaliseer bijlagen: elk bestand krijgt een eigen rij met metadata.
CREATE TABLE IF NOT EXISTS post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  mime_type TEXT,
  original_name TEXT,
  order_index INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  width INT,
  height INT,
  duration INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_post_attachments_post ON post_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_attachments_order ON post_attachments(post_id, order_index);

-- Overzetten bestaande bijlagen uit de JSONB attachments kolom.
INSERT INTO post_attachments (
  post_id, file_url, file_type, mime_type, original_name, order_index, is_primary
)
SELECT
  n.id AS post_id,
  (a->>'url') AS file_url,
  (a->>'type') AS file_type,
  (a->>'mimeType') AS mime_type,
  (a->>'filename') AS original_name,
  COALESCE((a->>'position')::int, ord - 1) AS order_index,
  (ord - 1) = 0 AS is_primary
FROM needs n
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(n.attachments, '[]'::jsonb)) WITH ORDINALITY AS t(a, ord)
WHERE jsonb_typeof(n.attachments) = 'array' AND a->>'url' IS NOT NULL
ON CONFLICT DO NOTHING;

-- Behoud de JSONB kolom terug voor concepten/legacy, maar gebruik de tabel als bron van waarheid.
