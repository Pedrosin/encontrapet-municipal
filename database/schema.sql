-- EncontraPet Municipal
-- Esquema relacional compatível com PostgreSQL

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL UNIQUE,
  profile       VARCHAR(20) NOT NULL DEFAULT 'tutor'
                CHECK (profile IN ('tutor', 'finder', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE occurrences (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  type          VARCHAR(10) NOT NULL CHECK (type IN ('perdido', 'achado')),
  species       VARCHAR(20) NOT NULL CHECK (species IN ('cão', 'gato', 'outro')),
  name          VARCHAR(120),
  description   TEXT NOT NULL CHECK (char_length(trim(description)) >= 10),
  neighborhood  VARCHAR(100) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'em_busca'
                CHECK (status IN ('em_busca', 'localizado', 'encerrado')),
  image_url     TEXT,
  reported_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_messages (
  id              BIGSERIAL PRIMARY KEY,
  occurrence_id   BIGINT NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  sender_id       BIGINT NOT NULL REFERENCES users(id),
  message         VARCHAR(1000) NOT NULL CHECK (char_length(trim(message)) >= 5),
  status          VARCHAR(15) NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'read', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX occurrences_search_idx
  ON occurrences (status, type, species, neighborhood);

CREATE INDEX contact_messages_occurrence_idx
  ON contact_messages (occurrence_id, created_at DESC);

-- Atualiza automaticamente a data de alteração do registro.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER occurrences_set_updated_at
BEFORE UPDATE ON occurrences
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Dados iniciais para demonstração e testes.
INSERT INTO users (name, email, profile) VALUES
  ('Ana Souza', 'ana@example.org', 'tutor'),
  ('Carlos Lima', 'carlos@example.org', 'finder');

INSERT INTO occurrences
  (user_id, type, species, name, description, neighborhood, status)
VALUES
  (1, 'perdido', 'cão', 'Thor', 'Cão caramelo, porte médio, usando coleira azul.', 'Centro', 'em_busca'),
  (2, 'achado', 'gato', NULL, 'Gato tigrado, dócil, encontrado próximo à praça.', 'Vila Universitária', 'em_busca');

-- CONSULTAR: ocorrências abertas com filtros opcionais.
SELECT id, type, species, name, neighborhood, status, reported_at
FROM occurrences
WHERE status = 'em_busca'
  AND (NULLIF(:type, '') IS NULL OR type = :type)
  AND (NULLIF(:species, '') IS NULL OR species = :species)
  AND (NULLIF(:neighborhood, '') IS NULL OR neighborhood ILIKE '%' || :neighborhood || '%')
ORDER BY reported_at DESC;

-- INSERIR: nova ocorrência.
INSERT INTO occurrences
  (user_id, type, species, name, description, neighborhood)
VALUES
  (:user_id, :type, :species, NULLIF(:name, ''), :description, :neighborhood);

-- ATUALIZAR: marcar um animal como localizado.
UPDATE occurrences
SET status = 'localizado'
WHERE id = :occurrence_id AND user_id = :user_id;

-- REMOVER: exclusão controlada pelo responsável pelo registro.
DELETE FROM occurrences
WHERE id = :occurrence_id AND user_id = :user_id;

