document.addEventListener("DOMContentLoaded", () => {
  const views = Array.from(document.querySelectorAll(".view"));
  let currentViewIndex = 0;
  const QUIZ_START_INDEX = 3; 

  function showView(index) {
    if (index < 0 || index >= views.length) return;
    if (views[currentViewIndex]) views[currentViewIndex].classList.remove("active");
    const nextView = views[index];
    nextView.classList.add("active");
    nextView.scrollTop = 0;
    currentViewIndex = index;
    if (currentViewIndex >= QUIZ_START_INDEX) updateQuizProgress();
  }

  function updateQuizProgress() {
    const activeView = views[currentViewIndex];
    const progressBar = activeView.querySelector(".step-progress");
    if (!progressBar) return;
    const currentStep = currentViewIndex - QUIZ_START_INDEX + 1; 
    const fill = progressBar.querySelector(".step-progress__fill");
    const dots = progressBar.querySelectorAll(".step-dot");
    const totalSteps = dots.length;
    const percent = Math.min((currentStep / totalSteps) * 100, 100);
    if (fill) fill.style.width = `${percent}%`;
    dots.forEach((dot, index) => {
      if (index < currentStep) dot.classList.add("active");
      else dot.classList.remove("active");
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
      if (nextBtn.classList.contains('card-body')) {
        const parent = nextBtn.parentElement;
        parent.querySelectorAll('.card-body').forEach(card => card.classList.remove('selected'));
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
      if (navigator.vibrate) navigator.vibrate(5);
      return;
    }
  });

  views.forEach((v, i) => v.classList.toggle("active", i === 0));
  if (currentViewIndex === 0) startLoader();
});
