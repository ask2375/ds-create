//~~~ トップページ: MV（メニューの縮小・曲面パネル内のループ文字） ~~~

//=== メニューをサイドバーの高さに収める ===
const sidebar = document.querySelector(".js-mv-sidebar");
const menu = document.querySelector(".js-mv-menu");

if (sidebar && menu) {
  const mobile = window.matchMedia("(max-width: 768px)");
  let frame = 0;

  const fit = () => {
    frame = 0;
    if (mobile.matches) {
      menu.style.removeProperty("--menu-scale");
      return;
    }
    const angle = (2 * Math.PI) / 180;
    const width = menu.offsetWidth * Math.cos(angle) + menu.offsetHeight * Math.sin(angle);
    const height = menu.offsetHeight * Math.cos(angle) + menu.offsetWidth * Math.sin(angle);
    const scale = Math.min(1, Math.max(1, sidebar.clientWidth - 66) / width, Math.max(1, sidebar.clientHeight - 72) / height);
    const previous = Number(menu.style.getPropertyValue("--menu-scale") || 1);
    if (Math.abs(previous - scale) > 0.001) menu.style.setProperty("--menu-scale", scale.toFixed(4));
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(fit);
  };

  const observer = new ResizeObserver(schedule);
  observer.observe(sidebar);
  observer.observe(menu);
  mobile.addEventListener("change", schedule);
  document.fonts.ready.then(schedule);
  schedule();
}

//=== 曲面パネル内のループ文字 ===
const holo = document.querySelector(".js-mv-holo");

if (holo) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const viewHeight = holo.viewBox.baseVal.height;
  const tracks = [...holo.querySelectorAll(".js-mv-holo-text")].map(text => {
    const unit = text.dataset.loopText;
    const vertical = text.parentElement.classList.contains("js-mv-holo-vertical");
    const host = vertical ? text.parentElement : text;
    const path = vertical ? null : document.querySelector(text.getAttribute("href"));
    return { text, host, unit, vertical, path, speed: Number(host.dataset.speed), phase: Number(host.dataset.phase), period: 1 };
  });
  let frame = 0;
  let previous = 0;
  let elapsed = 0;

  const wrap = (value, length) => ((value % length) + length) % length;

  const paint = () => {
    tracks.forEach(track => {
      const offset = -wrap(elapsed * track.speed + track.period * track.phase, track.period);
      if (track.vertical) {
        track.host.setAttribute("transform", `translate(0 ${offset.toFixed(2)})`);
      } else {
        track.text.setAttribute("startOffset", offset.toFixed(2));
      }
    });
  };

  const tick = now => {
    if (previous) elapsed += Math.min((now - previous) / 1000, 0.1);
    previous = now;
    paint();
    frame = requestAnimationFrame(tick);
  };

  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (!reduced.matches && !document.hidden && (document.body.dataset.panel || "mv") === "mv") frame = requestAnimationFrame(tick);
  };

  const measure = () => {
    tracks.forEach(track => {
      track.text.textContent = track.unit;
      track.period = Math.max(1, track.text.getSubStringLength(0, track.unit.length));
      if (track.vertical) track.text.setAttribute("y", (-track.period).toFixed(2));
      const span = track.vertical ? viewHeight + track.period : track.path.getTotalLength();
      track.text.textContent = track.unit.repeat(Math.ceil(span / track.period) + 1);
    });
    paint();
    sync();
  };

  document.fonts.ready.then(measure);
  new ResizeObserver(measure).observe(holo);
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["data-panel"] });
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
}
