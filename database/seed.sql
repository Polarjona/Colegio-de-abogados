INSERT INTO news (title, summary, content, source_url)
VALUES (
  'Bienvenido al Colegio de Abogados',
  'Noticias legislativas del BOE',
  'Las novedades legislativas aparecerán aquí.',
  'https://www.boe.es/'
)
ON CONFLICT DO NOTHING;