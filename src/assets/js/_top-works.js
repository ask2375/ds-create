//~~~ トップページ 制作実績: ゲーム風 UI のスライダー・ジャンルタブ ~~~
import Swiper from "swiper/bundle";

//=== スライダー ===
let currentSlider = null;

const getCurrentSPV = () => {
  const w = window.innerWidth;
  if (w >= 1700) return 5;
  if (w >= 1025) return 4;
  if (w >= 900) return 5;
  if (w >= 768) return 4;
  if (w >= 600) return 2.5;
  return 1.5;
};

const initTopWorksSlider = (root = document) => {
  const sliderEl = root.querySelector(".js-swiper");
  if (!sliderEl) return;

  if (currentSlider) {
    window.removeEventListener("resize", currentSlider.onResize);
    currentSlider.swiper.destroy(true, true);
    currentSlider = null;
  }

  const sliderWrapper = sliderEl.closest(".top-works__slider-wrapper") || root;
  const slideCount = sliderEl.querySelectorAll(".swiper-slide").length;
  const paginationEl = sliderWrapper.querySelector(".js-swiper-pagination");

  const isOverflowing = () => slideCount > getCurrentSPV();

  const swiper = new Swiper(sliderEl, {
    slidesPerView: 1.5,
    spaceBetween: "2%",
    loop: false,
    navigation: {
      nextEl: sliderWrapper.querySelector(".swiper-button-next"),
      prevEl: sliderWrapper.querySelector(".swiper-button-prev"),
    },
    pagination: {
      el: paginationEl,
      clickable: true,
    },
    breakpoints: {
      600: { slidesPerView: 2.5 },
      768: { slidesPerView: 4 },
      900: { slidesPerView: 5 },
      1025: { slidesPerView: 4 },
      1700: { slidesPerView: 5 },
    },
  });

  sliderWrapper.querySelectorAll(".swiper-button-prev, .swiper-button-next").forEach(btn => {
    btn.addEventListener("click", () => btn.blur());
  });

  const updateSwiperState = () => {
    if (isOverflowing()) {
      sliderEl.classList.remove("is-swiper-static");
      if (paginationEl) paginationEl.style.display = "";
      swiper.enable();
      swiper.update();
    } else {
      swiper.slideTo(0, 0, false);
      swiper.disable();
      sliderEl.classList.add("is-swiper-static");
      if (paginationEl) paginationEl.style.display = "none";
    }
  };

  updateSwiperState();

  let resizeTimer;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateSwiperState, 150);
  };
  window.addEventListener("resize", onResize);

  currentSlider = { swiper, onResize };
};

//=== ジャンルタブ（選択した時点で絞り込みを送信） ===
document.addEventListener("change", event => {
  const tab = event.target.closest(".js-top-works-tab");
  if (tab?.form) tab.form.requestSubmit();
});

//=== 初期化 ===
initTopWorksSlider();
document.addEventListener("works:replaced", event => initTopWorksSlider(event.detail.root));
