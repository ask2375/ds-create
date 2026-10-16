//~~~ トップページ: メニューからセクションへのスクロールと現在地の表示 ~~~
const world = document.querySelector(".js-world");

if (world) {
  const panels = [...world.querySelectorAll(".js-world-panel")];
  const panelById = new Map(panels.map(panel => [panel.id, panel]));
  const links = [...document.querySelectorAll("[data-go]")];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const mark = id => {
    document.body.dataset.panel = id;
    links.forEach(link => link.setAttribute("aria-current", String(link.dataset.go === id)));
  };

  //=== セクションへスクロール ===
  const scrollToPanel = (id, { updateHash = true, smooth = true } = {}) => {
    const target = panelById.get(id) || panelById.get("mv");
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

  //=== イベント ===
  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-go]");
    if (!trigger || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    scrollToPanel(trigger.dataset.go);
  });

  window.addEventListener("popstate", () => {
    const id = location.hash.slice(1);
    if (panelById.has(id)) scrollToPanel(id, { updateHash: false, smooth: false });
  });

  //=== 初期化 ===
  mark("mv");
  panels.forEach(panel => watcher.observe(panel));
  const id = location.hash.slice(1);
  if (panelById.has(id)) scrollToPanel(id, { updateHash: false, smooth: false });
}
