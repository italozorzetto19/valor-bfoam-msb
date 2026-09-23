/* ===== Configuração =====
   Para trocar as páginas, substitua page-1.png ... page-N.png na pasta /paginas.
   Se mudar a quantidade de páginas, altere TOTAL_PAGES. */
const TOTAL_PAGES = 6;
const PAGE_DIR = "paginas/";
const PAGE_EXT = "png";

const book = document.getElementById("book");
const counter = document.getElementById("counter");
const root = document.documentElement;

// Lista de páginas (completa com página em branco se o total for ímpar)
const pages = [];
for (let i = 1; i <= TOTAL_PAGES; i++) pages.push(`${PAGE_DIR}page-${i}.${PAGE_EXT}`);
if (pages.length % 2) pages.push(null);

const makeImg = src => src ? `<img src="${src}" alt="" draggable="false">` : "";
const div = (cls, html = "") => {
  const d = document.createElement("div");
  d.className = cls; d.innerHTML = html; return d;
};

// Estrutura: página 1 fica fixa à esquerda, a última à direita; as folhas viram no meio
book.appendChild(div("page left", makeImg(pages[0])));
book.appendChild(div("page right", makeImg(pages[pages.length - 1])));
const leaves = [];
for (let i = 0; i < (pages.length - 2) / 2; i++) {
  const leaf = div("leaf");
  leaf.appendChild(div("face front", makeImg(pages[2 * i + 1])));
  leaf.appendChild(div("face back", makeImg(pages[2 * i + 2])));
  book.appendChild(leaf);
  leaves.push(leaf);
}
const L = leaves.length;
let cur = 0; // folhas já viradas

const setAngle = (leaf, deg) => (leaf.style.transform = `rotateY(${deg}deg)`);

function settle() {
  leaves.forEach((leaf, i) => {
    leaf.style.zIndex = i < cur ? 10 + i : 10 + L - i;
    setAngle(leaf, i < cur ? -180 : 0);
  });
}

function updateCounter() {
  const a = 2 * cur + 1, b = Math.min(2 * cur + 2, TOTAL_PAGES);
  counter.textContent = `Páginas ${a}${b > a ? "–" + b : ""} de ${TOTAL_PAGES}`;
}

function next() {
  if (cur >= L) return;
  const leaf = leaves[cur++];
  leaf.style.zIndex = 100; setAngle(leaf, -180);
  updateCounter(); setTimeout(settle, 950);
}
function prev() {
  if (cur <= 0) return;
  const leaf = leaves[--cur];
  leaf.style.zIndex = 100; setAngle(leaf, 0);
  updateCounter(); setTimeout(settle, 950);
}

// ===== Mouse / toque: clique nas laterais ou arraste para folhear =====
let drag = null;
book.addEventListener("pointerdown", e => {
  const r = book.getBoundingClientRect();
  const right = e.clientX > r.left + r.width / 2;
  if (right && cur < L) drag = { leaf: leaves[cur], dir: 1 };
  else if (!right && cur > 0) drag = { leaf: leaves[cur - 1], dir: -1 };
  else return;
  Object.assign(drag, { x0: e.clientX, w: r.width / 2, p: 0, moved: false });
  book.setPointerCapture(e.pointerId);
});
book.addEventListener("pointermove", e => {
  if (!drag) return;
  const dx = e.clientX - drag.x0;
  if (Math.abs(dx) > 6) drag.moved = true;
  if (!drag.moved) return;
  drag.p = Math.min(1, Math.max(0, (drag.dir === 1 ? -dx : dx) / drag.w));
  drag.leaf.classList.add("drag");
  drag.leaf.style.zIndex = 100;
  setAngle(drag.leaf, drag.dir === 1 ? -180 * drag.p : -180 * (1 - drag.p));
});
function endDrag() {
  if (!drag) return;
  const d = drag; drag = null;
  d.leaf.classList.remove("drag");
  if (!d.moved || d.p > 0.3) d.dir === 1 ? next() : prev();
  else { setAngle(d.leaf, d.dir === 1 ? 0 : -180); setTimeout(settle, 950); }
}
book.addEventListener("pointerup", endDrag);
book.addEventListener("pointercancel", endDrag);

// ===== Botões, teclado e tela cheia =====
const toggleFS = () =>
  document.fullscreenElement ? document.exitFullscreen()
    : root.requestFullscreen && root.requestFullscreen();

document.getElementById("next").onclick = next;
document.getElementById("prev").onclick = prev;
document.getElementById("fs").onclick = toggleFS;
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
  else if (e.key === "f" || e.key === "F") toggleFS();
});

// ===== Ajuste de tamanho (usa a proporção real da página 1) =====
let ratio = 0.707; // A4 até a imagem carregar
function fit() {
  const m = document.querySelector("main");
  const ph = Math.min(m.clientHeight * 0.94, (m.clientWidth * 0.96) / 2 / ratio);
  root.style.setProperty("--ph", ph + "px");
  root.style.setProperty("--pw", ph * ratio + "px");
}
const probe = new Image();
probe.onload = () => { ratio = probe.naturalWidth / probe.naturalHeight; fit(); };
probe.src = pages[0];
window.addEventListener("resize", fit);
document.addEventListener("fullscreenchange", fit);

fit(); settle(); updateCounter();
