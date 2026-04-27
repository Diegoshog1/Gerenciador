# Landing Page — Diego Shogun · Casa Flamma · Viçosa-MG

Landing estática (HTML + CSS + JS, sem build) com:

- Hero editorial com tipografia forte (vibe blackwork)
- Sobre / agenda da temporada
- **Portfólio** que carrega de `assets/portfolio/manifest.json` (com lightbox)
- **Formulário de booking** com **seletor visual de parte do corpo** (frente + costas)
- Seção lojinha (em breve)
- Footer com Instagram e WhatsApp

Sem dependências, sem build. Joga num GitHub Pages, Vercel, Netlify ou qualquer servidor estático e funciona.

---

## Estrutura

```
docs/
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── js/main.js
│   └── portfolio/
│       ├── manifest.json   ← lista das fotos
│       └── *.jpg           ← coloque suas fotos aqui
└── apps-script/
    ├── Code.gs             ← cole no Google Apps Script
    └── README.md           ← passo-a-passo
```

---

## Pra deixar a página 100% funcional, faça 4 coisas:

### 1) Configure o WhatsApp e o Apps Script

Abra `docs/assets/js/main.js`, no topo:

```js
const GOOGLE_SCRIPT_URL = "";   // depois do passo 3, cola aqui
const WHATSAPP_NUMBER   = "";   // ex: "5531999999999"
```

### 2) Coloque suas fotos

Veja `assets/portfolio/README.md`. Resumindo: jogue os arquivos na pasta e edite o `manifest.json`.

### 3) Configure o Apps Script (form → planilha)

Veja `apps-script/README.md`. São ~5 minutos: criar planilha → colar `Code.gs` → publicar como Web App → copiar a URL e colar em `main.js`.

### 4) Edite as datas e textos com `data-todo`

Procure por `data-todo` no `index.html` — são os pontos que esperam input seu (datas da temporada, número do WhatsApp).

---

## Rodar localmente

Como é estático, basta servir a pasta `docs/`. Por exemplo:

```bash
# Python
cd web && python3 -m http.server 8000
# → abra http://localhost:8000

# ou Node
npx serve web
```

> Não abra `index.html` direto com `file://` — o `fetch` do `manifest.json`
> falha por CORS. Use um servidor local.

---

## Publicar

### Opção A · GitHub Pages (grátis)

1. No GitHub: `Settings` → `Pages`
2. Source: branch `claude/create-landing-page-jkdZU`, pasta `/docs`
3. Aguarde ~1min, vai publicar em `https://<usuario>.github.io/<repo>/`

### Opção B · Vercel / Netlify

- **Vercel:** `vercel --cwd web` (ou import via dashboard, root = `web`)
- **Netlify:** drag-and-drop da pasta `docs/` ou via CLI: `netlify deploy --dir=web`

### Domínio próprio

Tanto GitHub Pages quanto Vercel/Netlify aceitam custom domain (ex: `diegoshogun.com.br`). Configure um CNAME apontando pro host escolhido.
