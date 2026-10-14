//~~~ 制作実績一覧｜検索フォームの絞り込みドロップダウン ~~~
(() => {
  const filters = document.querySelectorAll(".js-works-filter");
  if (filters.length === 0) return;

  const form = document.querySelector(".works__search");

  const closeAll = except => {
    filters.forEach(filter => {
      if (filter === except) return;
      filter.classList.remove("is-open");
      filter.querySelector(".js-works-filter-toggle").setAttribute("aria-expanded", "false");
    });
  };

  filters.forEach(filter => {
    const toggle = filter.querySelector(".js-works-filter-toggle");
    const list = filter.querySelector(".js-works-filter-list");
    const input = filter.querySelector(".js-works-filter-value");
    const items = Array.from(filter.querySelectorAll(".js-works-filter-item"));
    if (!toggle || !list || !input || items.length === 0) return;

    const current = toggle.querySelector(".works__search-filter-current");

    const open = () => {
      closeAll(filter);
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

      if (form) {
        form.requestSubmit();
      }
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

  document.addEventListener("click", event => {
    if (event.target.closest(".js-works-filter")) return;
    closeAll(null);
  });

  if (form) {
    form.querySelectorAll(".js-works-check").forEach(check => {
      check.addEventListener("change", () => {
        form.requestSubmit();
      });
    });

    form.addEventListener("submit", () => {
      const emptied = [];
      form.querySelectorAll("input[name]").forEach(input => {
        if (input.value !== "") return;
        input.disabled = true;
        emptied.push(input);
      });
      window.setTimeout(() => {
        emptied.forEach(input => {
          input.disabled = false;
        });
      }, 0);
    });
  }
})();
