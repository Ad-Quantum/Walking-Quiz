document.addEventListener("DOMContentLoaded", () => {
  const views = Array.from(document.querySelectorAll(".view"));
  const globalHeader = document.getElementById("global-header");
  let currentViewIndex = 0;
  const QUIZ_START_INDEX = 3; 

  function fixScrollbar() {
    const activeMain = document.querySelector('.view.active .layout-main');
    if (activeMain) {
      const scrollbarWidth = activeMain.offsetWidth - activeMain.clientWidth;
      document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
    } else {
      document.documentElement.style.setProperty('--scrollbar-width', '0px');
    }
  }

  function measureHeader() {
    if (globalHeader && !globalHeader.classList.contains('hidden')) {
      const height = globalHeader.offsetHeight;
      document.documentElement.style.setProperty('--header-h', (height + 10) + 'px');
    }
  }

  function showView(index) {
    if (index < 0 || index >= views.length) return;
    if (views[currentViewIndex]) views[currentViewIndex].classList.remove("active");
    const nextView = views[index];
    nextView.classList.add("active");
    const mainContent = nextView.querySelector('.layout-main');
    if (mainContent) mainContent.scrollTop = 0;
    const splitCenter = nextView.querySelector('.split-layout__center');
    if (splitCenter) splitCenter.scrollTop = 0;
    currentViewIndex = index;

    if (currentViewIndex >= QUIZ_START_INDEX) {
      globalHeader.classList.remove("hidden");
      updateQuizProgress();
      setTimeout(() => { measureHeader(); fixScrollbar(); }, 0);
    } else {
      globalHeader.classList.add("hidden");
      setTimeout(fixScrollbar, 0);
    }
  }

  window.addEventListener('resize', () => { measureHeader(); fixScrollbar(); });

  function updateQuizProgress() {
    const progressBar = globalHeader.querySelector(".step-progress");
    if (!progressBar) return;
    const currentStep = currentViewIndex - QUIZ_START_INDEX + 1; 
    const fill = progressBar.querySelector(".step-progress__fill");
    const dots = progressBar.querySelectorAll(".step-dot");
    const totalSteps = dots.length;
    const percent = Math.min((currentStep / totalSteps) * 100, 100);
    if (fill) fill.style.width = `${percent}%`;
    dots.forEach((dot, index) => {
      if (index < currentStep) dot.classList.add("active"); else dot.classList.remove("active");
    });
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
      if (nextBtn.classList.contains('card') || nextBtn.classList.contains('card-person') || nextBtn.classList.contains('card--small')) {
        const parent = nextBtn.parentElement;
        parent.querySelectorAll('.card, .card-person, .card--small').forEach(card => card.classList.remove('selected'));
        nextBtn.classList.add('selected');
        if (navigator.vibrate) navigator.vibrate(5);
      }
      showView(currentViewIndex + 1);
      return;
    }
    const backBtn = target.closest('[data-trigger="back"]');
    if (backBtn) { showView(currentViewIndex - 1); return; }
    const toggleCard = target.closest('[data-action="toggle"]');
    if (toggleCard) {
      toggleCard.classList.toggle("selected");
      const imgId = toggleCard.getAttribute("data-img");
      if (imgId) {
        const layer = document.getElementById(imgId);
        if (layer) {
          if (toggleCard.classList.contains("selected")) layer.classList.add("visible"); else layer.classList.remove("visible");
        }
      }
      if (navigator.vibrate) navigator.vibrate(5);
      return;
    }
  });

  views.forEach((v, i) => v.classList.toggle("active", i === 0));
  globalHeader.classList.add("hidden");
  if (currentViewIndex === 0) startLoader();

    // Логика для Toggle Switch (Экран 22)
  const fastingToggle = document.getElementById('fasting-toggle');
  if (fastingToggle) {
    fastingToggle.addEventListener('click', () => {
      fastingToggle.classList.toggle('active');
      if (navigator.vibrate) navigator.vibrate(5);
    });
  }
});// Конец DOMContentLoaded
