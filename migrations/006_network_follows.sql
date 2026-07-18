-- Scheid "lid zijn van netwerk" van "netwerk volgen"
CREATE TABLE IF NOT EXISTS network_follows (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  network_id TEXT REFERENCES networks(id) ON DELETE CASCADE,
  followed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (company_id, network_id)
);

CREATE INDEX IF NOT EXISTS idx_network_follows_company ON network_follows(company_id);
CREATE INDEX IF NOT EXISTS idx_network_follows_network ON network_follows(network_id);
