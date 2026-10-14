//~~~ トップページ: パネル移動 ~~~
const world = document.querySelector(".js-world");

if (world) {
  const panels = [...world.querySelectorAll(".js-world-panel")];
  const panelById = new Map(panels.map(panel => [panel.id, panel]));
  const links = [...document.querySelectorAll(".js-top-header .js-world-link, .top-minimap .js-world-link")];
  const header = document.querySelector(".js-top-header");
  const neighbors = {
    mv: { ArrowUp: "works", ArrowDown: "service", ArrowLeft: "contact", ArrowRight: "about" },
    service: { ArrowUp: "mv", ArrowDown: "features" },
    features: { ArrowUp: "service" },
    works: { ArrowDown: "mv" },
    contact: { ArrowRight: "mv" },
    about: { ArrowLeft: "mv" },
  };
  let current = "mv";

  //=== パネル移動 ===
  const go = (id, { updateHash = true, focus = true } = {}) => {
    const target = panelById.get(id) || panelById.get("mv");
    if (current !== target.id) target.scrollTop = 0;
    current = target.id;
    document.body.dataset.panel = current;
    if (header) header.inert = current === "mv";
    world.style.transform = `translate(${-Number(target.dataset.col) * 100}vw, ${-Number(target.dataset.row) * 100}svh)`;
    panels.forEach(panel => {
      panel.inert = panel !== target;
    });
    links.forEach(link => link.setAttribute("aria-current", String(link.dataset.go === current)));
    if (updateHash) history.pushState(null, "", `#${current}`);
    if (focus) target.querySelector("h1, h2")?.focus({ preventScroll: true });
  };

  //=== イベント ===
  document.addEventListener("click", event => {
    const trigger = event.target.closest(".js-world-link");
    if (!trigger || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (trigger.dataset.go !== current) go(trigger.dataset.go);
  });

  document.addEventListener("keydown", event => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLElement) || target.matches("input, textarea, select, [contenteditable='true']")) return;
    const activePanel = panelById.get(current);
    if (target !== document.body && !target.matches(".js-world-title")) return;
    const next = neighbors[current][event.key];
    if (!next) return;
    const canScrollDown = activePanel.scrollHeight - activePanel.clientHeight - activePanel.scrollTop > 2;
    if ((event.key === "ArrowDown" && canScrollDown) || (event.key === "ArrowUp" && activePanel.scrollTop > 2)) return;
    event.preventDefault();
    go(next);
  });

  window.addEventListener("popstate", () => go(location.hash.slice(1), { updateHash: false }));
  window.addEventListener("hashchange", () => {
    if (location.hash.slice(1) !== current) go(location.hash.slice(1), { updateHash: false });
  });

  //=== 初期化 ===
  go(location.hash.slice(1), { updateHash: false, focus: false });
  requestAnimationFrame(() => requestAnimationFrame(() => world.classList.add("is-ready")));
}
