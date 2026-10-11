(function () {
  const namespace = window.EncontraPet = window.EncontraPet || {};
  const url = 'https://slkcrdyowcephpdgxydu.supabase.co';
  // Chave publishable: pública por definição. O controle de acesso fica no RLS.
  const publishableKey = 'sb_publishable_5T5iIK6-LwP5QA78GvHp0A_BGxFzI8H';
  // PKCE usa ?code= no retorno de confirmação e não conflita com as rotas #/.
  const client = window.supabase.createClient(url, publishableKey, { auth: { flowType: 'pkce' } });

  const types = { Perdido: 'perdido', Encontrado: 'encontrado' };
  const species = { Cão: 'cão', Gato: 'gato' };
  const statuses = {
    'Em busca do tutor': 'em_busca_do_tutor',
    'Aguardando identificação': 'aguardando_identificacao',
    'Pet reencontrado': 'pet_reencontrado'
  };
  const reviews = { Pendente: 'pendente', Aprovada: 'aprovada', Ocultada: 'ocultada' };
  const reverse = (map, value) => Object.keys(map).find((key) => map[key] === value);

  function fromRow(row) {
    return {
      id: row.id,
      ownerId: row.owner_id,
      type: reverse(types, row.type),
      name: row.name,
      species: reverse(species, row.species),
      color: row.color,
      location: row.neighborhood,
      date: row.occurred_on,
      status: reverse(statuses, row.status),
      reviewStatus: reverse(reviews, row.review_status),
      description: row.description,
      photo: row.image_url || ''
    };
  }

  namespace.backend = {
    client,
    fromRow,
    toInsert(form, ownerId, imageUrl, imagePath) {
      return {
        owner_id: ownerId,
        type: types[form.type],
        species: species[form.species],
        name: form.name.trim() || 'Sem nome',
        color: form.color.trim(),
        neighborhood: form.location.trim(),
        occurred_on: form.date,
        status: form.type === 'Encontrado' ? statuses['Aguardando identificação'] : statuses['Em busca do tutor'],
        review_status: 'pendente',
        description: form.description.trim(),
        image_url: imageUrl,
        image_path: imagePath
      };
    },
    statusCode: (label) => statuses[label],
    reviewCode: (label) => reviews[label]
  };
}());
