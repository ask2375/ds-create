//~~~ 制作実績｜検索フォームの絞り込みドロップダウン・ページ遷移なしの結果差し替え ~~~
import { initModals } from "./_modal.js";

//=== 絞り込みドロップダウン ===
const closeAllFilters = except => {
  document.querySelectorAll(".js-works-filter").forEach(filter => {
    if (filter === except) return;
    filter.classList.remove("is-open");
    filter.querySelector(".js-works-filter-toggle")?.setAttribute("aria-expanded", "false");
  });
};

const initWorksFilters = (root = document) => {
  root.querySelectorAll(".js-works-filter").forEach(filter => {
    const toggle = filter.querySelector(".js-works-filter-toggle");
    const list = filter.querySelector(".js-works-filter-list");
    const input = filter.querySelector(".js-works-filter-value");
    const items = Array.from(filter.querySelectorAll(".js-works-filter-item"));
    if (!toggle || !list || !input || items.length === 0) return;

    const current = toggle.querySelector(".works__search-filter-current");

    const open = () => {
      closeAllFilters(filter);
      filter.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };

    const close = () => {
      filter.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };

    const isOpen = () => filter.classList.contains("is-open");

    const select = item => {
      items.forEach(el => el.setAttribute("aria-selected", el === item ? "true" : "false"));
      input.value = item.dataset.value || "";
      current.textContent = item.textContent.trim();

      const chipColor = item.style.getPropertyValue("--chip-color");
      if (chipColor) {
        current.classList.add("works__search-filter-current--color");
        current.style.setProperty("--chip-color", chipColor);
      } else {
        current.classList.remove("works__search-filter-current--color");
        current.style.removeProperty("--chip-color");
      }

      close();
      toggle.focus();
      filter.closest("form")?.requestSubmit();
    };

    toggle.addEventListener("click", () => {
      if (isOpen()) {
        close();
      } else {
        open();
      }
    });

    items.forEach(item => {
      item.addEventListener("click", () => select(item));
    });

    filter.addEventListener("keydown", event => {
      const activeIndex = items.indexOf(document.activeElement);

      if (event.key === "Escape") {
        if (!isOpen()) return;
        event.preventDefault();
        close();
        toggle.focus();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen()) {
          open();
          items[0].focus();
          return;
        }
        const step = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (activeIndex + step + items.length) % items.length;
        items[nextIndex].focus();
        return;
      }

      if ((event.key === "Enter" || event.key === " ") && activeIndex >= 0) {
        event.preventDefault();
        select(items[activeIndex]);
      }
    });
  });
};

//=== 検索結果の差し替え（ページ遷移なし） ===
const loadWorksResults = async (container, url, { focusForm = false } = {}) => {
  container.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(url.toString(), { credentials: "same-origin" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const next = new DOMParser().parseFromString(html, "text/html").querySelector(".js-works-ajax");
    if (!next) throw new Error("results container not found");

    const focusTargets = ".js-works-filter-toggle, .js-works-check, .works__search-keyword-input, .works__search-btn";
    const focusIndex = [...container.querySelectorAll(focusTargets)].indexOf(document.activeElement);

    container.replaceWith(next);
    initWorksFilters(next);
    initModals(next);
    if (focusIndex >= 0) next.querySelectorAll(focusTargets)[focusIndex]?.focus({ preventScroll: true });
    history.replaceState(history.state, "", `${url.pathname}${url.search}${location.hash}`);
    if (focusForm) next.querySelector(".works__search")?.scrollIntoView({ block: "start" });
  } catch (error) {
    container.removeAttribute("aria-busy");
    window.location.href = url.toString();
  }
};

const buildSearchUrl = form => {
  const url = new URL(form.action, window.location.href);
  url.search = "";
  url.hash = "";
  new FormData(form).forEach((value, key) => {
    if (String(value).trim() !== "") url.searchParams.set(key, value);
  });
  return url;
};

document.addEventListener("submit", event => {
  const form = event.target.closest(".js-works-ajax-form");
  const container = form?.closest(".js-works-ajax");
  if (!form || !container) return;
  event.preventDefault();
  closeAllFilters(null);
  loadWorksResults(container, buildSearchUrl(form));
});

document.addEventListener("click", event => {
  const link = event.target.closest(".js-works-ajax a.page-numbers, .js-works-ajax .js-works-ajax-link");
  if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    const container = link.closest(".js-works-ajax");
    event.preventDefault();
    const url = new URL(link.href, window.location.href);
    url.hash = "";
    loadWorksResults(container, url, { focusForm: link.classList.contains("page-numbers") });
    return;
  }
  if (event.target.closest(".js-works-filter")) return;
  closeAllFilters(null);
});

document.addEventListener("change", event => {
  const check = event.target.closest(".js-works-ajax-form .js-works-check");
  if (check) check.form.requestSubmit();
});

//=== 初期化 ===
initWorksFilters();
