//~~~ トップページ: パネル移動（1025px 以上）とセクションへのスクロール（1024px 以下） ~~~
const world = document.querySelector(".js-world");

if (world) {
  const panels = [...world.querySelectorAll(".js-world-panel")];
  const panelById = new Map(panels.map(panel => [panel.id, panel]));
  const links = [...document.querySelectorAll("[data-go]")];
  const narrow = window.matchMedia("(max-width: 1024px)");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const neighbors = {
    mv: { ArrowUp: "works", ArrowDown: "service", ArrowLeft: "contact", ArrowRight: "about" },
    service: { ArrowUp: "mv", ArrowDown: "features" },
    features: { ArrowUp: "service" },
    works: { ArrowDown: "mv" },
    contact: { ArrowRight: "mv" },
    about: { ArrowLeft: "mv" },
  };
  let current = "mv";

  const resolve = id => panelById.get(id) || panelById.get("mv");

  const mark = id => {
    current = id;
    document.body.dataset.panel = current;
    links.forEach(link => link.setAttribute("aria-current", String(link.dataset.go === current)));
  };

  //=== パネル移動（1025px 以上） ===
  const go = (id, { updateHash = true, focus = true } = {}) => {
    const target = resolve(id);
    if (current !== target.id) target.scrollTop = 0;
    mark(target.id);
    world.style.setProperty("--col", target.dataset.col);
    world.style.setProperty("--row", target.dataset.row);
    panels.forEach(panel => {
      panel.inert = panel !== target;
    });
    if (updateHash) history.pushState(null, "", `#${current}`);
    if (focus) target.querySelector("h1, h2")?.focus({ preventScroll: true });
  };

  //=== セクションへスクロール（1024px 以下） ===
  const scrollToPanel = (id, { updateHash = true, smooth = true } = {}) => {
    const target = resolve(id);
    target.scrollIntoView({ behavior: smooth && !reduced.matches ? "smooth" : "auto", block: "start" });
    if (updateHash) history.pushState(null, "", `#${target.id}`);
    target.querySelector("h1, h2")?.focus({ preventScroll: true });
  };

  const watcher = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) mark(entry.target.id);
      });
    },
    { rootMargin: "-40% 0px -59% 0px" },
  );

  const enterNarrow = () => {
    panels.forEach(panel => {
      panel.inert = false;
      watcher.observe(panel);
    });
    const id = location.hash.slice(1);
    if (panelById.has(id)) scrollToPanel(id, { updateHash: false, smooth: false });
  };

  const enterWide = () => {
    watcher.disconnect();
    window.scrollTo(0, 0);
    go(location.hash.slice(1), { updateHash: false, focus: false });
  };

  //=== イベント ===
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-go]");
    if (!trigger || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (narrow.matches) {
      scrollToPanel(trigger.dataset.go);
    } else if (trigger.dataset.go !== current) {
      go(trigger.dataset.go);
    }
  });

  document.addEventListener("keydown", event => {
    if (narrow.matches || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
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

  window.addEventListener("popstate", () => {
    const id = location.hash.slice(1);
    if (narrow.matches) {
      if (panelById.has(id)) scrollToPanel(id, { updateHash: false, smooth: false });
    } else {
      go(id, { updateHash: false });
    }
  });

  window.addEventListener("hashchange", () => {
    if (!narrow.matches && location.hash.slice(1) !== current) go(location.hash.slice(1), { updateHash: false });
  });

  narrow.addEventListener("change", event => {
    if (event.matches) {
      enterNarrow();
    } else {
      enterWide();
    }
  });

  //=== 初期化 ===
  if (narrow.matches) {
    enterNarrow();
  } else {
    go(location.hash.slice(1), { updateHash: false, focus: false });
  }
  requestAnimationFrame(() => requestAnimationFrame(() => world.classList.add("is-ready")));
}
