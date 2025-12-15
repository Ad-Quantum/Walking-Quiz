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

// Запуск Date Picker с небольшой задержкой
  setTimeout(() => {
    if (typeof initSwiperDatePicker === 'function') {
      initSwiperDatePicker();
    }
  }, 300);

});// Конец DOMContentLoaded

document.addEventListener('DOMContentLoaded', () => {
  const view26 = document.getElementById('view-26');
  if (!view26) return; 

  // --- ЭЛЕМЕНТЫ ---
  const btns = view26.querySelectorAll('.toggle-btn');
  const groupCm = view26.querySelector('#input-cm-group');
  const groupFt = view26.querySelector('#input-ft-group');
  const btnNext = view26.querySelector('#btn-next');
  
  // Поля ввода
  const inputCm = view26.querySelector('#val-cm');
  const inputFt = view26.querySelector('#val-ft');
  const inputIn = view26.querySelector('#val-in');
  const inputs = view26.querySelectorAll('.input-huge');

  // Плашка и ее содержимое
  const banner = view26.querySelector('#info-banner');
  const iconInfo = view26.querySelector('#icon-info');
  const iconError = view26.querySelector('#icon-error');
  const bannerTitle = view26.querySelector('#banner-title');
  const bannerDesc = view26.querySelector('#banner-desc');

  // Переменные состояния
  let currentUnit = 'cm'; // 'cm' или 'ft'
  let savedHeightCm = 0;  // Здесь храним актуальный рост в см

  // --- ФУНКЦИИ КОНВЕРТАЦИИ ---

  // Из СМ в Футы/Дюймы
  function cmToFtIn(cm) {
    const realFeet = cm / 30.48;
    let ft = Math.floor(realFeet);
    let inches = Math.round((realFeet - ft) * 12);
    
    if (inches === 12) { ft += 1; inches = 0; }
    return { ft, in: inches };
  }

  // Из Футов/Дюймов в СМ
  function ftInToCm(ft, inches) {
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inches) || 0;
    return Math.round((f * 30.48) + (i * 2.54));
  }

  // --- ВАЛИДАЦИЯ И ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---

  function updateState() {
    // 1. Определяем текущий рост в сантиметрах
    if (currentUnit === 'cm') {
      savedHeightCm = parseInt(inputCm.value) || 0;
    } else {
      savedHeightCm = ftInToCm(inputFt.value, inputIn.value);
    }

    // 2. Логика отображения
    
    // Если поле пустое -> Сброс в исходное состояние (Info), кнопка выключена
    if (savedHeightCm === 0) {
      setBanner('info');
      btnNext.disabled = true;
      return;
    }

    // Если значение недопустимое (<100 или >300) -> Ошибка
    if (savedHeightCm < 100 || savedHeightCm > 300) {
      setBanner('error');
      btnNext.disabled = true; // Кнопка неактивна
    } else {
      // Значение валидное -> Успех
      setBanner('info');
      btnNext.disabled = false; // Кнопка активна
    }
  }

  // Управление видом плашки
  function setBanner(state) {
    if (state === 'error') {
      banner.classList.add('error');
      
      iconInfo.classList.add('hidden');
      iconError.classList.remove('hidden');

      bannerTitle.textContent = 'Please double-check and enter valid height';
      bannerDesc.classList.add('hidden'); // Скрываем описание в ошибке
    } else {
      banner.classList.remove('error');
      
      iconError.classList.add('hidden');
      iconInfo.classList.remove('hidden');

      bannerTitle.textContent = 'Calculating your BMI';
      bannerDesc.textContent = 'Body mass index (BMI) is a metric of body fat percentage commonly used to estimate risk levels of potential health problems.';
      bannerDesc.classList.remove('hidden');
    }
  }

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

  // 1. Ввод цифр
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, ''); // Только цифры
      updateState();
    });
  });

  // 2. Переключение вкладок
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Не делаем ничего, если кликнули на уже активную кнопку
      if (btn.classList.contains('active')) return;

      const newUnit = btn.dataset.unit;

      // Конвертация значений ПЕРЕД переключением
      if (newUnit === 'ft') {
        // Переход CM -> FT
        const cmVal = parseInt(inputCm.value);
        if (cmVal) {
          const res = cmToFtIn(cmVal);
          inputFt.value = res.ft;
          inputIn.value = res.in;
        } else {
          inputFt.value = '';
          inputIn.value = '';
        }
        
        groupCm.classList.add('hidden');
        groupFt.classList.remove('hidden');

      } else {
        // Переход FT -> CM
        const ftVal = inputFt.value;
        const inVal = inputIn.value;
        
        if (ftVal || inVal) {
          inputCm.value = ftInToCm(ftVal, inVal);
        } else {
          inputCm.value = '';
        }

        groupFt.classList.add('hidden');
        groupCm.classList.remove('hidden');
      }

      // Переключаем визуальный стиль кнопок
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Обновляем состояние
      currentUnit = newUnit;
      updateState();
    });
  });
});
