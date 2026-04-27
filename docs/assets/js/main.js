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
/* Silhueta humana com curvas anatômicas. ViewBox 240x540.
 * Pontos-chave: cabeça(50), pescoço(95), ombro(118), bicep(180),
 * cintura(260), quadril(295), joelho(395), tornozelo(490).
 * Cada região é um path fechado que segue a forma do corpo. */

const FRONT_REGIONS = [
  { id:"cabeca", label:"Cabeça",
    d:"M120,12 C148,12 158,32 158,56 C158,82 142,96 120,96 C98,96 82,82 82,56 C82,32 92,12 120,12 Z" },

  { id:"pescoco", label:"Pescoço",
    d:"M104,96 C108,108 110,112 110,120 L130,120 C130,112 132,108 136,96 C130,98 124,98 120,98 C116,98 110,98 104,96 Z" },

  { id:"ombro-esq", label:"Ombro esq.",
    d:"M136,118 C160,120 184,134 200,158 L186,178 C176,170 162,158 150,148 C144,138 140,128 136,118 Z" },
  { id:"ombro-dir", label:"Ombro dir.",
    d:"M104,118 C80,120 56,134 40,158 L54,178 C64,170 78,158 90,148 C96,138 100,128 104,118 Z" },

  { id:"peito-esq", label:"Peitoral esq.",
    d:"M120,120 L150,148 C152,162 150,178 144,192 L120,196 Z" },
  { id:"peito-dir", label:"Peitoral dir.",
    d:"M120,120 L90,148 C88,162 90,178 96,192 L120,196 Z" },

  { id:"costela-esq", label:"Costela esq.",
    d:"M144,192 C152,210 154,228 152,242 L120,246 L120,196 Z" },
  { id:"costela-dir", label:"Costela dir.",
    d:"M96,192 C88,210 86,228 88,242 L120,246 L120,196 Z" },

  { id:"abdomen", label:"Abdômen",
    d:"M88,242 L152,242 C154,260 156,278 152,294 L88,294 C84,278 86,260 88,242 Z" },

  { id:"quadril", label:"Quadril / virilha",
    d:"M88,294 L152,294 C156,308 156,318 152,326 L120,328 L88,326 C84,318 84,308 88,294 Z" },

  { id:"braco-up-esq", label:"Braço esq. (cima)",
    d:"M186,178 C196,200 198,224 196,244 L172,250 C172,228 170,206 168,188 Z" },
  { id:"braco-up-dir", label:"Braço dir. (cima)",
    d:"M54,178 C44,200 42,224 44,244 L68,250 C68,228 70,206 72,188 Z" },

  { id:"cotovelo-esq", label:"Cotovelo esq.",
    d:"M196,244 L172,250 L174,266 L196,260 Z" },
  { id:"cotovelo-dir", label:"Cotovelo dir.",
    d:"M44,244 L68,250 L66,266 L44,260 Z" },

  { id:"antebraco-esq", label:"Antebraço esq.",
    d:"M196,260 L174,266 C176,290 178,316 184,338 L204,332 C204,310 202,284 196,260 Z" },
  { id:"antebraco-dir", label:"Antebraço dir.",
    d:"M44,260 L66,266 C64,290 62,316 56,338 L36,332 C36,310 38,284 44,260 Z" },

  { id:"mao-esq", label:"Mão esq.",
    d:"M184,338 L204,332 C212,346 214,360 210,372 C204,380 192,378 184,372 C180,362 180,350 184,338 Z" },
  { id:"mao-dir", label:"Mão dir.",
    d:"M56,338 L36,332 C28,346 26,360 30,372 C36,380 48,378 56,372 C60,362 60,350 56,338 Z" },

  { id:"coxa-esq", label:"Coxa esq.",
    d:"M120,328 L152,326 C158,360 158,388 152,408 L122,408 Z" },
  { id:"coxa-dir", label:"Coxa dir.",
    d:"M120,328 L88,326 C82,360 82,388 88,408 L118,408 Z" },

  { id:"joelho-esq", label:"Joelho esq.",
    d:"M122,408 L152,408 L150,424 L122,424 Z" },
  { id:"joelho-dir", label:"Joelho dir.",
    d:"M118,408 L88,408 L90,424 L118,424 Z" },

  { id:"panturrilha-esq", label:"Panturrilha esq.",
    d:"M122,424 L150,424 C152,450 150,476 144,494 L122,494 Z" },
  { id:"panturrilha-dir", label:"Panturrilha dir.",
    d:"M118,424 L90,424 C88,450 90,476 96,494 L118,494 Z" },

  { id:"pe-esq", label:"Pé esq.",
    d:"M122,494 L144,494 C150,506 152,518 148,524 L122,524 Z" },
  { id:"pe-dir", label:"Pé dir.",
    d:"M118,494 L96,494 C90,506 88,518 92,524 L118,524 Z" },
];

const BACK_REGIONS = [
  { id:"nuca", label:"Nuca / cabeça (atrás)",
    d:"M120,12 C148,12 158,32 158,56 C158,82 142,96 120,96 C98,96 82,82 82,56 C82,32 92,12 120,12 Z" },

  { id:"pescoco-back", label:"Pescoço (atrás)",
    d:"M104,96 C108,108 110,112 110,120 L130,120 C130,112 132,108 136,96 C130,98 124,98 120,98 C116,98 110,98 104,96 Z" },

  { id:"ombro-back-esq", label:"Ombro (atrás) esq.",
    d:"M136,118 C160,120 184,134 200,158 L186,178 C176,170 162,158 150,148 C144,138 140,128 136,118 Z" },
  { id:"ombro-back-dir", label:"Ombro (atrás) dir.",
    d:"M104,118 C80,120 56,134 40,158 L54,178 C64,170 78,158 90,148 C96,138 100,128 104,118 Z" },

  { id:"costas-cima-esq", label:"Costas (cima) esq.",
    d:"M120,120 L150,148 C152,162 150,180 144,196 L120,200 Z" },
  { id:"costas-cima-dir", label:"Costas (cima) dir.",
    d:"M120,120 L90,148 C88,162 90,180 96,196 L120,200 Z" },

  { id:"costas-meio", label:"Costas (meio)",
    d:"M96,196 L144,196 L150,238 L90,238 Z" },

  { id:"lombar", label:"Lombar",
    d:"M90,238 L150,238 C152,260 152,278 148,294 L92,294 C88,278 88,260 90,238 Z" },

  { id:"triceps-esq", label:"Tríceps esq.",
    d:"M186,178 C196,200 198,224 196,244 L172,250 C172,228 170,206 168,188 Z" },
  { id:"triceps-dir", label:"Tríceps dir.",
    d:"M54,178 C44,200 42,224 44,244 L68,250 C68,228 70,206 72,188 Z" },

  { id:"cotovelo-back-esq", label:"Cotovelo (atrás) esq.",
    d:"M196,244 L172,250 L174,266 L196,260 Z" },
  { id:"cotovelo-back-dir", label:"Cotovelo (atrás) dir.",
    d:"M44,244 L68,250 L66,266 L44,260 Z" },

  { id:"antebraco-back-esq", label:"Antebraço (atrás) esq.",
    d:"M196,260 L174,266 C176,290 178,316 184,338 L204,332 C204,310 202,284 196,260 Z" },
  { id:"antebraco-back-dir", label:"Antebraço (atrás) dir.",
    d:"M44,260 L66,266 C64,290 62,316 56,338 L36,332 C36,310 38,284 44,260 Z" },

  { id:"mao-back-esq", label:"Mão (atrás) esq.",
    d:"M184,338 L204,332 C212,346 214,360 210,372 C204,380 192,378 184,372 C180,362 180,350 184,338 Z" },
  { id:"mao-back-dir", label:"Mão (atrás) dir.",
    d:"M56,338 L36,332 C28,346 26,360 30,372 C36,380 48,378 56,372 C60,362 60,350 56,338 Z" },

  { id:"gluteo-esq", label:"Glúteo esq.",
    d:"M120,294 L148,294 C156,308 156,322 150,332 L120,332 Z" },
  { id:"gluteo-dir", label:"Glúteo dir.",
    d:"M120,294 L92,294 C84,308 84,322 90,332 L120,332 Z" },

  { id:"post-coxa-esq", label:"Posterior coxa esq.",
    d:"M120,332 L150,332 C156,366 156,394 150,412 L122,412 Z" },
  { id:"post-coxa-dir", label:"Posterior coxa dir.",
    d:"M120,332 L90,332 C84,366 84,394 90,412 L118,412 Z" },

  { id:"jarrete-esq", label:"Jarrete esq.",
    d:"M122,412 L150,412 L148,428 L122,428 Z" },
  { id:"jarrete-dir", label:"Jarrete dir.",
    d:"M118,412 L90,412 L92,428 L118,428 Z" },

  { id:"post-panturrilha-esq", label:"Panturrilha (atrás) esq.",
    d:"M122,428 L148,428 C150,454 148,478 142,496 L122,496 Z" },
  { id:"post-panturrilha-dir", label:"Panturrilha (atrás) dir.",
    d:"M118,428 L92,428 C90,454 92,478 98,496 L118,496 Z" },
];

function buildBodySvg(regions, view){
  const paths = regions.map(r =>
    `<path class="bp-region" data-region="${r.id}" data-label="${r.label}" d="${r.d}"><title>${r.label}</title></path>`
  ).join("");
  // contorno externo sutil que envolve todo o corpo (decorativo, não clicável)
  const outline = `
    <path class="bp-outline" pointer-events="none"
      d="M120,12 C148,12 158,32 158,56 C158,82 142,96 120,96 C98,96 82,82 82,56 C82,32 92,12 120,12 Z
         M104,96 C108,108 110,112 110,120 C80,120 56,134 40,158 C44,200 42,224 44,244 C36,310 26,346 30,372
                  C36,380 48,378 56,372 C60,362 60,350 56,338 C64,290 68,250 68,250 C70,228 72,206 72,188
         M136,96 C132,108 130,112 130,120 C160,120 184,134 200,158 C196,200 198,224 196,244 C204,310 214,346 210,372
                  C204,380 192,378 184,372 C180,362 180,350 184,338 C176,290 172,250 172,250 C170,228 168,206 168,188
         M88,326 C82,360 82,388 88,408 C88,450 96,494 96,494 C90,506 88,518 92,524 L148,524
                  C152,518 150,506 144,494 C150,476 152,450 152,408 C158,388 158,360 152,326"/>
  `;
  return `
    <svg viewBox="0 0 240 540" xmlns="http://www.w3.org/2000/svg" role="img"
         aria-label="Selecione regiões do corpo (${view === 'front' ? 'frente' : 'costas'})">
      <g class="bp-figure-g">${paths}${outline}</g>
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
