/* ─── Diego Shogun · landing JS ────────────────────────────────────────────
 * - body picker (SVG frente + costas)
 * - galeria (lê assets/portfolio/manifest.json)
 * - lightbox
 * - submit do form pro Google Apps Script
 * - botão "WhatsApp" pré-preenchido
 * - reveal on scroll
 * ────────────────────────────────────────────────────────────────────────── */

/* ============================================================================
 * CONFIG — edite estas 3 constantes quando estiver pronto
 * ========================================================================== */

// Cole aqui a URL do Web App do Google Apps Script (deploy → "Anyone")
// Veja docs/apps-script/README.md
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwn7_-m61xhWZ72YuXezs0A6Pu3dzpDGPj0hu_QMz__D0rSJJ4FrSf02uC1x62otp5hMg/exec";

// Número do WhatsApp em formato internacional, sem + nem espaços (ex: 5531999999999)
const WHATSAPP_NUMBER   = "";   // TODO: preencha

// Mensagem padrão do botão WhatsApp
const WHATSAPP_DEFAULT_MSG =
  "Oi Diego! Quero reservar um slot na agenda da Casa Flamma em Viçosa-MG.";

/* ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initYear();
  initReveal();
  initBodyPicker();
  initGallery();
  initLightbox();
  initForm();
  initWhatsAppCTA();
});

/* ── Footer year ─────────────────────────────────────────────────────────── */
function initYear(){
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

/* ── Reveal on scroll ────────────────────────────────────────────────────── */
function initReveal(){
  const els = document.querySelectorAll("[data-reveal]");
  if (!("IntersectionObserver" in window)) {
    els.forEach(el => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

/* ── BODY PICKER ─────────────────────────────────────────────────────────── */
/* Diagrama anatômico estilo manual médico.
 * ViewBox 280x600. Pontos-chave:
 *   cabeça(50), pescoço(102), ombro(122), bicep(170),
 *   peito(160), umbigo(240), quadril(290), joelho(440), tornozelo(530)
 *
 * Estrutura por view:
 *   base   = silhueta cinza (não clicável): cabeça, pescoço, mãos, pés, contorno
 *   muscle = grupos musculares (clicáveis em laranja)
 *   lines  = traços internos decorativos (divisão de abs, etc)
 */

// Silhueta principal (gray fill) — desenhada uma vez por view
const FRONT_SILHOUETTE = `
  M140,14 C170,14 180,30 180,54 C180,80 164,92 140,92 C116,92 100,80 100,54 C100,30 110,14 140,14 Z
  M124,92 L156,92 L172,116 L108,116 Z
  M172,116 C200,118 226,130 234,156 C236,176 234,200 232,222 C234,248 232,278 226,308
           C230,328 234,348 234,360 C240,378 238,396 230,404 C222,410 210,408 206,400
           C202,388 200,372 198,360 L194,330 L188,266 C186,242 182,222 178,210 L172,196
           L168,196 L172,212 C176,234 178,256 178,270 C180,294 184,318 184,326
           C184,360 188,400 186,432 L184,448 C182,476 184,506 182,528 C184,540 184,556 180,564
           L156,564 L156,540 C156,512 154,476 154,440 L154,326 L140,326 L140,318
           L156,318 L156,116 Z
  M108,116 C80,118 54,130 46,156 C44,176 46,200 48,222 C46,248 48,278 54,308
           C50,328 46,348 46,360 C40,378 42,396 50,404 C58,410 70,408 74,400
           C78,388 80,372 82,360 L86,330 L92,266 C94,242 98,222 102,210 L108,196
           L112,196 L108,212 C104,234 102,256 102,270 C100,294 96,318 96,326
           C96,360 92,400 94,432 L96,448 C98,476 96,506 98,528 C96,540 96,556 100,564
           L124,564 L124,540 C124,512 126,476 126,440 L126,326 L140,326 L140,318
           L124,318 L124,116 Z
`;

// Mãos e pés (gray, fora do silhouette pra ter borda própria)
const FRONT_EXTRAS = `
  <!-- mão direita -->
  <path class="bp-base bp-base--gray" d="M210,400 C222,400 234,406 240,418 C242,428 240,440 232,446 C220,450 208,446 204,438 C198,432 200,420 204,410 Z"/>
  <!-- mão esquerda -->
  <path class="bp-base bp-base--gray" d="M70,400 C58,400 46,406 40,418 C38,428 40,440 48,446 C60,450 72,446 76,438 C82,432 80,420 76,410 Z"/>
  <!-- pé direito -->
  <path class="bp-base bp-base--gray" d="M156,564 L194,564 C212,566 218,576 214,584 L156,584 Z"/>
  <!-- pé esquerdo -->
  <path class="bp-base bp-base--gray" d="M124,564 L86,564 C68,566 62,576 66,584 L124,584 Z"/>
`;

// Linhas internas decorativas (definição muscular)
const FRONT_LINES = `
  <!-- linha do esterno -->
  <path d="M140,124 L140,210" />
  <!-- divisões do abdômen (6-pack) -->
  <path d="M140,210 L140,290" />
  <path d="M122,232 L158,232" />
  <path d="M122,254 L158,254" />
  <path d="M122,276 L158,276" />
  <!-- linha alba inferior -->
  <path d="M140,290 L140,316" />
  <!-- inguinal -->
  <path d="M118,308 L140,326 L162,308" />
`;

// Grupos musculares clicáveis (frente)
const FRONT_REGIONS = [
  { id:"trapezio-frente", label:"Trapézio",
    d:"M124,116 L156,116 L172,128 L168,134 C158,128 152,126 140,126 C128,126 122,128 112,134 L108,128 Z" },

  { id:"deltoide-esq", label:"Deltoide esq.",
    d:"M172,128 C200,134 222,148 232,170 C228,180 220,184 210,182 C198,176 188,164 174,148 L168,134 Z" },
  { id:"deltoide-dir", label:"Deltoide dir.",
    d:"M108,128 C80,134 58,148 48,170 C52,180 60,184 70,182 C82,176 92,164 106,148 L112,134 Z" },

  { id:"peitoral-esq", label:"Peitoral esq.",
    d:"M140,126 C158,128 174,140 182,156 C186,170 184,186 178,196 C168,206 154,210 140,208 Z" },
  { id:"peitoral-dir", label:"Peitoral dir.",
    d:"M140,126 C122,128 106,140 98,156 C94,170 96,186 102,196 C112,206 126,210 140,208 Z" },

  { id:"biceps-esq", label:"Bíceps esq.",
    d:"M210,182 C222,196 226,216 224,236 C218,244 210,246 200,242 C194,228 192,212 192,196 C194,188 200,184 210,182 Z" },
  { id:"biceps-dir", label:"Bíceps dir.",
    d:"M70,182 C58,196 54,216 56,236 C62,244 70,246 80,242 C86,228 88,212 88,196 C86,188 80,184 70,182 Z" },

  { id:"antebraco-esq", label:"Antebraço esq.",
    d:"M224,236 C230,256 232,280 232,304 C230,322 226,338 220,348 C212,346 206,338 204,326 L200,242 C210,246 218,244 224,236 Z" },
  { id:"antebraco-dir", label:"Antebraço dir.",
    d:"M56,236 C50,256 48,280 48,304 C50,322 54,338 60,348 C68,346 74,338 76,326 L80,242 C70,246 62,244 56,236 Z" },

  { id:"abdomen", label:"Abdômen (reto)",
    d:"M118,210 L162,210 C164,228 166,250 164,272 C162,286 158,296 156,302 L124,302 C122,296 118,286 116,272 C114,250 116,228 118,210 Z" },

  { id:"obliquo-esq", label:"Oblíquo esq.",
    d:"M162,210 C172,222 176,242 174,266 L168,294 C164,288 162,278 160,272 C162,250 164,228 162,210 Z" },
  { id:"obliquo-dir", label:"Oblíquo dir.",
    d:"M118,210 C108,222 104,242 106,266 L112,294 C116,288 118,278 120,272 C118,250 116,228 118,210 Z" },

  { id:"quadriceps-esq", label:"Quadríceps esq.",
    d:"M154,326 C172,330 184,360 186,400 L184,438 L156,438 C154,420 154,400 154,380 Z" },
  { id:"quadriceps-dir", label:"Quadríceps dir.",
    d:"M126,326 C108,330 96,360 94,400 L96,438 L124,438 C126,420 126,400 126,380 Z" },

  { id:"joelho-frente-esq", label:"Joelho esq.",
    d:"M156,438 L184,438 L182,458 L156,458 Z" },
  { id:"joelho-frente-dir", label:"Joelho dir.",
    d:"M124,438 L96,438 L98,458 L124,458 Z" },

  { id:"canela-esq", label:"Canela esq. (tibial)",
    d:"M156,458 L182,458 C184,486 184,514 180,536 L156,536 Z" },
  { id:"canela-dir", label:"Canela dir. (tibial)",
    d:"M124,458 L98,458 C96,486 96,514 100,536 L124,536 Z" },
];

// ───────────────────────────────────────────────────────────────────────
// BACK
// ───────────────────────────────────────────────────────────────────────

const BACK_SILHOUETTE = FRONT_SILHOUETTE;  // mesma silhueta externa

const BACK_EXTRAS = `
  <path class="bp-base bp-base--gray" d="M210,400 C222,400 234,406 240,418 C242,428 240,440 232,446 C220,450 208,446 204,438 C198,432 200,420 204,410 Z"/>
  <path class="bp-base bp-base--gray" d="M70,400 C58,400 46,406 40,418 C38,428 40,440 48,446 C60,450 72,446 76,438 C82,432 80,420 76,410 Z"/>
  <path class="bp-base bp-base--gray" d="M156,564 L194,564 C212,566 218,576 214,584 L156,584 Z"/>
  <path class="bp-base bp-base--gray" d="M124,564 L86,564 C68,566 62,576 66,584 L124,584 Z"/>
`;

const BACK_LINES = `
  <!-- coluna -->
  <path d="M140,116 L140,326" />
  <!-- linha do trapézio -->
  <path d="M108,128 L140,180 L172,128" />
  <!-- divisão glúteos -->
  <path d="M140,326 L140,360" />
`;

const BACK_REGIONS = [
  { id:"trapezio", label:"Trapézio",
    d:"M124,116 L156,116 L172,128 L172,160 C168,180 154,200 140,212 C126,200 112,180 108,160 L108,128 Z" },

  { id:"deltoide-back-esq", label:"Deltoide (atrás) esq.",
    d:"M172,128 C200,134 222,148 232,170 C228,180 220,184 210,182 C198,176 188,164 174,148 L172,128 Z" },
  { id:"deltoide-back-dir", label:"Deltoide (atrás) dir.",
    d:"M108,128 C80,134 58,148 48,170 C52,180 60,184 70,182 C82,176 92,164 106,148 L108,128 Z" },

  { id:"triceps-esq", label:"Tríceps esq.",
    d:"M210,182 C222,196 226,216 224,236 C218,244 210,246 200,242 C194,228 192,212 192,196 C194,188 200,184 210,182 Z" },
  { id:"triceps-dir", label:"Tríceps dir.",
    d:"M70,182 C58,196 54,216 56,236 C62,244 70,246 80,242 C86,228 88,212 88,196 C86,188 80,184 70,182 Z" },

  { id:"antebraco-back-esq", label:"Antebraço (atrás) esq.",
    d:"M224,236 C230,256 232,280 232,304 C230,322 226,338 220,348 C212,346 206,338 204,326 L200,242 C210,246 218,244 224,236 Z" },
  { id:"antebraco-back-dir", label:"Antebraço (atrás) dir.",
    d:"M56,236 C50,256 48,280 48,304 C50,322 54,338 60,348 C68,346 74,338 76,326 L80,242 C70,246 62,244 56,236 Z" },

  { id:"latissimo-esq", label:"Latíssimo esq.",
    d:"M172,160 C188,180 194,210 192,238 L184,260 C176,254 168,238 164,220 C166,200 170,180 172,160 Z" },
  { id:"latissimo-dir", label:"Latíssimo dir.",
    d:"M108,160 C92,180 86,210 88,238 L96,260 C104,254 112,238 116,220 C114,200 110,180 108,160 Z" },

  { id:"costas-meio", label:"Costas (meio)",
    d:"M118,212 L162,212 C164,232 164,252 162,268 L118,268 C116,252 116,232 118,212 Z" },

  { id:"lombar", label:"Lombar",
    d:"M118,268 L162,268 C164,286 164,304 160,318 L120,318 C116,304 116,286 118,268 Z" },

  { id:"gluteo-esq", label:"Glúteo esq.",
    d:"M140,318 L160,318 C172,326 178,344 174,360 L156,372 C148,366 144,354 140,344 Z" },
  { id:"gluteo-dir", label:"Glúteo dir.",
    d:"M140,318 L120,318 C108,326 102,344 106,360 L124,372 C132,366 136,354 140,344 Z" },

  { id:"hamstring-esq", label:"Hamstring esq.",
    d:"M156,372 L184,376 C188,400 188,424 184,440 L156,440 C154,420 154,400 156,372 Z" },
  { id:"hamstring-dir", label:"Hamstring dir.",
    d:"M124,372 L96,376 C92,400 92,424 96,440 L124,440 C126,420 126,400 124,372 Z" },

  { id:"joelho-back-esq", label:"Joelho (atrás) esq.",
    d:"M156,440 L184,440 L182,458 L156,458 Z" },
  { id:"joelho-back-dir", label:"Joelho (atrás) dir.",
    d:"M124,440 L96,440 L98,458 L124,458 Z" },

  { id:"panturrilha-esq", label:"Panturrilha esq.",
    d:"M156,458 L182,458 C184,486 184,514 180,536 L156,536 Z" },
  { id:"panturrilha-dir", label:"Panturrilha dir.",
    d:"M124,458 L98,458 C96,486 96,514 100,536 L124,536 Z" },
];

function buildBodySvg(regions, view){
  const silhouette = view === "front" ? FRONT_SILHOUETTE : BACK_SILHOUETTE;
  const extras    = view === "front" ? FRONT_EXTRAS    : BACK_EXTRAS;
  const lines     = view === "front" ? FRONT_LINES     : BACK_LINES;

  const muscles = regions.map(r =>
    `<path class="bp-region" data-region="${r.id}" data-label="${r.label}" d="${r.d}"><title>${r.label}</title></path>`
  ).join("");

  return `
    <svg viewBox="0 0 280 600" xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="Selecione regiões do corpo (${view === 'front' ? 'frente' : 'costas'})">
      <g class="bp-base-g">
        <path class="bp-base" d="${silhouette}"/>
        ${extras}
      </g>
      <g class="bp-muscles-g">${muscles}</g>
      <g class="bp-lines-g" pointer-events="none">${lines}</g>
    </svg>
  `;
}

const BP_STATE = new Set(); // ids selecionados

function initBodyPicker(){
  const front = document.getElementById("bp-front");
  const back  = document.getElementById("bp-back");
  if (!front || !back) return;

  front.innerHTML = buildBodySvg(FRONT_REGIONS, "front");
  back.innerHTML  = buildBodySvg(BACK_REGIONS, "back");

  // Tabs
  document.querySelectorAll(".bp-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      document.querySelectorAll(".bp-tab").forEach(b => b.classList.toggle("is-active", b.dataset.view === view));
      document.querySelectorAll(".bp-figure").forEach(f => f.classList.toggle("is-active", f.dataset.view === view));
    });
  });

  // Click nas regiões
  document.querySelectorAll(".bp-region").forEach(el => {
    el.addEventListener("click", () => toggleRegion(el));
  });
}

function toggleRegion(el){
  const id = el.dataset.region;
  const label = el.dataset.label;
  // Atualiza visualmente AMBAS as views se o id for igual (mesmo label entre frente/costas)
  // — mas nossos ids são distintos, então só atualizamos o clicado
  if (BP_STATE.has(id)){
    BP_STATE.delete(id);
    el.classList.remove("is-on");
  } else {
    BP_STATE.add(id);
    el.classList.add("is-on");
  }
  renderSelected();
}

function renderSelected(){
  const ul = document.getElementById("bp-selected");
  const hidden = document.getElementById("parte_do_corpo");
  if (!ul || !hidden) return;

  if (BP_STATE.size === 0){
    ul.innerHTML = `<li class="bodypicker__empty">nenhuma região marcada</li>`;
    hidden.value = "";
    return;
  }

  // mapeia ids → labels (procurando nas duas listas)
  const all = [...FRONT_REGIONS, ...BACK_REGIONS];
  const labels = [...BP_STATE].map(id => {
    const r = all.find(x => x.id === id);
    return r ? r.label : id;
  });

  ul.innerHTML = labels.map((label, i) => {
    const id = [...BP_STATE][i];
    return `<li>${label}<button type="button" aria-label="Remover" data-remove="${id}">×</button></li>`;
  }).join("");

  ul.querySelectorAll("button[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.remove;
      BP_STATE.delete(id);
      const el = document.querySelector(`.bp-region[data-region="${id}"]`);
      if (el) el.classList.remove("is-on");
      renderSelected();
    });
  });

  hidden.value = labels.join(", ");
}

/* ── GALLERY ─────────────────────────────────────────────────────────────── */

async function initGallery(){
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  let manifest = [];
  try{
    const res = await fetch("assets/portfolio/manifest.json", { cache: "no-cache" });
    if (res.ok) manifest = await res.json();
  }catch(e){
    console.warn("Sem manifest.json — galeria vazia.");
  }

  if (!manifest.length){
    gallery.innerHTML = `
      <div class="gallery__empty">
        <p>Galeria vazia.</p>
        <p>Coloque fotos em <code>docs/assets/portfolio/</code> e liste em <code>manifest.json</code>.</p>
      </div>`;
    return;
  }

  // Padrão de tamanhos pra grid editorial: l, m, m, s, s, l, m, ...
  const sizes = ["size-l","size-m","size-m","size-s","size-s","size-l","size-m","size-s","size-m","size-l","size-s","size-s"];

  gallery.innerHTML = manifest.map((p, i) => {
    const cls = sizes[i % sizes.length];
    const cap = p.caption ? `<div class="tile__caption">${escapeHtml(p.caption)}</div>` : "";
    return `
      <figure class="tile ${cls}" data-full="assets/portfolio/${escapeAttr(p.src)}">
        <img src="assets/portfolio/${escapeAttr(p.src)}" alt="${escapeAttr(p.alt || p.caption || 'Tatuagem por Diego Shogun')}" loading="lazy" />
        ${cap}
      </figure>
    `;
  }).join("");
}

/* ── LIGHTBOX ────────────────────────────────────────────────────────────── */

function initLightbox(){
  const gallery = document.getElementById("gallery");
  if (!gallery) return;

  // monta lightbox lazy
  let lb;
  function ensureLB(){
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `
      <button class="lightbox__close" aria-label="Fechar">×</button>
      <img alt="" />
    `;
    document.body.appendChild(lb);
    lb.addEventListener("click", (e) => {
      if (e.target === lb || e.target.classList.contains("lightbox__close")) {
        lb.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") lb.classList.remove("is-open");
    });
    return lb;
  }

  gallery.addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    const src = tile.dataset.full;
    if (!src) return;
    const box = ensureLB();
    box.querySelector("img").src = src;
    box.classList.add("is-open");
  });
}

/* ── FORM SUBMIT ─────────────────────────────────────────────────────────── */

function initForm(){
  const form = document.getElementById("booking-form");
  if (!form) return;

  const status = document.getElementById("form-status");
  const submit = document.getElementById("form-submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // honeypot
    if (form.elements["website"] && form.elements["website"].value) return;

    if (!form.reportValidity()) return;

    if (BP_STATE.size === 0){
      status.textContent = "Marque ao menos uma região do corpo.";
      status.className = "form__status is-err";
      document.querySelector(".bodypicker")?.scrollIntoView({ behavior:"smooth", block:"center" });
      return;
    }

    const data = collectFormData(form);

    submit.disabled = true;
    status.textContent = "Enviando…";
    status.className = "form__status";

    try{
      if (!GOOGLE_SCRIPT_URL){
        // modo "preview": ainda não configurado
        console.log("[booking] payload:", data);
        await delay(700);
        status.textContent = "Preview OK — falta configurar GOOGLE_SCRIPT_URL em assets/js/main.js (veja docs/apps-script/README.md).";
        status.className = "form__status is-ok";
        return;
      }

      // POST como text/plain pra evitar preflight CORS no Apps Script
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false){
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      status.textContent = "Recebido — respondo no WhatsApp em até 48h.";
      status.className = "form__status is-ok";
      form.reset();
      BP_STATE.clear();
      renderSelected();
      document.querySelectorAll(".bp-region.is-on").forEach(r => r.classList.remove("is-on"));
    }catch(err){
      console.error(err);
      status.textContent = "Falha ao enviar. Tenta de novo, ou chama no WhatsApp.";
      status.className = "form__status is-err";
    }finally{
      submit.disabled = false;
    }
  });
}

function collectFormData(form){
  const fd = new FormData(form);
  const data = {};
  for (const [k,v] of fd.entries()){
    if (k === "website") continue; // honeypot
    data[k] = v;
  }
  data.parte_do_corpo = document.getElementById("parte_do_corpo")?.value || "";
  data.timestamp_iso  = new Date().toISOString();
  data.url            = location.href;
  data.user_agent     = navigator.userAgent;
  return data;
}

/* ── WhatsApp CTA ────────────────────────────────────────────────────────── */

function initWhatsAppCTA(){
  const a = document.getElementById("form-wa");
  if (!a) return;
  if (!WHATSAPP_NUMBER){
    a.href = "#";
    a.title = "Configure WHATSAPP_NUMBER em assets/js/main.js";
    return;
  }
  a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MSG)}`;

  // E também os links wa.me do footer
  document.querySelectorAll('a[data-todo="whatsapp"]').forEach(el => {
    el.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  });
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
function delay(ms){ return new Promise(r => setTimeout(r, ms)); }
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;",
  }[c]));
}
function escapeAttr(s){ return escapeHtml(s); }
