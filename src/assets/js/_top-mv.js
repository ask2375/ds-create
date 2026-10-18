//~~~ トップページ: MV（曲面パネル内のループ文字） ~~~

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
    if (!reduced.matches && !document.hidden && (document.body.dataset.panel || "mv") === "mv" && !("mvCracked" in document.body.dataset)) frame = requestAnimationFrame(tick);
  };

  const measure = () => {
    if (!holo.getBoundingClientRect().width) return;
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
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["data-panel", "data-mv-cracked"] });
  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
}
