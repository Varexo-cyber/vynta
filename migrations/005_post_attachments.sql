-- Ondersteuning voor meerdere bijlagen per post
ALTER TABLE needs
  ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Bestaande posts met losse media-kolommen overzetten naar het nieuwe attachments-array
DO $$
DECLARE
  r RECORD;
  att JSONB := '[]'::jsonb;
  pos INT := 0;
BEGIN
  FOR r IN SELECT id, image_url, video_url, document_url FROM needs WHERE (image_url IS NOT NULL OR video_url IS NOT NULL OR document_url IS NOT NULL) AND (attachments IS NULL OR jsonb_array_length(attachments) = 0) LOOP
    att := '[]'::jsonb;
    pos := 0;
    IF r.image_url IS NOT NULL THEN
      att := att || jsonb_build_object('type','image','url',r.image_url,'filename',r.image_url,'position',pos);
      pos := pos + 1;
    END IF;
    IF r.video_url IS NOT NULL THEN
      att := att || jsonb_build_object('type','video','url',r.video_url,'filename',r.video_url,'position',pos);
      pos := pos + 1;
    END IF;
    IF r.document_url IS NOT NULL THEN
      att := att || jsonb_build_object('type','document','url',r.document_url,'filename',r.document_url,'position',pos);
      pos := pos + 1;
    END IF;
    UPDATE needs SET attachments = att WHERE id = r.id;
  END LOOP;
END $$;
