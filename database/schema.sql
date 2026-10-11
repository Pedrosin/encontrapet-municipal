-- EncontraPet Municipal
-- Modelo proposto para uma futura versão PostgreSQL; a interface atual usa localStorage.
-- Na futura integração, rótulos da interface deverão virar códigos antes da gravação:
-- Perdido/Encontrado -> perdido/encontrado;
-- Em busca do tutor/Aguardando identificação/Pet reencontrado ->
-- em_busca_do_tutor/aguardando_identificacao/pet_reencontrado;
-- Pendente/Aprovada/Ocultada -> pendente/aprovada/ocultada.

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(180) NOT NULL UNIQUE,
  profile       VARCHAR(20) NOT NULL DEFAULT 'tutor'
                CHECK (profile IN ('tutor', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE occurrences (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  type          VARCHAR(10) NOT NULL CHECK (type IN ('perdido', 'encontrado')),
  species       VARCHAR(20) NOT NULL CHECK (species IN ('cão', 'gato')),
  name          VARCHAR(120),
  color         VARCHAR(60) NOT NULL CHECK (char_length(trim(color)) > 0),
  description   VARCHAR(500),
  neighborhood  VARCHAR(100) NOT NULL,
  occurred_on   DATE NOT NULL,
  status        VARCHAR(30) NOT NULL
                CHECK (status IN ('em_busca_do_tutor', 'aguardando_identificacao', 'pet_reencontrado')),
  review_status VARCHAR(10) NOT NULL DEFAULT 'pendente'
                CHECK (review_status IN ('pendente', 'aprovada', 'ocultada')),
  image_url     TEXT,
  reported_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contact_messages (
  id              BIGSERIAL PRIMARY KEY,
  occurrence_id   BIGINT NOT NULL REFERENCES occurrences(id) ON DELETE CASCADE,
  sender_id       BIGINT REFERENCES users(id), -- opcional até haver autenticação real
  message         VARCHAR(1000) NOT NULL CHECK (char_length(trim(message)) >= 1),
  status          VARCHAR(15) NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'read', 'archived')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX occurrences_search_idx
  ON occurrences (review_status, status, type, species, neighborhood);

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
  ('Carlos Lima', 'carlos@example.org', 'tutor');

INSERT INTO occurrences
  (user_id, type, species, name, color, description, neighborhood, occurred_on, status, review_status)
VALUES
  (1, 'perdido', 'cão', 'Thor', 'Caramelo', 'Cão de porte médio usando coleira azul.', 'Centro', DATE '2026-08-29', 'em_busca_do_tutor', 'aprovada'),
  (2, 'encontrado', 'gato', NULL, 'Tigrado', 'Gato dócil encontrado próximo à praça.', 'Vila Universitária', DATE '2026-09-03', 'aguardando_identificacao', 'aprovada');

-- CONSULTAR: somente ocorrências aprovadas; os filtros reproduzem a consulta da interface.
SELECT id, type, species, name, color, neighborhood, occurred_on, status, reported_at
FROM occurrences
WHERE review_status = 'aprovada'
  AND (NULLIF(:type, '') IS NULL OR type = :type)
  AND (NULLIF(:species, '') IS NULL OR species = :species)
  AND (NULLIF(:status, '') IS NULL OR status = :status)
  AND (NULLIF(:neighborhood, '') IS NULL OR neighborhood ILIKE '%' || :neighborhood || '%')
  AND (NULLIF(:query, '') IS NULL OR
       COALESCE(name, '') ILIKE '%' || :query || '%' OR
       species ILIKE '%' || :query || '%' OR
       color ILIKE '%' || :query || '%' OR
       neighborhood ILIKE '%' || :query || '%' OR
       COALESCE(description, '') ILIKE '%' || :query || '%')
ORDER BY reported_at DESC;

-- INSERIR: nova ocorrência.
INSERT INTO occurrences
  (user_id, type, species, name, color, description, neighborhood, occurred_on, status)
VALUES
  (:user_id, :type, :species, NULLIF(:name, ''), :color, NULLIF(:description, ''), :neighborhood, :occurred_on, :status);

-- ATUALIZAR: marcar um animal como reencontrado.
UPDATE occurrences
SET status = 'pet_reencontrado'
WHERE id = :occurrence_id AND user_id = :user_id;

-- MODERAR: disponibilizar um relato na consulta pública.
UPDATE occurrences
SET review_status = 'aprovada'
WHERE id = :occurrence_id;

-- CONTATO: registrar mensagem mediada (sem publicar dados pessoais).
INSERT INTO contact_messages (occurrence_id, sender_id, message)
VALUES (:occurrence_id, :sender_id, :message);

-- REMOVER: exclusão controlada pelo responsável pelo registro.
DELETE FROM occurrences
WHERE id = :occurrence_id AND user_id = :user_id;
