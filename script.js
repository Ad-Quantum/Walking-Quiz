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

/* --- ФУНКЦИЯ ДЛЯ DATE PICKER (SWIPER) --- */
function initSwiperDatePicker() {
  // 1. Генерация данных

  // Месяцы
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthWrapper = document.getElementById('wrapper-month');
  if (monthWrapper) {
    monthWrapper.innerHTML = months.map(m => `<div class="swiper-slide">${m}</div>`).join('');
  }

  // Дни (1..31)
  const dayWrapper = document.getElementById('wrapper-day');
  if (dayWrapper) {
    let daysHtml = '';
    for (let i = 1; i <= 31; i++) {
      daysHtml += `<div class="swiper-slide">${i}</div>`;
    }
    dayWrapper.innerHTML = daysHtml;
  }

  // Годы (Текущий + 10 лет вперед)
  const yearWrapper = document.getElementById('wrapper-year');
  if (yearWrapper) {
    const currentYear = new Date().getFullYear();
    let yearsHtml = '';
    for (let i = 0; i < 10; i++) {
      yearsHtml += `<div class="swiper-slide">${currentYear + i}</div>`;
    }
    yearWrapper.innerHTML = yearsHtml;
  }

  // 2. Инициализация Swiper
  // Общие настройки для всех трех колонок
  const config = {
    direction: 'vertical',
    slidesPerView: 5,        // Показываем 5 элементов (2 сверху, 1 центр, 2 снизу)
    centeredSlides: true,    // Активный элемент по центру
    loop: true,              // Бесконечная прокрутка
    mousewheel: true,        // Поддержка колесика мыши
    grabCursor: true,        // Курсор-рука
    slideToClickedSlide: true // Клик по дате делает её активной
  };

  // Создаем экземпляры
  new Swiper('.swiper-month', config);
  new Swiper('.swiper-day', config);
  new Swiper('.swiper-year', config);
}

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
      window.userHeightCm = savedHeightCm; // Сохраняем рост глобально для экрана 27
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

document.addEventListener('DOMContentLoaded', () => {
  const view27 = document.getElementById('view-27');
  if (!view27) return;

  // --- ЭЛЕМЕНТЫ ---
  const btns = view27.querySelectorAll('.toggle-btn');
  const groupKg = view27.querySelector('#input-weight-kg-group');
  const groupLb = view27.querySelector('#input-weight-lb-group');
  const btnNext = view27.querySelector('#btn-next-weight');

  const inputKg = view27.querySelector('#val-weight-kg');
  const inputLb = view27.querySelector('#val-weight-lb');
  const inputs = view27.querySelectorAll('.input-huge');

  // Плашка
  const banner = view27.querySelector('#info-banner-weight');
  const iconInfo = view27.querySelector('#icon-info-weight');
  const iconError = view27.querySelector('#icon-error-weight');
  const iconSuccess = view27.querySelector('#icon-success-weight');
  const bannerTitle = view27.querySelector('#banner-title-weight');
  const bannerDesc = view27.querySelector('#banner-desc-weight');

  // Состояние
  let currentUnit = 'kg'; // 'kg' или 'lb'
  let savedWeightKg = 0;

  // --- КОНВЕРТАЦИЯ ---
  const KG_TO_LB = 2.20462;

  function kgToLb(kg) { return Math.round(kg * KG_TO_LB); }
  function lbToKg(lb) { return Math.round(lb / KG_TO_LB); }

  // --- РАСЧЕТ BMI ---
  function calculateBMI(weightKg, heightCm) {
    if (!heightCm || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return (weightKg / (heightM * heightM)).toFixed(1); // Округляем до 1 знака (напр. 24.5)
  }

  // --- ЛОГИКА ОТОБРАЖЕНИЯ (STATES) ---
  function updateState() {
    // 1. Читаем вес
    if (currentUnit === 'kg') {
      savedWeightKg = parseFloat(inputKg.value) || 0;
    } else {
      const lbVal = parseFloat(inputLb.value) || 0;
      savedWeightKg = lbToKg(lbVal);
    }

    // Сброс классов плашки
    banner.classList.remove('error', 'success');
    iconError.classList.add('hidden');
    iconInfo.classList.remove('hidden'); // По умолчанию показываем info (синюю/зеленую иконку)
    btnNext.disabled = false; // По умолчанию активна, выключим если ошибка

    // 2. Проверки лимитов (Error State 1 & 6)
    // 4.1 Вес < 20 кг
    if (savedWeightKg < 20 && savedWeightKg > 0) {
      setBannerStyle('error');
      bannerTitle.textContent = "Your weight is too low for this program.";
      bannerDesc.classList.add('hidden'); // Текст не указан в ТЗ для этого кейса, скрываем или оставляем пустым
      btnNext.disabled = true;
      return;
    }
    
    // 4.6 Вес > 299 кг (т.е. 300 и больше)
    if (savedWeightKg > 299) {
      setBannerStyle('error');
      bannerTitle.textContent = "Your weight is too high to work out with this program.";
      bannerDesc.classList.add('hidden');
      btnNext.disabled = true;
      return;
    }

    // Если пусто или 0
    if (savedWeightKg === 0) {
      bannerTitle.textContent = "Enter your weight";
      bannerDesc.textContent = "We need your weight to calculate your BMI and build a personalized plan.";
      bannerDesc.classList.remove('hidden');
      btnNext.disabled = true;
      return;
    }

    // 3. Расчет BMI
    // Берем рост из глобальной переменной (которую мы сохранили на экране 26)
    // Если пользователь пропустил экран 26 (в dev режиме), берем дефолт 170 см
    const heightCm = window.userHeightCm || 170; 

    const bmi = calculateBMI(savedWeightKg, heightCm);
    window.userWeightKg = savedWeightKg;
    window.userBMI = bmi;

    bannerDesc.classList.remove('hidden');

// 4. Логика по BMI диапазонам
    
    // Underweight (BMI < 18.5) -> ERROR STYLE
    if (bmi < 18.5) {
      setBannerStyle('error');
      // Используем innerHTML для поддержки тега <b>
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>underweight</b>.`;
      bannerDesc.textContent = "You have some work ahead of you, but it's great that you're taking this first step. We'll use your BMI to create a program just for you.";
    } 
    // Normal (18.5 <= BMI <= 24.9) -> SUCCESS STYLE
    else if (bmi >= 18.5 && bmi <= 24.9) {
      setBannerStyle('success');
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>normal</b>`;
      bannerDesc.textContent = "You're starting from a great place! Now we'll use your BMI to create a program tailored to your needs.";
    }
    // Overweight (25.0 <= BMI <= 29.9) -> ERROR STYLE
    else if (bmi >= 25.0 && bmi <= 29.9) {
      setBannerStyle('error');
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>overweight</b>`;
      bannerDesc.textContent = "You have some work ahead of you, but it's great that you're taking this first step. We'll use your BMI to create a program just for you.";
    }
    // Obese (BMI > 29.9) -> ERROR STYLE
    else {
      setBannerStyle('error');
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>obese</b>`;
      bannerDesc.textContent = "You have some work ahead of you, but it's great that you're taking this first step. We'll use your BMI to create a program just for you.";
    }
  }

// Хелпер для стилизации плашки
  function setBannerStyle(type) {
    // Сначала скрываем ВСЕ иконки
    iconInfo.classList.add('hidden');
    iconError.classList.add('hidden');
    iconSuccess.classList.add('hidden');

    if (type === 'error') {
      banner.classList.add('error');
      iconError.classList.remove('hidden'); // Показываем красную (26.2)
    } else if (type === 'success') {
      banner.classList.add('success');
      iconSuccess.classList.remove('hidden'); // Показываем новую (26.3)
    } else {
      // Default (Info)
      iconInfo.classList.remove('hidden'); // Показываем синюю (26.1)
    }
  }

  // --- СОБЫТИЯ ---

  // Ввод цифр
  inputs.forEach(inp => {
    inp.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      updateState();
    });
  });

  // Переключение LB / KG
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;

      const newUnit = btn.dataset.unit;
      
      if (newUnit === 'lb') {
        // KG -> LB
        const kgVal = parseFloat(inputKg.value);
        if (kgVal) inputLb.value = kgToLb(kgVal);
        else inputLb.value = '';
        
        groupKg.classList.add('hidden');
        groupLb.classList.remove('hidden');
      } else {
        // LB -> KG
        const lbVal = parseFloat(inputLb.value);
        if (lbVal) inputKg.value = lbToKg(lbVal);
        else inputKg.value = '';

        groupLb.classList.add('hidden');
        groupKg.classList.remove('hidden');
      }

      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentUnit = newUnit;
      updateState();
    });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const view28 = document.getElementById('view-28');
  if (!view28) return;

  // --- ЭЛЕМЕНТЫ ---
  const btns = view28.querySelectorAll('.toggle-btn');
  const groupKg = view28.querySelector('#input-target-kg-group');
  const groupLb = view28.querySelector('#input-target-lb-group');
  const btnNext = view28.querySelector('#btn-next-target');

  const inputKg = view28.querySelector('#val-target-kg');
  const inputLb = view28.querySelector('#val-target-lb');
  const inputs = view28.querySelectorAll('.input-huge');

  // Плашка
  const banner = view28.querySelector('#info-banner-target');
  const iconInfo = view28.querySelector('#icon-info-target');   // 26.1
  const iconError = view28.querySelector('#icon-error-target'); // 26.2
  
  const bannerTitle = view28.querySelector('#banner-title-target');
  const bannerDesc = view28.querySelector('#banner-desc-target');

  // Состояние
  let currentUnit = 'kg'; 
  let targetWeightKg = 0;

  // --- КОНВЕРТАЦИЯ ---
  const KG_TO_LB = 2.20462;
  function kgToLb(kg) { return Math.round(kg * KG_TO_LB); }
  function lbToKg(lb) { return Math.round(lb / KG_TO_LB); }

  // --- РАСЧЕТ ДИАПАЗОНОВ ---
  // Считаем Min (BMI 18.5) и Max (BMI 24.9) вес для роста пользователя
  function calculateWeightRange(heightCm) {
    if (!heightCm) return { min: 0, max: 0 };
    const heightM = heightCm / 100;
    // Formula: Weight = BMI * (height^2)
    const minKg = 18.5 * (heightM * heightM);
    const maxKg = 24.9 * (heightM * heightM);
    return { 
      min: Math.round(minKg), 
      max: Math.round(maxKg) 
    };
  }

  // --- ЛОГИКА ОТОБРАЖЕНИЯ (STATES) ---
  function updateState() {
    // 1. Читаем введенный целевой вес
    if (currentUnit === 'kg') {
      targetWeightKg = parseFloat(inputKg.value) || 0;
    } else {
      const lbVal = parseFloat(inputLb.value) || 0;
      targetWeightKg = lbToKg(lbVal);
    }

    // Сброс стилей плашки
    setBannerStyle('info'); 
    btnNext.disabled = false;

    // 0. Если пусто
    if (targetWeightKg === 0) {
      bannerTitle.textContent = "Target weight";
      bannerDesc.textContent = "Enter your goal weight to see how much you need to lose.";
      btnNext.disabled = true;
      return;
    }

    // --- ПОЛУЧЕНИЕ ГЛОБАЛЬНЫХ ДАННЫХ ---
    // Берем данные с прошлых экранов. Если нет (dev mode), ставим заглушки.
    const userHeight = window.userHeightCm || 170; 
    const currentWeight = window.userWeightKg || 80;

    // Считаем диапазоны и сохраняем глобально
    const range = calculateWeightRange(userHeight);
    window.recommendedMinWeight = range.min;
    window.recommendedMaxWeight = range.max;

    // Форматируем Min/Max для текста (в зависимости от выбранной единицы)
    let displayMin = range.min;
    let displayMax = range.max;
    if (currentUnit === 'lb') {
      displayMin = kgToLb(range.min);
      displayMax = kgToLb(range.max);
    }

    // --- ПРОВЕРКИ (Cases) ---

    // 2.1. Вес < 20 кг -> ERROR, DISABLED
    if (targetWeightKg < 20) {
      setBannerStyle('error');
      bannerTitle.textContent = "Uh-oh! Low weight alert!";
      bannerDesc.textContent = `A normal weight range for your height is between ${displayMin} and ${displayMax}. Any weight below ${displayMin} is classified as underweight and is not recommended by World Health Organization.`;
      btnNext.disabled = true;
      return;
    }

    // 2.2. Целевой вес >= Текущего веса -> ERROR, DISABLED
    if (targetWeightKg >= currentWeight) {
      setBannerStyle('error');
      bannerTitle.textContent = "Your target weight should be less than your current weight";
      bannerDesc.textContent = "Please double check. You might have used metric system instead of imperial. You can change preferred unit system at the top of this page";
      btnNext.disabled = true;
      return;
    }

    // 2.3. 20 <= Цель < MIN (Недобор веса) -> ERROR, ACTIVE
    if (targetWeightKg >= 20 && targetWeightKg < range.min) {
      setBannerStyle('error');
      bannerTitle.textContent = "Uh-oh! Low weight alert!";
      bannerDesc.textContent = `A normal weight range for your height is between ${displayMin} and ${displayMax}. Any weight below ${displayMin} is classified as underweight and is not recommended by World Health Organization.`;
      // Кнопка активна
      return;
    }

    // 2.4. MIN <= Цель < Текущий (Нормальный сброс) -> ERROR (по ТЗ), ACTIVE
    if (targetWeightKg >= range.min && targetWeightKg < currentWeight) {
      setBannerStyle('info'); // ТЗ требует оставаться в состоянии error (красная иконка)
      
      // Считаем процент потери веса
      const lossPct = ((currentWeight - targetWeightKg) / currentWeight * 100).toFixed(1);
      // Сохраняем глобально (если нужно для будущих экранов)
      window.weightLossPct = lossPct;

      bannerTitle.textContent = `Get moving: lose ${lossPct}% of your weight`;
      bannerDesc.textContent = "Working out just 5 minutes per day can significantly improve your overall well-being.";
      // Кнопка активна
      return;
    }
  }

  // Хелпер для стилей
  function setBannerStyle(type) {
    iconInfo.classList.add('hidden');
    iconError.classList.add('hidden');
    banner.classList.remove('error');

    if (type === 'error') {
      banner.classList.add('error');
      iconError.classList.remove('hidden');
    } else {
      // Info
      iconInfo.classList.remove('hidden');
    }
  }

  // --- СОБЫТИЯ ---
  inputs.forEach(inp => {
    inp.addEventListener('input', function() {
      this.value = this.value.replace(/[^0-9]/g, '');
      updateState();
    });
  });

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;
      const newUnit = btn.dataset.unit;
      
      if (newUnit === 'lb') {
        const kgVal = parseFloat(inputKg.value);
        if (kgVal) inputLb.value = kgToLb(kgVal); else inputLb.value = '';
        groupKg.classList.add('hidden');
        groupLb.classList.remove('hidden');
      } else {
        const lbVal = parseFloat(inputLb.value);
        if (lbVal) inputKg.value = lbToKg(lbVal); else inputKg.value = '';
        groupLb.classList.add('hidden');
        groupKg.classList.remove('hidden');
      }

      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentUnit = newUnit;
      updateState();
    });
  });
});
