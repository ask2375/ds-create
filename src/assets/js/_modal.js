//~~~ モーダル ~~~
const waitModalAnimation = modal => {
  const animations = modal.getAnimations?.() ?? [];
  if (animations.length === 0) return Promise.resolve([]);
  return Promise.allSettled(animations.map(a => a.finished));
};

// iOS（iPadOSを含む）かどうかのUA判定
const ua = window.navigator.userAgent.toLowerCase();
const isiOS = ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1 || (ua.indexOf("macintosh") > -1 && "ontouchend" in document);

let scrollLockActive = false;
let scrollLockRafId = 0;
let lockedScrollPosition = 0;
let lockHandlers = null;

// スクロールバーは残したまま、背景スクロールだけ無効化（非iOS向け）
function enableScrollLock(allowScrollElement) {
  if (scrollLockActive) return;
  scrollLockActive = true;

  const isScrollable = el => {
    if (!el || el === document.documentElement) return false;
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScrollY = overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
    return canScrollY && el.scrollHeight > el.clientHeight + 1;
  };

  const getScrollableParent = (startEl, rootEl) => {
    let el = startEl;
    while (el && el !== document.body) {
      if (isScrollable(el)) return el;
      if (rootEl && el === rootEl) break;
      el = el.parentElement;
    }
    if (rootEl && isScrollable(rootEl)) return rootEl;
    return null;
  };

  const shouldPreventScrollChain = (scrollEl, deltaY) => {
    if (!scrollEl || deltaY === 0) return false;
    const atTop = scrollEl.scrollTop <= 0;
    const atBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;
    if (deltaY < 0 && atTop) return true;
    if (deltaY > 0 && atBottom) return true;
    return false;
  };

  const wheelHandler = e => {
    if (!allowScrollElement || !allowScrollElement.contains(e.target)) {
      e.preventDefault();
      return;
    }
    const scrollEl = getScrollableParent(e.target, allowScrollElement);
    if (!scrollEl) {
      e.preventDefault();
      return;
    }
    if (shouldPreventScrollChain(scrollEl, e.deltaY)) {
      e.preventDefault();
    }
  };

  let touchStartY = 0;
  let touchScrollEl = null;

  const touchStartHandler = e => {
    if (!e.touches || e.touches.length !== 1) return;
    if (!allowScrollElement || !allowScrollElement.contains(e.target)) {
      touchScrollEl = null;
      return;
    }
    touchStartY = e.touches[0].clientY;
    touchScrollEl = getScrollableParent(e.target, allowScrollElement);
  };

  const touchMoveHandler = e => {
    if (!e.touches || e.touches.length !== 1) return;
    if (!allowScrollElement || !allowScrollElement.contains(e.target)) {
      e.preventDefault();
      return;
    }
    if (!touchScrollEl) {
      e.preventDefault();
      return;
    }
    const currentY = e.touches[0].clientY;
    const dy = currentY - touchStartY;
    const deltaY = dy > 0 ? -1 : dy < 0 ? 1 : 0;
    if (shouldPreventScrollChain(touchScrollEl, deltaY)) {
      e.preventDefault();
    }
    touchStartY = currentY;
  };

  const preventScrollKeys = e => {
    const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select" || tag === "button") return;
    const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"];
    if (keys.includes(e.key)) e.preventDefault();
  };

  const keepScrollPosition = () => {
    if (!scrollLockActive) return;
    cancelAnimationFrame(scrollLockRafId);
    scrollLockRafId = requestAnimationFrame(() => {
      window.scrollTo(0, lockedScrollPosition);
    });
  };

  lockHandlers = { wheelHandler, touchStartHandler, touchMoveHandler, preventScrollKeys, keepScrollPosition };

  window.addEventListener("wheel", wheelHandler, { passive: false });
  window.addEventListener("touchstart", touchStartHandler, { passive: true });
  window.addEventListener("touchmove", touchMoveHandler, { passive: false });
  window.addEventListener("keydown", preventScrollKeys, { passive: false });
  window.addEventListener("scroll", keepScrollPosition, { passive: true });
}

function disableScrollLock() {
  if (!scrollLockActive) return;
  scrollLockActive = false;

  if (lockHandlers) {
    window.removeEventListener("wheel", lockHandlers.wheelHandler);
    window.removeEventListener("touchstart", lockHandlers.touchStartHandler);
    window.removeEventListener("touchmove", lockHandlers.touchMoveHandler);
    window.removeEventListener("keydown", lockHandlers.preventScrollKeys);
    window.removeEventListener("scroll", lockHandlers.keepScrollPosition);
    lockHandlers = null;
  }

  cancelAnimationFrame(scrollLockRafId);
}

let modalScrollPosition = 0;

const modalBodyFixedOn = modal => {
  if (isiOS) {
    modalScrollPosition = window.pageYOffset;
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.top = `-${modalScrollPosition}px`;
  } else {
    modalScrollPosition = window.pageYOffset;
    enableScrollLock(modal);
  }
};

const modalBodyFixedOff = () => {
  if (isiOS) {
    document.body.style.position = "";
    document.body.style.width = "";
    document.body.style.top = "";
    window.scrollTo(0, modalScrollPosition);
  } else {
    disableScrollLock();
  }
};

let currentOpenTrigger = null;
const transitioningMap = new WeakMap();
const listenersMap = new WeakMap();

const manageEventListeners = (modal, add) => {
  if (add) {
    const backdropClickListener = event => {
      if (event.target === modal) closeModal(modal);
    };

    const keyDownListener = event => {
      document.documentElement.removeAttribute("data-mousedown");
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal(modal);
      }
    };

    modal.addEventListener("click", backdropClickListener, false);
    window.addEventListener("keydown", keyDownListener, false);
    listenersMap.set(modal, { backdropClickListener, keyDownListener });
    return;
  }

  const listeners = listenersMap.get(modal);
  if (!listeners) return;
  modal.removeEventListener("click", listeners.backdropClickListener);
  window.removeEventListener("keydown", listeners.keyDownListener);
  listenersMap.delete(modal);
};

const handleTriggerFocusMode = event => {
  if (event.type === "mousedown") {
    document.documentElement.setAttribute("data-mousedown", "true");
  }
  if (event.type === "keydown") {
    document.documentElement.removeAttribute("data-mousedown");
  }
};

const openModal = modal => {
  if (transitioningMap.get(modal)) return;
  transitioningMap.set(modal, true);

  try {
    modal.showModal();
  } catch (e) {
    console.error("dialog.showModal() failed. Is <dialog> supported?", e);
    transitioningMap.set(modal, false);
    return;
  }

  modalBodyFixedOn(modal);
  manageEventListeners(modal, true);
  document.dispatchEvent(new CustomEvent("modal:open"));

  requestAnimationFrame(async () => {
    modal.setAttribute("data-active", "true");
    await waitModalAnimation(modal);
    transitioningMap.set(modal, false);
  });
};

const closeModal = async modal => {
  if (transitioningMap.get(modal)) return;
  transitioningMap.set(modal, true);

  modal.setAttribute("data-active", "false");
  modalBodyFixedOff();
  manageEventListeners(modal, false);
  document.dispatchEvent(new CustomEvent("modal:close"));

  await waitModalAnimation(modal);
  modal.close();

  if (currentOpenTrigger) {
    currentOpenTrigger.focus();
    currentOpenTrigger = null;
  }

  transitioningMap.set(modal, false);
};

const initializeModal = modal => {
  if (!modal) {
    console.error("Element required for initializeModal is not found.");
    return;
  }

  const openTriggers = document.querySelectorAll(`[data-modal-open="${modal.id}"]`);
  const closeTriggers = modal.querySelectorAll("[data-modal-close]");

  if (openTriggers.length === 0 || closeTriggers.length === 0) {
    console.error("Elements required for modal trigger are not found.");
    return;
  }

  openTriggers.forEach(trigger => {
    trigger.addEventListener(
      "click",
      event => {
        event.preventDefault();
        currentOpenTrigger = trigger;
        openModal(modal);
      },
      false,
    );

    trigger.addEventListener("mousedown", handleTriggerFocusMode, false);
    trigger.addEventListener("keydown", handleTriggerFocusMode, false);
  });

  closeTriggers.forEach(trigger => {
    trigger.addEventListener(
      "click",
      event => {
        event.preventDefault();
        closeModal(modal);
      },
      false,
    );
  });
};

// === 初期化処理 ===
export const initModals = (root = document) => {
  root.querySelectorAll(".modal").forEach(modal => {
    initializeModal(modal);
  });
};

initModals();
