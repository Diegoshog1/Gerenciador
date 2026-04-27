# Portfolio · Diego Shogun

Coloque as fotos das tatuagens nesta pasta e liste-as em `manifest.json`.

## Como adicionar uma nova foto

1. Salve a imagem nesta pasta — ex: `docs/assets/portfolio/07.jpg`.
   - Use JPG/WEBP otimizados (cada arquivo idealmente abaixo de 400KB).
   - Pode usar [squoosh.app](https://squoosh.app) ou [tinypng.com](https://tinypng.com) pra comprimir.

2. Edite `manifest.json` e adicione um item:
   ```json
   { "src": "07.jpg", "alt": "Blackwork — peça nova", "caption": "Blackwork · perna" }
   ```
   - `src`     — nome do arquivo nesta pasta
   - `alt`     — descrição para acessibilidade / SEO
   - `caption` — texto que aparece no hover (opcional)

3. Commit e push. Pronto.

> Dica: a galeria distribui automaticamente as fotos em tamanhos `large/medium/small`
> seguindo o padrão `L M M S S L M S M L S S`. Coloque suas fotos mais fortes nas
> posições 1, 6 e 10 (que viram tiles grandes).
