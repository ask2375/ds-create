"use strict";

//-----------------------------------------------
// メニュー押下時に背景を固定する
//-----------------------------------------------
let scrollPosition;
let scrollLockActive = false;
let scrollLockRafId = 0;
let lockHandlers = null;

// iOS（iPadOSを含む）かどうかのUA判定
const ua = window.navigator.userAgent.toLowerCase();
const isiOS = ua.indexOf("iphone") > -1 || ua.indexOf("ipad") > -1 || (ua.indexOf("macintosh") > -1 && "ontouchend" in document);

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
      window.scrollTo(0, scrollPosition);
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

// bodyのスクロール固定
function bodyFixedOn() {
  const body = document.body;
  if (isiOS) {
    scrollPosition = window.pageYOffset;
    body.style.position = "fixed";
    body.style.width = "100%";
    body.style.top = `-${scrollPosition}px`;
  } else {
    scrollPosition = window.pageYOffset;
    enableScrollLock(spNav);
  }
}

// bodyのスクロール固定を解除
function bodyFixedOff() {
  const body = document.body;
  if (isiOS) {
    body.style.position = "";
    body.style.width = "";
    body.style.top = "";
    window.scrollTo(0, scrollPosition);
  } else {
    disableScrollLock();
  }
}

//-----------------------------------------------
// ドロワーメニュー
//-----------------------------------------------
const hamburger = document.querySelector(".js-hamburger");
const spNav = document.querySelector(".js-sp-nav");
const navLinks = document.querySelectorAll(".js-sp-nav a[href]");
const overlay = document.querySelector(".js-overlay");

// フェードイン
function fadeIn(element, duration = 300) {
  element.style.display = "block";
  element.style.opacity = 0;
  element.style.transition = `opacity ${duration}ms`;
  setTimeout(() => {
    element.style.opacity = 1;
  }, 0);
}

function fadeOut(element, duration = 300) {
  element.style.transition = `opacity ${duration}ms`;
  element.style.opacity = 0;
  setTimeout(() => {
    element.style.display = "none";
  }, duration);
}

function handleSpMenu() {
  if (window.innerWidth <= 960) {
    hamburger.addEventListener("click", toggleMenu);
    overlay.addEventListener("click", closeMenu);
    navLinks.forEach(link => {
      link.addEventListener("click", closeMenu);
    });
  } else {
    hamburger.classList.remove("is-active");
    setHamburgerState(false);
    fadeOut(spNav, 300);
    fadeOut(overlay, 300);
    bodyFixedOff();

    hamburger.removeEventListener("click", toggleMenu);
    overlay.removeEventListener("click", closeMenu);
    navLinks.forEach(link => {
      link.removeEventListener("click", closeMenu);
    });
  }
}

function setHamburgerState(isOpen) {
  hamburger.setAttribute("aria-expanded", String(isOpen));
  hamburger.setAttribute("aria-label", isOpen ? "メニューを閉じる" : "メニューを開く");
}

// ハンバーガーメニューの開閉処理
function toggleMenu() {
  if (hamburger.classList.contains("is-active")) {
    hamburger.classList.remove("is-active");
    setHamburgerState(false);
    fadeOut(spNav, 300);
    fadeOut(overlay, 300);
    bodyFixedOff();
  } else {
    hamburger.classList.add("is-active");
    setHamburgerState(true);
    fadeIn(spNav, 300);
    fadeIn(overlay, 300);
    bodyFixedOn();
  }
}

// メニューを閉じる処理
function closeMenu() {
  hamburger.classList.remove("is-active");
  setHamburgerState(false);
  fadeOut(spNav, 300);
  fadeOut(overlay, 300);
  bodyFixedOff();
}

if (hamburger && spNav && overlay) {
  handleSpMenu();
  window.addEventListener("resize", handleSpMenu);
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape" || !hamburger.classList.contains("is-active")) return;
    closeMenu();
    hamburger.focus();
  });
}
