-- Unieke weergaves per post per bedrijf
CREATE TABLE IF NOT EXISTS post_views (
  post_id UUID REFERENCES needs(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (post_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_post_views_company ON post_views(company_id);
CREATE INDEX IF NOT EXISTS idx_post_views_post ON post_views(post_id);
