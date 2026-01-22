document.addEventListener("DOMContentLoaded", () => {
  const views = Array.from(document.querySelectorAll(".view"));
  const globalHeader = document.getElementById("global-header");
  let currentViewIndex = 0;
  let maxReachedIndex = 0;
  const QUIZ_START_INDEX = 3;
  
  // ДОБАВИТЬ: Определяем последний экран (теперь это 34)
  const LAST_VIEW_INDEX = 33; // View-34 имеет index 33 (если view-1 index 0)

  function fixScrollbar() {
    const activeMain = document.querySelector(".view.active .layout-main");
    if (activeMain) {
      const scrollbarWidth = activeMain.offsetWidth - activeMain.clientWidth;
      document.documentElement.style.setProperty(
        "--scrollbar-width",
        `${scrollbarWidth}px`
      );
    } else {
      document.documentElement.style.setProperty("--scrollbar-width", "0px");
    }
  }

  function updateQuizProgress() {
    const bar = document.querySelector(".step-progress__fill");
    const dots = document.querySelectorAll(".step-dot");
    
    if (!bar) return;

    const quizStart = 3;
    const quizEnd = 33; // Теперь квиз заканчивается на экране 33
    
    let currentStep = currentViewIndex - quizStart;
    if (currentStep < 0) currentStep = 0;
    
    const totalSteps = quizEnd - quizStart;
    let percent = (currentStep / totalSteps) * 100;
    
    if (currentStep > 0 && percent < 2) {
       percent = 2;
    }

    if (percent > 100) percent = 100;

    bar.style.width = `${percent}%`;

    if (dots.length > 0) {
      const stepPerDot = 100 / (dots.length - 1);
      dots.forEach((dot, index) => {
        const dotPosition = index * stepPerDot;
        if (percent >= (dotPosition - 0.5)) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });
    }
  }

  window.addEventListener("resize", () => {
    fixScrollbar();
  });

  function checkNavState() {
    const currentView = views[currentViewIndex];
    if (!currentView) return;

    const nextArrow = globalHeader.querySelector('.btn-arrow[data-trigger="next"]');
    const footerBtn = currentView.querySelector('.layout-footer .btn, .inline-footer .btn'); 
    
    let isArrowEnabled = true; 
    let isFooterBtnEnabled = true;

    const multiSelectItems = currentView.querySelectorAll('.card-checkbox, .card-zone, .card[data-action="toggle"]');
    
    if (multiSelectItems.length > 0) {
      const selected = currentView.querySelectorAll('.card-checkbox.selected, .card-zone.selected, .card.selected[data-action="toggle"]');
      const hasSelection = selected.length > 0;
      isArrowEnabled = hasSelection;
      isFooterBtnEnabled = hasSelection;
    } 
    else if (footerBtn && footerBtn.disabled) {
       isArrowEnabled = false;
    }
    else {
      const singleChoiceCards = currentView.querySelectorAll('[data-trigger="next"]:not(.btn)');
      if (singleChoiceCards.length > 0) {
        isArrowEnabled = false;
      }
    }

    if (currentView.id === 'view-25') {
       const progBtn = document.getElementById('btn-progress-container');
       if (progBtn && !progBtn.classList.contains('ready')) {
         isArrowEnabled = false;
       }
    }

    if (currentViewIndex < maxReachedIndex) {
       isArrowEnabled = true;
    }

    // ИЗМЕНЕНИЕ: На последнем экране скрываем стрелку
    if (currentViewIndex >= LAST_VIEW_INDEX) {
      isArrowEnabled = false;
    }

    if (isArrowEnabled) {
      nextArrow.classList.remove('disabled');
    } else {
      nextArrow.classList.add('disabled');
    }

    if (footerBtn && multiSelectItems.length > 0) {
       footerBtn.disabled = !isFooterBtnEnabled;
    }
  }

  // ИЗМЕНЕНИЕ: Обновленная логика показа экранов
  function showView(index) {
    if (index < 0 || index >= views.length) return;

    // Если пытаемся перейти на удаленные экраны 35-36 - делаем редирект
    if (index >= 34) { // Экран 34 имеет index 33, экран 35 был бы index 34
      redirectToClient();
      return;
    }

    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('visible');
      modal.classList.add('hidden');
    });

    if (views[currentViewIndex])
      views[currentViewIndex].classList.remove("active");

    const nextView = views[index];
    nextView.classList.add("active");

    const mainContent = nextView.querySelector(".layout-main");
    if (mainContent) mainContent.scrollTop = 0;

    currentViewIndex = index;

    if (currentViewIndex > maxReachedIndex) {
      maxReachedIndex = currentViewIndex;
    }

    const navContent = globalHeader.querySelector('.nav-header__content');
    globalHeader.classList.remove("hidden");
    globalHeader.classList.remove("nav-header--final");
    if (navContent) navContent.classList.remove("hidden");

    // ИЗМЕНЕНИЕ: Логика хедера для нового потока
    if (currentViewIndex < QUIZ_START_INDEX) {
       globalHeader.classList.add("hidden");
    } 
    else if (currentViewIndex >= 33) { // Экран 34 и далее (хотя далее у нас редирект)
       globalHeader.classList.add("nav-header--final");
       if (navContent) navContent.classList.add("hidden");
    } 
    else {
       updateQuizProgress();
    }

    fixScrollbar();
    checkNavState();
  }

  function startLoader() {
    const bar = document.getElementById("loading-bar-fill");
    const txt = document.getElementById("loading-text");
    if (!bar || !txt) return;
    let progress = 0;
    const timer = setInterval(() => {
      progress += 1;
      bar.style.width = `${progress}%`;
      txt.textContent = `${progress}%`;
      if (progress >= 100) {
        clearInterval(timer);
        setTimeout(() => showView(1), 500);
      }
    }, 30);
  }

  document.body.addEventListener("click", (e) => {
    const target = e.target;
    const nextBtn = target.closest('[data-trigger="next"]');

    if (nextBtn) {
      if (
        nextBtn.classList.contains("card") ||
        nextBtn.classList.contains("card-person") ||
        nextBtn.classList.contains("card--small")
      ) {
        const parent = nextBtn.parentElement;
        parent
          .querySelectorAll(".card, .card-person, .card--small")
          .forEach((card) => card.classList.remove("selected"));
        nextBtn.classList.add("selected");
        if (navigator.vibrate) navigator.vibrate(5);
      }

      const currentView = views[currentViewIndex];
      if (currentView && currentView.id === "view-32") {
        const isSkip = target.classList.contains("link");
        if (typeof window.saveUserSelectedDate === "function") {
          window.saveUserSelectedDate(isSkip);
        }
      }

      showView(currentViewIndex + 1);
      return;
    }

    const backBtn = target.closest('[data-trigger="back"]');
    if (backBtn) {
      showView(currentViewIndex - 1);
      return;
    }

    const toggleCard = target.closest('[data-action="toggle"]');
    if (toggleCard) {
      toggleCard.classList.toggle("selected");
      const imgId = toggleCard.getAttribute("data-img");
      if (imgId) {
        const layer = document.getElementById(imgId);
        if (layer) {
          if (toggleCard.classList.contains("selected"))
            layer.classList.add("visible");
          else layer.classList.remove("visible");
        }
      }
      if (navigator.vibrate) navigator.vibrate(5);
      checkNavState();
      return;
    }
  });

  views.forEach((v, i) => v.classList.toggle("active", i === 0));
  globalHeader.classList.add("hidden");
  if (currentViewIndex === 0) startLoader();

  const fastingToggle = document.getElementById("fasting-toggle");
  if (fastingToggle) {
    fastingToggle.addEventListener("click", () => {
      fastingToggle.classList.toggle("active");
      if (navigator.vibrate) navigator.vibrate(5);
    });
  }

  setTimeout(() => {
    if (typeof initSwiperDatePicker === "function") {
      initSwiperDatePicker();
    }
  }, 300);

  function updateView33() {
    const curW_kg = parseFloat(window.userWeightKg) || 0;
    const targetW_kg = parseFloat(window.userTargetWeightKg) || 0;

    const unitToggle = document.querySelector("#view-27 .toggle-btn.active");
    const unit = unitToggle ? unitToggle.dataset.unit : "kg";
    const isLb = (unit === "lb");

    const toDisplay = (valKg) => {
      if (isLb) {
        return Math.round(valKg * 2.20462);
      }
      return Math.round(valKg);
    };

    const startVal = toDisplay(curW_kg);
    const targetVal = toDisplay(targetW_kg);

    const goalDisplayElement = document.getElementById("goal-weight-display");
    if (goalDisplayElement) {
        goalDisplayElement.textContent = `${targetVal} ${unit}`;
    }

    const midVal = Math.round((startVal + targetVal) / 2);

    document.getElementById("w-badge-1").textContent = `${startVal} ${unit}`;
    document.getElementById("w-badge-2").textContent = `${midVal} ${unit}`;
    document.getElementById("w-badge-3").textContent = `${targetVal} ${unit}`;
    document.getElementById("w-badge-4").textContent = `${targetVal} ${unit}`;

    const months = [
      "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
      "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
    ];
    let now = new Date();

    for (let i = 1; i <= 4; i++) {
      let d = new Date(now.getFullYear(), now.getMonth() + (i - 1), 1);
      let mName = months[d.getMonth()];
      let yName = d.getFullYear();
      const dateEl = document.getElementById(`chart-date-${i}`);
      if (dateEl) {
          dateEl.textContent = `${mName} ${yName}`;
      }
    }
  }

  const v33 = document.getElementById("view-33");
  if (v33) {
    const observer33 = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.target.id === "view-33" &&
          mutation.target.classList.contains("active")
        ) {
          updateView33();
        }
      });
    });
    observer33.observe(v33, { attributes: true, attributeFilter: ["class"] });
  }

  /* =========================
   НОВАЯ ЛОГИКА ЭКРАНА 34 (с редиректом вместо перехода на 35)
   ========================= */
  async function startAnalysisScenario() {
    const view34 = document.getElementById('view-34');
    const lineFill = document.getElementById('timeline-fill');
    
    const items = [
      document.getElementById('tl-item-1'),
      document.getElementById('tl-item-2'),
      document.getElementById('tl-item-3'),
      document.getElementById('tl-item-4')
    ];
    
    if (!lineFill || !items[0]) return;

    lineFill.style.transition = 'none';
    lineFill.style.height = '0%';
    items.forEach(item => {
      item.classList.remove('completed', 'pulsing', 'active');
    });

    items[0].classList.add('completed');
    setTimeout(() => { lineFill.style.transition = 'height 1.5s linear'; }, 50);

    const isActive = () => view34.classList.contains('active');
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const animateLineTo = async (percent) => {
      if (!isActive()) return;
      lineFill.style.height = `${percent}%`;
      await wait(1500);
    };

    const waitForPopup = (popupId) => {
      return new Promise(resolve => {
        if (!isActive()) { resolve(); return; }

        const popup = document.getElementById(popupId);
        if (!popup) { resolve(); return; }

        popup.classList.remove('hidden');
        setTimeout(() => popup.classList.add('visible'), 10);
        
        const btns = popup.querySelectorAll('.btn-modal');
        
        const handler = () => {
          popup.classList.remove('visible');
          setTimeout(() => popup.classList.add('hidden'), 300);
          btns.forEach(b => b.removeEventListener('click', handler));
          if (navigator.vibrate) navigator.vibrate(5);
          resolve();
        };

        btns.forEach(b => b.addEventListener('click', handler));
      });
    };

    // --- СЦЕНАРИЙ АНИМАЦИИ ---
    await wait(500);
    if (!isActive()) return;

    await animateLineTo(33);
    if (!isActive()) return;

    items[1].classList.add('pulsing');
    await wait(3000);
    items[1].classList.remove('pulsing');
    if (!isActive()) return;

    if (isActive()) {
        await waitForPopup('popup-1');
    }
    if (!isActive()) return;

    items[1].classList.add('completed');

    await animateLineTo(66);
    if (!isActive()) return;

    items[2].classList.add('pulsing');
    await wait(3000);
    items[2].classList.remove('pulsing');
    if (!isActive()) return;

    if (isActive()) {
        await waitForPopup('popup-2');
    }
    if (!isActive()) return;

    items[2].classList.add('completed');

    await animateLineTo(100);
    if (!isActive()) return;

    items[3].classList.add('pulsing');
    await wait(3000);
    items[3].classList.remove('pulsing');
    if (!isActive()) return;
    
    items[3].classList.add('completed');

    // ИЗМЕНЕНИЕ: Вместо перехода на экран 35 - сразу редирект
    await wait(500);
    if (!isActive()) return;
    
    // Активируем редирект после завершения анимации
    redirectToClient();
  }

  const v34 = document.getElementById("view-34");
  const video34 = document.getElementById("video-analysis");

  if (v34) {
    const observer34 = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.classList.contains("active")) {
          startAnalysisScenario();
          if (video34) {
            video34.currentTime = 0;
            video34.play().catch(e => console.log("Autoplay prevented:", e));
          }
        } else {
          if (video34) {
            video34.pause();
          }
        }
      });
    });
    observer34.observe(v34, { attributes: true, attributeFilter: ["class"] });
  }

}); // Конец DOMContentLoaded

/* --- ФУНКЦИЯ ДЛЯ DATE PICKER (SWIPER) --- */
function initSwiperDatePicker() {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  
  const monthWrapper = document.getElementById("wrapper-month");
  if (monthWrapper) {
    monthWrapper.innerHTML = months
      .map((m) => `<div class="swiper-slide">${m}</div>`)
      .join("");
  }

  const dayWrapper = document.getElementById("wrapper-day");
  if (dayWrapper) {
    let daysHtml = "";
    for (let i = 1; i <= 31; i++) {
      daysHtml += `<div class="swiper-slide">${i}</div>`;
    }
    dayWrapper.innerHTML = daysHtml;
  }

  const yearWrapper = document.getElementById("wrapper-year");
  if (yearWrapper) {
    const currentYear = new Date().getFullYear();
    let yearsHtml = "";
    for (let i = 0; i < 10; i++) {
      yearsHtml += `<div class="swiper-slide">${currentYear + i}</div>`;
    }
    yearWrapper.innerHTML = yearsHtml;
  }

  const config = {
    direction: "vertical",
    slidesPerView: 5,
    centeredSlides: true,
    loop: true,
    mousewheel: true,
    grabCursor: true,
    slideToClickedSlide: true,
  };

  const swiperM = new Swiper(".swiper-month", config);
  const swiperY = new Swiper(".swiper-year", config);
  new Swiper(".swiper-day", config);

  window.userTargetDate = "";
  
  window.saveUserSelectedDate = function (isSkipped = false) {
    if (isSkipped) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const mName = months[futureDate.getMonth()]
        .substring(0, 3)
        .toUpperCase();
      const yName = futureDate.getFullYear().toString();
      window.userTargetDate = `${mName} ${yName}`;
    } else {
      const activeMonthText =
        swiperM.slides[swiperM.activeIndex].textContent.trim();
      const activeYearText =
        swiperY.slides[swiperY.activeIndex].textContent.trim();

      const mShort = activeMonthText.substring(0, 3).toUpperCase();
      window.userTargetDate = `${mShort} ${activeYearText}`;
    }
    console.log("Target Date Saved:", window.userTargetDate);
  };
}

// --- ЭКРАН 25-26 ---
document.addEventListener("DOMContentLoaded", () => {
  const view25 = document.getElementById("view-25");
  
  if (view25) {
    const btnContainer = document.getElementById("btn-progress-container");
    const btnFill = document.getElementById("btn-progress-fill");
    const btnText = document.getElementById("btn-progress-text");
    
    let hasAnimated25 = false; 

    const observer25 = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.classList.contains("active")) {
          runProgressButtonAnimation();
        } else {
          resetProgressButton();
        }
      });
    });

    observer25.observe(view25, { attributes: true, attributeFilter: ["class"] });

    function runProgressButtonAnimation() {
      btnFill.style.width = '0%';
      btnText.textContent = 'Progress 0%';
      btnContainer.classList.remove('ready');
      btnContainer.removeAttribute('data-trigger');
      
      let startTime = null;
      const duration = 4000;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        
        let percent = Math.min((progress / duration) * 100, 100);
        
        btnFill.style.width = `${percent}%`;
        btnText.textContent = `Progress ${Math.floor(percent)}%`;

        if (progress < duration) {
          window.requestAnimationFrame(step);
        } else {
          finishAnimation();
        }
      }

      window.requestAnimationFrame(step);
    }

    function finishAnimation() {
      btnFill.style.width = '100%';
      btnText.textContent = 'Continue';
      btnContainer.classList.add('ready');
      btnContainer.setAttribute('data-trigger', 'next');
      
      if (navigator.vibrate) navigator.vibrate(50);
    }

    function resetProgressButton() {
       btnFill.style.width = '0%';
       btnText.textContent = 'Progress 0%';
       btnContainer.classList.remove('ready');
       btnContainer.removeAttribute('data-trigger');
    }
  }

  const view26 = document.getElementById("view-26");
  if (!view26) return;

  const btns = view26.querySelectorAll(".toggle-btn");
  const groupCm = view26.querySelector("#input-cm-group");
  const groupFt = view26.querySelector("#input-ft-group");
  const btnNext = view26.querySelector("#btn-next");

  const inputCm = view26.querySelector("#val-cm");
  const inputFt = view26.querySelector("#val-ft");
  const inputIn = view26.querySelector("#val-in");
  const inputs = view26.querySelectorAll(".input-huge");

  const banner = view26.querySelector("#info-banner");
  const iconInfo = view26.querySelector("#icon-info");
  const iconError = view26.querySelector("#icon-error");
  const bannerTitle = view26.querySelector("#banner-title");
  const bannerDesc = view26.querySelector("#banner-desc");

  let currentUnit = "cm";
  let savedHeightCm = 0;

  function cmToFtIn(cm) {
    const realFeet = cm / 30.48;
    let ft = Math.floor(realFeet);
    let inches = Math.round((realFeet - ft) * 12);

    if (inches === 12) {
      ft += 1;
      inches = 0;
    }
    return { ft, in: inches };
  }

  function ftInToCm(ft, inches) {
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inches) || 0;
    return Math.round(f * 30.48 + i * 2.54);
  }

  function updateState() {
    if (currentUnit === "cm") {
      savedHeightCm = parseInt(inputCm.value) || 0;
    } else {
      savedHeightCm = ftInToCm(inputFt.value, inputIn.value);
    }

    if (savedHeightCm === 0) {
      setBanner("info");
      btnNext.disabled = true;
      return;
    }

    if (savedHeightCm < 100 || savedHeightCm > 300) {
      setBanner("error");
      btnNext.disabled = true;
    } else {
      setBanner("info");
      btnNext.disabled = false;
      window.userHeightCm = savedHeightCm;
      window.userHeightUnit = currentUnit;
    }
  }

  function setBanner(state) {
    if (state === "error") {
      banner.classList.add("error");
      iconInfo.classList.add("hidden");
      iconError.classList.remove("hidden");
      bannerTitle.textContent = "Please double-check and enter valid height";
      bannerDesc.classList.add("hidden");
    } else {
      banner.classList.remove("error");
      iconError.classList.add("hidden");
      iconInfo.classList.remove("hidden");
      bannerTitle.textContent = "Calculating your BMI";
      bannerDesc.textContent =
        "Body mass index (BMI) is a metric of body fat percentage commonly used to estimate risk levels of potential health problems.";
      bannerDesc.classList.remove("hidden");
    }
  }

  inputs.forEach((input) => {
    input.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
      updateState();
    });
  });

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;

      const newUnit = btn.dataset.unit;

      if (newUnit === "ft") {
        const cmVal = parseInt(inputCm.value);
        if (cmVal) {
          const res = cmToFtIn(cmVal);
          inputFt.value = res.ft;
          inputIn.value = res.in;
        } else {
          inputFt.value = "";
          inputIn.value = "";
        }

        groupCm.classList.add("hidden");
        groupFt.classList.remove("hidden");
      } else {
        const ftVal = inputFt.value;
        const inVal = inputIn.value;

        if (ftVal || inVal) {
          inputCm.value = ftInToCm(ftVal, inVal);
        } else {
          inputCm.value = "";
        }

        groupFt.classList.add("hidden");
        groupCm.classList.remove("hidden");
      }

      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentUnit = newUnit;
      updateState();
    });
  });
});

// --- ЭКРАН 27 ---
document.addEventListener("DOMContentLoaded", () => {
  const view27 = document.getElementById("view-27");
  if (!view27) return;

  const btns = view27.querySelectorAll(".toggle-btn");
  const groupKg = view27.querySelector("#input-weight-kg-group");
  const groupLb = view27.querySelector("#input-weight-lb-group");
  const btnNext = view27.querySelector("#btn-next-weight");

  const inputKg = view27.querySelector("#val-weight-kg");
  const inputLb = view27.querySelector("#val-weight-lb");
  const inputs = view27.querySelectorAll(".input-huge");

  const banner = view27.querySelector("#info-banner-weight");
  const iconInfo = view27.querySelector("#icon-info-weight");
  const iconError = view27.querySelector("#icon-error-weight");
  const iconSuccess = view27.querySelector("#icon-success-weight");
  const bannerTitle = view27.querySelector("#banner-title-weight");
  const bannerDesc = view27.querySelector("#banner-desc-weight");

  let currentUnit = "kg";
  let savedWeightKg = 0;

  const KG_TO_LB = 2.20462;

  function kgToLb(kg) {
    return Math.round(kg * KG_TO_LB);
  }
  function lbToKg(lb) {
    return Math.round(lb / KG_TO_LB);
  }

  function calculateBMI(weightKg, heightCm) {
    if (!heightCm || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return (weightKg / (heightM * heightM)).toFixed(1);
  }

  function updateState() {
    if (currentUnit === "kg") {
      savedWeightKg = parseFloat(inputKg.value) || 0;
    } else {
      const lbVal = parseFloat(inputLb.value) || 0;
      savedWeightKg = lbToKg(lbVal);
    }

    banner.classList.remove("error", "success");
    iconError.classList.add("hidden");
    iconInfo.classList.remove("hidden");
    btnNext.disabled = false;

    if (savedWeightKg < 20 && savedWeightKg > 0) {
      setBannerStyle("error");
      bannerTitle.textContent = "Your weight is too low for this program.";
      bannerDesc.classList.add("hidden");
      btnNext.disabled = true;
      return;
    }

    if (savedWeightKg > 299) {
      setBannerStyle("error");
      bannerTitle.textContent =
        "Your weight is too high to work out with this program.";
      bannerDesc.classList.add("hidden");
      btnNext.disabled = true;
      return;
    }

    if (savedWeightKg === 0) {
      bannerTitle.textContent = "Enter your weight";
      bannerDesc.textContent =
        "We need your weight to calculate your BMI and build a personalized plan.";
      bannerDesc.classList.remove("hidden");
      btnNext.disabled = true;
      return;
    }

    const heightCm = window.userHeightCm || 170;
    const bmi = calculateBMI(savedWeightKg, heightCm);
    window.userWeightKg = savedWeightKg;
    window.userBMI = bmi;

    bannerDesc.classList.remove("hidden");

    if (bmi < 18.5) {
      setBannerStyle("error");
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>underweight</b>.`;
      bannerDesc.textContent =
        "You have some work ahead of you, but it's great that you're taking this first step. We'll use your BMI to create a program just for you.";
    }
    else if (bmi >= 18.5 && bmi <= 24.9) {
      setBannerStyle("success");
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>normal</b>`;
      bannerDesc.textContent =
        "You're starting from a great place! Now we'll use your BMI to create a program tailored to your needs.";
    }
    else if (bmi >= 25.0 && bmi <= 29.9) {
      setBannerStyle("error");
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>overweight</b>`;
      bannerDesc.textContent =
        "You have some work ahead of you, but it's great that you're taking this first step. We'll use your BMI to create a program just for you.";
    }
    else {
      setBannerStyle("error");
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>obese</b>`;
      bannerDesc.textContent =
        "You have some work ahead of you, but it's great that you're taking this first step. We'll use your BMI to create a program just for you.";
    }
  }

  function setBannerStyle(type) {
    iconInfo.classList.add("hidden");
    iconError.classList.add("hidden");
    iconSuccess.classList.add("hidden");

    if (type === "error") {
      banner.classList.add("error");
      iconError.classList.remove("hidden");
    } else if (type === "success") {
      banner.classList.add("success");
      iconSuccess.classList.remove("hidden");
    } else {
      iconInfo.classList.remove("hidden");
    }
  }

  inputs.forEach((inp) => {
    inp.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
      updateState();
    });
  });

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;

      const newUnit = btn.dataset.unit;

      if (newUnit === "lb") {
        const kgVal = parseFloat(inputKg.value);
        if (kgVal) inputLb.value = kgToLb(kgVal);
        else inputLb.value = "";

        groupKg.classList.add("hidden");
        groupLb.classList.remove("hidden");
      } else {
        const lbVal = parseFloat(inputLb.value);
        if (lbVal) inputKg.value = lbToKg(lbVal);
        else inputKg.value = "";

        groupLb.classList.add("hidden");
        groupKg.classList.remove("hidden");
      }

      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentUnit = newUnit;
      updateState();
    });
  });
});

// --- ЭКРАН 28 ---
document.addEventListener("DOMContentLoaded", () => {
  const view28 = document.getElementById("view-28");
  if (!view28) return;

  const btns = view28.querySelectorAll(".toggle-btn");
  const groupKg = view28.querySelector("#input-target-kg-group");
  const groupLb = view28.querySelector("#input-target-lb-group");
  const btnNext = view28.querySelector("#btn-next-target");

  const inputKg = view28.querySelector("#val-target-kg");
  const inputLb = view28.querySelector("#val-target-lb");
  const inputs = view28.querySelectorAll(".input-huge");

  const banner = view28.querySelector("#info-banner-target");
  const iconInfo = view28.querySelector("#icon-info-target");
  const iconError = view28.querySelector("#icon-error-target");

  const bannerTitle = view28.querySelector("#banner-title-target");
  const bannerDesc = view28.querySelector("#banner-desc-target");

  let currentUnit = "kg";
  let targetWeightKg = 0;

  const KG_TO_LB = 2.20462;
  function kgToLb(kg) {
    return Math.round(kg * KG_TO_LB);
  }
  function lbToKg(lb) {
    return Math.round(lb / KG_TO_LB);
  }

  function calculateWeightRange(heightCm) {
    if (!heightCm) return { min: 0, max: 0 };
    const heightM = heightCm / 100;
    const minKg = 18.5 * (heightM * heightM);
    const maxKg = 24.9 * (heightM * heightM);
    return {
      min: Math.round(minKg),
      max: Math.round(maxKg),
    };
  }

  function updateState() {
    if (currentUnit === "kg") {
      targetWeightKg = parseFloat(inputKg.value) || 0;
    } else {
      const lbVal = parseFloat(inputLb.value) || 0;
      targetWeightKg = lbToKg(lbVal);
    }

    window.userTargetWeightKg = targetWeightKg;

    setBannerStyle("info");
    btnNext.disabled = false;

    if (targetWeightKg === 0) {
      bannerTitle.textContent = "Target weight";
      bannerDesc.textContent =
        "Enter your goal weight to see how much you need to lose.";
      btnNext.disabled = true;
      return;
    }

    const userHeight = window.userHeightCm || 170;
    const currentWeight = window.userWeightKg || 80;

    const range = calculateWeightRange(userHeight);
    window.recommendedMinWeight = range.min;
    window.recommendedMaxWeight = range.max;

    let displayMin = range.min;
    let displayMax = range.max;
    if (currentUnit === "lb") {
      displayMin = kgToLb(range.min);
      displayMax = kgToLb(range.max);
    }

    if (targetWeightKg < 20) {
      setBannerStyle("error");
      bannerTitle.textContent = "Uh-oh! Low weight alert!";
      bannerDesc.textContent = `A normal weight range for your height is between ${displayMin} and ${displayMax}. Any weight below ${displayMin} is classified as underweight and is not recommended by World Health Organization.`;
      btnNext.disabled = true;
      return;
    }

    if (targetWeightKg >= currentWeight) {
      setBannerStyle("error");
      bannerTitle.textContent =
        "Your target weight should be less than your current weight";
      bannerDesc.textContent =
        "Please double check. You might have used metric system instead of imperial. You can change preferred unit system at the top of this page";
      btnNext.disabled = true;
      return;
    }

    if (targetWeightKg >= 20 && targetWeightKg < range.min) {
      setBannerStyle("error");
      bannerTitle.textContent = "Uh-oh! Low weight alert!";
      bannerDesc.textContent = `A normal weight range for your height is between ${displayMin} and ${displayMax}. Any weight below ${displayMin} is classified as underweight and is not recommended by World Health Organization.`;
      return;
    }

    if (targetWeightKg >= range.min && targetWeightKg < currentWeight) {
      setBannerStyle("info");

      const lossPct = (
        ((currentWeight - targetWeightKg) / currentWeight) *
        100
      ).toFixed(1);
      window.weightLossPct = lossPct;

      bannerTitle.textContent = `Get moving: lose ${lossPct}% of your weight`;
      bannerDesc.textContent =
        "Working out just 5 minutes per day can significantly improve your overall well-being.";
      return;
    }
  }

  function setBannerStyle(type) {
    iconInfo.classList.add("hidden");
    iconError.classList.add("hidden");
    banner.classList.remove("error");

    if (type === "error") {
      banner.classList.add("error");
      iconError.classList.remove("hidden");
    } else {
      iconInfo.classList.remove("hidden");
    }
  }

  inputs.forEach((inp) => {
    inp.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
      updateState();
    });
  });

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      const newUnit = btn.dataset.unit;

      if (newUnit === "lb") {
        const kgVal = parseFloat(inputKg.value);
        if (kgVal) inputLb.value = kgToLb(kgVal);
        else inputLb.value = "";
        groupKg.classList.add("hidden");
        groupLb.classList.remove("hidden");
      } else {
        const lbVal = parseFloat(inputLb.value);
        if (lbVal) inputKg.value = lbToKg(lbVal);
        else inputKg.value = "";
        groupLb.classList.add("hidden");
        groupKg.classList.remove("hidden");
      }

      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentUnit = newUnit;
      updateState();
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  function updateView29() {
    const heightCm = window.userHeightCm || 170;
    const weightKg = window.userWeightKg || 65;
    const bmi = parseFloat(window.userBMI) || 22.5;
    const minW = window.recommendedMinWeight || 53;
    const maxW = window.recommendedMaxWeight || 81;

    let isLb = false;
    const lbBtn = document.querySelector(
      '#view-27 .toggle-btn[data-unit="lb"]'
    );
    if (lbBtn && lbBtn.classList.contains("active")) {
      isLb = true;
    }

    let isFt = false;
    const ftBtn = document.querySelector(
      '#view-26 .toggle-btn[data-unit="ft"]'
    );
    if (ftBtn && ftBtn.classList.contains("active")) {
      isFt = true;
    }

    let displayHeightStr = "";
    if (isFt) {
      const realFeet = heightCm / 30.48;
      let ft = Math.floor(realFeet);
      let inches = Math.round((realFeet - ft) * 12);
      if (inches === 12) {
        ft++;
        inches = 0;
      }
      displayHeightStr = `${ft}' ${inches}"`;
    } else {
      displayHeightStr = `${Math.round(heightCm)} cm`;
    }

    const toDisplayWeight = (kg) =>
      isLb ? Math.round(kg * 2.20462) : Math.round(kg);
    const unitLabel = isLb ? "lb" : "kg";

    document.getElementById("disp-height").textContent = displayHeightStr;
    document.getElementById("disp-weight").textContent = `${toDisplayWeight(
      weightKg
    )} ${unitLabel}`;
    document.getElementById("disp-bmi").textContent = bmi.toFixed(2);

    document.getElementById("disp-range").textContent = `${toDisplayWeight(
      minW
    )} - ${toDisplayWeight(maxW)} ${unitLabel}`;

    const topCard = document.getElementById("profile-top-card");
    const msgBox = document.getElementById("profile-message-box");

    topCard.classList.remove(
      "profile-card--green",
      "profile-card--blue",
      "profile-card--red"
    );
    msgBox.classList.remove(
      "profile-message-box--green",
      "profile-message-box--blue",
      "profile-message-box--red"
    );

    if (bmi <= 18.5) {
      topCard.classList.add("profile-card--blue");
      msgBox.classList.add("profile-message-box--blue");
      msgBox.innerHTML = `<span>‼️</span> You're at risk of health problems`;
    } else if (bmi >= 28.0) {
      topCard.classList.add("profile-card--red");
      msgBox.classList.add("profile-message-box--red");
      msgBox.innerHTML = `<span>🏃</span> Let's get in shape`;
    } else {
      topCard.classList.add("profile-card--green");
      msgBox.classList.add("profile-message-box--green");
      msgBox.innerHTML = `<span>🔥</span> You have a great figure, keep it up!`;
    }

    let gradPercent = 0;

    if (bmi <= 18.5) {
      gradPercent = (bmi / 18.5) * 20;
    } else if (bmi < 25) {
      gradPercent = 20 + ((bmi - 18.5) / (25 - 18.5)) * 20;
    } else if (bmi < 28) {
      gradPercent = 40 + ((bmi - 25) / (28 - 25)) * 20;
    } else if (bmi < 32) {
      gradPercent = 60 + ((bmi - 28) / (32 - 28)) * 20;
    } else {
      gradPercent = 80 + ((bmi - 32) / 10) * 20;
      if (gradPercent > 100) gradPercent = 100;
    }

    document.getElementById("triangle-gradient").style.left = `${gradPercent}%`;

    const titleStatus = document.getElementById("weight-status-title");
    const seg1 = document.getElementById("seg-1");
    const seg2 = document.getElementById("seg-2");
    const seg3 = document.getElementById("seg-3");
    const rowDiff = document.getElementById("row-diff");
    const diffVal = document.getElementById("disp-diff");

    [seg1, seg2, seg3].forEach((el) => (el.className = "css-scale-seg"));
    rowDiff.classList.add("hidden");

    let cssPercent = 0;

    if (bmi <= 18.5) {
      titleStatus.textContent = "Your weight is within the low range";
      seg1.classList.add("blue");
      cssPercent = (bmi / 18.5) * 33.33;
      if (cssPercent < 0) cssPercent = 0;

      if (weightKg < minW) {
        rowDiff.classList.remove("hidden");
        const diff = toDisplayWeight(minW - weightKg);
        diffVal.textContent = `+${diff} ${unitLabel}`;
      }
    } else if (bmi >= 28.0) {
      titleStatus.textContent = "Your weight is within the high range";
      seg3.classList.add("red");
      cssPercent = 66.66 + ((bmi - 28.0) / (40.0 - 28.0)) * 33.34;
      if (cssPercent > 100) cssPercent = 100;

      if (weightKg > maxW) {
        rowDiff.classList.remove("hidden");
        const diff = toDisplayWeight(weightKg - maxW);
        diffVal.textContent = `-${diff} ${unitLabel}`;
      }
    } else {
      titleStatus.textContent = "Your weight is within the normal range";
      seg2.classList.add("green");
      cssPercent = 33.33 + ((bmi - 18.5) / (28.0 - 18.5)) * 33.33;
    }

    document.getElementById("triangle-css").style.left = `${cssPercent}%`;
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.target.id === "view-29" &&
        mutation.target.classList.contains("active")
      ) {
        updateView29();
      }
    });
  });

  const v29 = document.getElementById("view-29");
  if (v29) {
    observer.observe(v29, { attributes: true, attributeFilter: ["class"] });
  }
});

// ========== AMPLITUDE MINIMAL TRACKING ==========
(function() {
  let currentScreen = '';
  
  function trackScreen() {
    const activeView = document.querySelector('.view.active');
    if (!activeView || !window.amplitude) return;
    
    const screenId = activeView.id;
    if (screenId === currentScreen) return;
    
    currentScreen = screenId;
    const screenNum = parseInt(screenId.replace('view-', '')) || 0;
    
    amplitude.logEvent('funnel_screen_viewed', {
      screen_id: screenId,
      screen_number: screenNum,
      timestamp: new Date().toISOString()
    });
    
    console.log('Amplitude: screen', screenId);
  }
  
  setInterval(trackScreen, 500);
})();

/* =========================
   РЕДИРЕКТ НА КЛИЕНТСКУЮ ЧАСТЬ (после экрана 34)
   ========================= */

function redirectToClient() {
  // Собираем данные пользователя
  const userData = {
    height_cm: window.userHeightCm || 0,
    weight_kg: window.userWeightKg || 0,
    target_weight_kg: window.userTargetWeightKg || 0,
    bmi: window.userBMI || 0,
    height_unit: window.userHeightUnit || 'cm',
    target_date: window.userTargetDate || '',
    timestamp: new Date().toISOString(),
    session_id: window.amplitude ? amplitude.getSessionId() : Date.now()
  };

  // Логируем завершение воронки в Amplitude
  if (window.amplitude) {
    amplitude.logEvent('funnel_completed_to_client', {
      ...userData,
      screen_number: 34,
      transition_type: 'redirect'
    });
    
    amplitude.flush();
  }

  // Сохраняем данные в localStorage
  localStorage.setItem('slimkit_user_data', JSON.stringify(userData));

  // ★★★ НОВЫЙ РЕДИРЕКТ ★★★
  const redirectUrl = 'https://slimkit.health/walking/survey/?config=V3&stripeV64=true&fbpxls[]=walking6_indoor';
  
  console.log('Redirecting to:', redirectUrl);
  
  // Редирект
  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 300);
}

// Экспортируем функцию в глобальную область видимости
window.redirectToClient = redirectToClient;
