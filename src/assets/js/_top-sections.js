//~~~ トップページ: ダイアログ ~~~
(() => {
  //=== ダイアログ ===
  document.addEventListener("click", event => {
    if (!(event.target instanceof Element) || event.defaultPrevented) return;
    const trigger = event.target.closest(".js-dialog-open");
    if (!trigger) return;
    const dialog = document.getElementById(trigger.dataset.dialog);
    if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
    event.preventDefault();
    dialog.showModal();
    dialog.querySelector(".js-dialog-body")?.scrollTo(0, 0);
  });
})();
