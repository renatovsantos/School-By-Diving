/* Configuração: coloque o número de WhatsApp da escola com país e DDD, só dígitos (ex.: "5511900000000"). */
const CONTACT = { whatsapp: "5511969791664" };

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const VIEWS = ["inicio", "como-funciona"];

/* Medidor de profundidade */
let ticking = false;
function updateDepth() {
  ticking = false;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  const d = Math.round(p * 40);
  $("#pill-read").textContent = d + " m";
  $("#gauge-read").textContent = d + " m";
  $("#bar-read").textContent = d + " m";
  $("#gauge-dot").style.top = "calc(1.1rem + (100% - 2.2rem) * " + p.toFixed(4) + ")";
}
function queueDepth() { if (!ticking) { ticking = true; requestAnimationFrame(updateDepth); } }
window.addEventListener("scroll", queueDepth, { passive: true });
window.addEventListener("resize", queueDepth);

/* Barra de ação no celular: some quando o formulário está visível */
const mobileBar = $("#mobile-cta");
let formVisible = false;
function syncBar() {
  const onHome = !$("[data-view='inicio']").hidden;
  mobileBar.classList.toggle("is-hidden", onHome && formVisible);
}
if ("IntersectionObserver" in window) {
  new IntersectionObserver((entries) => { formVisible = entries[0].isIntersecting; syncBar(); }, { threshold: 0.1 }).observe($("#agendar"));
} else {
  formVisible = false;
}

/* Navegação entre as duas páginas */
function show(name, keepScroll) {
  if (VIEWS.indexOf(name) < 0) name = "inicio";
  $$("[data-view]").forEach((v) => { v.hidden = v.dataset.view !== name; });
  $$("[data-nav]").forEach((a) => {
    if (a.closest(".nav")) {
      if (a.dataset.nav === name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    }
  });
  if (!keepScroll) window.scrollTo(0, 0);
  syncBar();
  queueDepth();
}
$$("[data-nav]").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  show(a.dataset.nav);
  try { history.replaceState(null, "", "#" + a.dataset.nav); } catch (err) {}
}));
$$("[data-goto='agendar']").forEach((a) => a.addEventListener("click", (e) => {
  e.preventDefault();
  show("inicio", true);
  const card = $("#agendar");
  card.scrollIntoView({ block: "center" });
  const nome = $("#nome");
  if (nome && !$("[data-form-state='form']").hidden) nome.focus({ preventScroll: true });
}));
window.addEventListener("hashchange", () => show(location.hash.slice(1)));
show(location.hash.slice(1), true);

/* Anatomia da aula */
$$(".seg").forEach((b) => b.addEventListener("click", () => {
  $$(".seg").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
  $$("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.phase; });
}));

/* Formulário de contato */
const formState = $("[data-form-state='form']");
const resultState = $("[data-form-state='result']");
function setState(name) {
  formState.hidden = name !== "form";
  formState.style.display = name === "form" ? "grid" : "none";
  resultState.hidden = name !== "result";
  resultState.style.display = name === "result" ? "grid" : "none";
}
setState("form");

$("#lead-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const err = $("#form-error");
  const nome = $("#nome").value.trim();
  const whats = $("#whats").value.trim();
  const digits = whats.replace(/\D/g, "");
  err.hidden = true;
  if (nome.length < 2) { err.textContent = "Informe seu nome para continuar."; err.hidden = false; $("#nome").focus(); return; }
  if (digits.length < 10 || digits.length > 13) { err.textContent = "Confira o WhatsApp: informe o DDD e o número, por exemplo (11) 90000-0000."; err.hidden = false; $("#whats").focus(); return; }
  const text = [
    "Olá! Quero agendar uma aula experimental na School By Diving.",
    "",
    "Nome: " + nome,
    "WhatsApp: " + whats,
    "Nível hoje: " + $("#nivel").value,
    "Objetivo: " + $("#objetivo").value,
    "Melhor período: " + $("#periodo").value
  ].join("\n");
  $("#msg").value = text;
  const wa = $("#wa-link");
  const number = (CONTACT.whatsapp || "").replace(/\D/g, "");
  if (number) {
    wa.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
    wa.hidden = false;
    $("#no-contact").hidden = true;
  } else {
    wa.hidden = true;
    $("#no-contact").hidden = false;
  }
  $("#copy-status").textContent = "";
  setState("result");
});

$("#copy-btn").addEventListener("click", async () => {
  const msg = $("#msg");
  const status = $("#copy-status");
  try {
    await navigator.clipboard.writeText(msg.value);
    status.textContent = "Mensagem copiada.";
  } catch (err) {
    msg.focus(); msg.select();
    status.textContent = "Selecione o texto e copie.";
  }
});
$("#edit-btn").addEventListener("click", () => { setState("form"); $("#nome").focus(); });

updateDepth();
