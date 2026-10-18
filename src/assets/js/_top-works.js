//~~~ トップページ 制作実績: ジャンルの絞り込みとページ切替 ~~~
const topWorks = document.querySelector("[data-top-works]");
const topWorksList = topWorks?.querySelector("[data-top-works-cards]");

if (topWorksList) {
  const cards = [...topWorksList.querySelectorAll("[data-top-works-card]")];
  const filters = [...topWorks.querySelectorAll("[data-top-works-filter]")];
  const pages = topWorks.querySelector("[data-top-works-pages]");
  const status = topWorks.querySelector("[data-top-works-status]");
  let genre = "";
  let page = 0;
  let perPage = 0;

  const readPerPage = () => Number(getComputedStyle(topWorksList).getPropertyValue("--per-page")) || 6;

  const matched = () => cards.filter(card => !genre || card.dataset.genres.split(" ").includes(genre));

  //=== 表示の更新 ===
  const render = () => {
    const items = matched();
    const total = Math.max(1, Math.ceil(items.length / perPage));
    page = Math.min(page, total - 1);
    const start = page * perPage;
    const shown = items.slice(start, start + perPage);

    cards.forEach(card => {
      card.hidden = !shown.includes(card);
    });

    pages.replaceChildren(
      ...(total > 1
        ? Array.from({ length: total }, (_, index) => {
            const item = document.createElement("li");
            const button = document.createElement("button");
            item.className = "top-works__page-item";
            button.className = "top-works__page-btn";
            button.type = "button";
            button.dataset.topWorksPage = String(index);
            button.setAttribute("aria-label", `${index + 1}ページ目`);
            button.setAttribute("aria-current", String(index === page));
            item.append(button);
            return item;
          })
        : []),
    );

    status.textContent = items.length ? `${items.length}件中 ${start + 1}〜${start + shown.length}件目を表示` : "該当する制作実績はありません";
  };

  //=== イベント ===
  topWorks.addEventListener("click", event => {
    const filter = event.target.closest("[data-top-works-filter]");
    if (filter) {
      genre = filter.dataset.topWorksFilter;
      page = 0;
      filters.forEach(button => button.setAttribute("aria-pressed", String(button === filter)));
      render();
      return;
    }
    const pageButton = event.target.closest("[data-top-works-page]");
    if (pageButton) {
      page = Number(pageButton.dataset.topWorksPage);
      render();
      pages.querySelector('[data-top-works-page="' + page + '"]')?.focus();
    }
  });

  new ResizeObserver(() => {
    const next = readPerPage();
    if (next === perPage) return;
    page = Math.floor((page * perPage) / next);
    perPage = next;
    render();
  }).observe(topWorksList);
}
