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
// Veja web/apps-script/README.md
const GOOGLE_SCRIPT_URL = "";   // ex: "https://script.google.com/macros/s/AKfy.../exec"

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

const FRONT_REGIONS = [
  { id:"cabeca",         label:"Cabeça",            d:"M94,18 h32 a14,14 0 0 1 14,14 v22 a14,14 0 0 1 -14,14 h-32 a14,14 0 0 1 -14,-14 v-22 a14,14 0 0 1 14,-14 z" },
  { id:"pescoco",        label:"Pescoço",           d:"M100,68 h20 v10 h-20 z" },
  { id:"ombro-esq",      label:"Ombro esq.",        d:"M40,82 l28,-2 l4,18 l-30,4 z" },
  { id:"ombro-dir",      label:"Ombro dir.",        d:"M180,82 l-28,-2 l-4,18 l30,4 z" },
  { id:"peito",          label:"Peito",             d:"M72,80 h76 l4,40 h-84 z" },
  { id:"costela-esq",    label:"Costela esq.",      d:"M68,120 h22 v36 h-26 z" },
  { id:"costela-dir",    label:"Costela dir.",      d:"M152,120 h-22 v36 h26 z" },
  { id:"abdomen",        label:"Abdômen",           d:"M90,120 h40 l-2,46 h-36 z" },
  { id:"braco-up-esq",   label:"Braço esq. (cima)", d:"M30,102 h26 l-2,52 h-30 z" },
  { id:"braco-up-dir",   label:"Braço dir. (cima)", d:"M190,102 h-26 l2,52 h30 z" },
  { id:"antebraco-esq",  label:"Antebraço esq.",    d:"M22,156 h32 l-2,58 h-34 z" },
  { id:"antebraco-dir",  label:"Antebraço dir.",    d:"M198,156 h-32 l2,58 h34 z" },
  { id:"mao-esq",        label:"Mão esq.",          d:"M16,216 h36 v28 h-36 z" },
  { id:"mao-dir",        label:"Mão dir.",          d:"M204,216 h-36 v28 h36 z" },
  { id:"coxa-esq",       label:"Coxa esq.",         d:"M68,170 h40 l-2,90 h-42 z" },
  { id:"coxa-dir",       label:"Coxa dir.",         d:"M152,170 h-40 l2,90 h42 z" },
  { id:"joelho-esq",     label:"Joelho esq.",       d:"M64,260 h42 v14 h-42 z" },
  { id:"joelho-dir",     label:"Joelho dir.",       d:"M156,260 h-42 v14 h42 z" },
  { id:"panturrilha-esq",label:"Panturrilha esq.",  d:"M66,274 h40 l-2,80 h-40 z" },
  { id:"panturrilha-dir",label:"Panturrilha dir.",  d:"M154,274 h-40 l2,80 h40 z" },
  { id:"pe-esq",         label:"Pé esq.",           d:"M62,354 h44 v22 h-46 z" },
  { id:"pe-dir",         label:"Pé dir.",           d:"M158,354 h-44 v22 h46 z" },
];

const BACK_REGIONS = [
  { id:"nuca",                 label:"Nuca",                  d:"M94,18 h32 a14,14 0 0 1 14,14 v22 a14,14 0 0 1 -14,14 h-32 a14,14 0 0 1 -14,-14 v-22 a14,14 0 0 1 14,-14 z" },
  { id:"pescoco-back",         label:"Pescoço (atrás)",       d:"M100,68 h20 v10 h-20 z" },
  { id:"ombro-back-esq",       label:"Ombro (costas) esq.",   d:"M40,82 l28,-2 l4,18 l-30,4 z" },
  { id:"ombro-back-dir",       label:"Ombro (costas) dir.",   d:"M180,82 l-28,-2 l-4,18 l30,4 z" },
  { id:"costas-cima",          label:"Costas (cima)",         d:"M72,80 h76 l4,46 h-84 z" },
  { id:"costas-baixo",         label:"Costas (baixo) / lombar",d:"M70,126 h80 l-4,40 h-72 z" },
  { id:"triceps-esq",          label:"Tríceps esq.",          d:"M30,102 h26 l-2,52 h-30 z" },
  { id:"triceps-dir",          label:"Tríceps dir.",          d:"M190,102 h-26 l2,52 h30 z" },
  { id:"antebraco-back-esq",   label:"Antebraço (atrás) esq.",d:"M22,156 h32 l-2,58 h-34 z" },
  { id:"antebraco-back-dir",   label:"Antebraço (atrás) dir.",d:"M198,156 h-32 l2,58 h34 z" },
  { id:"gluteo",               label:"Glúteo",                d:"M74,166 h72 l-2,42 h-68 z" },
  { id:"post-coxa-esq",        label:"Posterior coxa esq.",   d:"M70,208 h38 l-2,80 h-40 z" },
  { id:"post-coxa-dir",        label:"Posterior coxa dir.",   d:"M150,208 h-38 l2,80 h40 z" },
  { id:"post-panturrilha-esq", label:"Panturrilha (atrás) esq.",d:"M68,288 h40 l-2,80 h-42 z" },
  { id:"post-panturrilha-dir", label:"Panturrilha (atrás) dir.",d:"M152,288 h-40 l2,80 h42 z" },
];

function buildBodySvg(regions){
  // viewBox padronizado
  const paths = regions.map(r =>
    `<path class="bp-region" data-region="${r.id}" data-label="${r.label}" d="${r.d}"><title>${r.label}</title></path>`
  ).join("");
  return `
    <svg viewBox="0 0 220 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Selecione regiões do corpo">
      ${paths}
    </svg>
  `;
}

const BP_STATE = new Set(); // ids selecionados

function initBodyPicker(){
  const front = document.getElementById("bp-front");
  const back  = document.getElementById("bp-back");
  if (!front || !back) return;

  front.innerHTML = buildBodySvg(FRONT_REGIONS);
  back.innerHTML  = buildBodySvg(BACK_REGIONS);

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
        <p>Coloque fotos em <code>web/assets/portfolio/</code> e liste em <code>manifest.json</code>.</p>
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
        status.textContent = "Preview OK — falta configurar GOOGLE_SCRIPT_URL em assets/js/main.js (veja web/apps-script/README.md).";
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
