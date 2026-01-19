[file name]: script.js
[file content begin]
// ========== AMPLITUDE INITIALIZATION (ИСПРАВЛЕННЫЙ) ==========
window.amplitude = window.amplitude || {_q: [], _iq: {}};

function initAmplitude() {
  const API_KEY = '04189f7b1d7c1190d933e17faa13b3fc';
  
  if (typeof amplitude !== 'undefined' && amplitude.init) {
    amplitude.init(API_KEY, null, {
      defaultTracking: {
        pageViews: false,
        sessions: true
      },
      // ВАЖНО: Отправляем события сразу, без буфера
      uploadBatchSize: 1,
      eventUploadPeriodMillis: 0,
      eventUploadThreshold: 1
    });
    
    amplitude.logEvent('app_loaded', {
      test_mode: true,
      timestamp: new Date().toISOString()
    });
    
    console.log('Amplitude initialized');
  } else {
    setTimeout(initAmplitude, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAmplitude);
} else {
  initAmplitude();
}
// ========== END AMPLITUDE ==========

document.addEventListener("DOMContentLoaded", () => {
  const views = Array.from(document.querySelectorAll(".view"));
  const globalHeader = document.getElementById("global-header");
  let currentViewIndex = 0;
  let maxReachedIndex = 0; //чтобы стрелки перелистывались
  const QUIZ_START_INDEX = 3;

  // Глобальная переменная для Amplitude
  window.currentViewIndex = 0;

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

    /* --- ИСПРАВЛЕННАЯ ФУНКЦИЯ (ВЕРСИЯ 1.4) --- */
  function updateQuizProgress() {
    const bar = document.querySelector(".step-progress__fill");
    const dots = document.querySelectorAll(".step-dot");
    
    if (!bar) return;

    // Настройки диапазона квиза
    // QUIZ_START_INDEX = 3 (View 4). 
    // Последний вопрос = 33 (View 33).
    const quizStart = 3; 
    const quizEnd = 33;
    
    // 1. Вычисляем текущий шаг
    let currentStep = currentViewIndex - quizStart;
    
    // Если мы еще до начала квиза, обнуляем
    if (currentStep < 0) currentStep = 0;
    
    const totalSteps = quizEnd - quizStart; // 30 шагов
    
    // 2. Считаем процент заполнения
    let percent = (currentStep / totalSteps) * 100;
    
    // ХАК: Чтобы полоска не казалась "мертвой" на первых шагах (с 3 на 4),
    // если шаг > 0, но процент очень маленький, ставим минимум 2%.
    // Это чисто визуальная правка, чтобы глаз заметил движение.
    if (currentStep > 0 && percent < 2) {
       percent = 2;
    }

    if (percent > 100) percent = 100;

    // 3. Применяем ширину
    bar.style.width = `${percent}%`;

    // 4. Логика точек (Строгая)
    // Точки стоят на: 0%, 25%, 50%, 75%, 100%
    if (dots.length > 0) {
      const stepPerDot = 100 / (dots.length - 1); // 25

      dots.forEach((dot, index) => {
        const dotPosition = index * stepPerDot;

        // СТРОГОЕ УСЛОВИЕ:
        // Точка загорается, только если линия (percent) доползла до позиции точки.
        // Используем (dotPosition - 0.5), чтобы компенсировать микро-неточности браузера,
        // но визуально это будет выглядеть как "ровно в момент касания".
        if (percent >= (dotPosition - 0.5)) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });
    }
  }


  // Добавляем вызов в обработчик resize
  window.addEventListener("resize", () => {
    fixScrollbar();
  });

  /* --- ФУНКЦИЯ ВАЛИДАЦИИ (ВЕРСИЯ 2.1 - С ИСТОРИЕЙ) --- */
  function checkNavState() {
    const currentView = views[currentViewIndex];
    if (!currentView) return;

    const nextArrow = globalHeader.querySelector('.btn-arrow[data-trigger="next"]');
    const footerBtn = currentView.querySelector('.layout-footer .btn, .inline-footer .btn'); 
    
    let isArrowEnabled = true; 
    let isFooterBtnEnabled = true;

    const multiSelectItems = currentView.querySelectorAll('.card-checkbox, .card-zone, .card[data-action="toggle"]');
    
    // 1. Логика Multi-select
    if (multiSelectItems.length > 0) {
      const selected = currentView.querySelectorAll('.card-checkbox.selected, .card-zone.selected, .card.selected[data-action="toggle"]');
      const hasSelection = selected.length > 0;
      isArrowEnabled = hasSelection;
      isFooterBtnEnabled = hasSelection;
    } 
    // 2. Логика Инпутов
    else if (footerBtn && footerBtn.disabled) {
       isArrowEnabled = false;
    }
    // 3. Логика Одиночного выбора
    else {
      const singleChoiceCards = currentView.querySelectorAll('[data-trigger="next"]:not(.btn)');
      if (singleChoiceCards.length > 0) {
        isArrowEnabled = false; // Блокируем, требуем клик по карточке
      }
    }

    // 4. Логика Экрана 25
    if (currentView.id === 'view-25') {
       const progBtn = document.getElementById('btn-progress-container');
       if (progBtn && !progBtn.classList.contains('ready')) {
         isArrowEnabled = false;
       }
    }

    // === НОВОЕ: ПРОВЕРКА ИСТОРИИ ===
    // Если мы вернулись назад (текущий индекс меньше максимального), 
    // то разрешаем идти вперед стрелкой, даже если выбор визуально сбросился
    if (currentViewIndex < maxReachedIndex) {
       isArrowEnabled = true;
    }
    // ===============================

    // --- ПРИМЕНЕНИЕ ---
    if (isArrowEnabled) {
      nextArrow.classList.remove('disabled');
    } else {
      nextArrow.classList.add('disabled');
    }

    if (footerBtn && multiSelectItems.length > 0) {
       footerBtn.disabled = !isFooterBtnEnabled;
    }
  }

  // Обновляем логику показа экранов
  function showView(index) {
    if (index < 0 || index >= views.length) return;

    // Скрываем все модалки
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('visible');
      modal.classList.add('hidden');
    });

    if (views[currentViewIndex])
      views[currentViewIndex].classList.remove("active");

    const nextView = views[index];
    nextView.classList.add("active");

    // Скролл вверх
    const mainContent = nextView.querySelector(".layout-main");
    if (mainContent) mainContent.scrollTop = 0;

    currentViewIndex = index;
    window.currentViewIndex = index; // Обновляем для Amplitude

    // Запоминаем, как далеко зашел пользователь
    if (currentViewIndex > maxReachedIndex) {
      maxReachedIndex = currentViewIndex;
    }

    // --- УПРАВЛЕНИЕ ХЕДЕРОМ (ИСПРАВЛЕНО 1.6) ---
    
    const navContent = globalHeader.querySelector('.nav-header__content');

    // Сначала сбрасываем специфические классы, чтобы не "тащить" их с прошлых экранов
    globalHeader.classList.remove("hidden");
    globalHeader.classList.remove("nav-header--final");
    if (navContent) navContent.classList.remove("hidden");

    // ЛОГИКА:
    if (currentViewIndex < QUIZ_START_INDEX) {
       // 1. До начала квиза (Экраны 1-3) -> Хедер скрыт совсем
       globalHeader.classList.add("hidden");
    } 
    else if (currentViewIndex >= 33) {
       // 2. После квиза (Экраны 34-36) -> 
       // Хедер ВИДЕН (для лого на десктопе), но получает спец. класс
       globalHeader.classList.add("nav-header--final");
       
       // Внутренний контент (стрелки/прогресс) СКРЫВАЕМ
       if (navContent) navContent.classList.add("hidden");
    } 
    else {
       // 3. Внутри квиза (Экраны 4-33) -> Всё стандартно
       updateQuizProgress();
    }

    fixScrollbar();

    // === НОВОЕ: ЗАПУСКАЕМ ПРОВЕРКУ ПРИ ВХОДЕ НА ЭКРАН ===
    checkNavState();
    
    // === AMPLITUDE TRACKING ===
    if (window.trackScreenView) {
      window.trackScreenView(nextView.id);
    }
  }

  window.addEventListener("resize", () => {
    fixScrollbar();
  });



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
      // 1. Сохраняем логику выбора карточек (чтобы они подсвечивались синим)
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

      // 2. ПРОВЕРКА: Если мы уходим с экрана 32 (Date Picker)
      const currentView = views[currentViewIndex];
      if (currentView && currentView.id === "view-32") {
        const isSkip = target.classList.contains("link");
        if (typeof window.saveUserSelectedDate === "function") {
          window.saveUserSelectedDate(isSkip);
        }
      }

      // 3. Переход на следующий слайд
      showView(currentViewIndex + 1);
      return;
    }

    // Логика кнопки "Назад"
    const backBtn = target.closest('[data-trigger="back"]');
    if (backBtn) {
      showView(currentViewIndex - 1);
      return;
    }

// Логика чекбоксов и зон тела (Screen 8)
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
      
      // === НОВОЕ: ПРОВЕРЯЕМ ВАЛИДАЦИЮ ПОСЛЕ КЛИКА ===
      checkNavState();
      
      return;
    }

  });

  views.forEach((v, i) => v.classList.toggle("active", i === 0));
  globalHeader.classList.add("hidden");
  if (currentViewIndex === 0) startLoader();

  // Логика для Toggle Switch (Экран 22)
  const fastingToggle = document.getElementById("fasting-toggle");
  if (fastingToggle) {
    fastingToggle.addEventListener("click", () => {
      fastingToggle.classList.toggle("active");
      if (navigator.vibrate) navigator.vibrate(5);
    });
  }

  // Запуск Date Picker с небольшой задержкой
  setTimeout(() => {
    if (typeof initSwiperDatePicker === "function") {
      initSwiperDatePicker();
    }
  }, 300);

/* --- Логика для Экрана 33 (График веса) --- */
  function updateView33() {
    // 1. Получаем сохраненные данные (в глобальных переменных они всегда в КГ)
    const curW_kg = parseFloat(window.userWeightKg) || 0;
    const targetW_kg = parseFloat(window.userTargetWeightKg) || 0;

    // 2. Определяем, какая единица выбрана пользователем (смотрим на кнопку экрана 27)
    const unitToggle = document.querySelector("#view-27 .toggle-btn.active");
    const unit = unitToggle ? unitToggle.dataset.unit : "kg";
    const isLb = (unit === "lb");

    // 3. Функция конвертации для отображения
    // Если выбраны фунты -> умножаем кг на 2.20462
    const toDisplay = (valKg) => {
      if (isLb) {
        return Math.round(valKg * 2.20462);
      }
      return Math.round(valKg);
    };

    const startVal = toDisplay(curW_kg);   // Текущий вес в выбранных единицах
    const targetVal = toDisplay(targetW_kg); // Целевой вес в выбранных единицах

    // 4. Текст подзаголовка ("reach your goal weight of ...")
    const goalDisplayElement = document.getElementById("goal-weight-display");
    if (goalDisplayElement) {
        goalDisplayElement.textContent = `${targetVal} ${unit}`;
    }

    // 5. Расчет среднего значения для графика
    const midVal = Math.round((startVal + targetVal) / 2);

    // 6. Обновление плашек на графике
    // Badge 1: Текущий вес
    document.getElementById("w-badge-1").textContent = `${startVal} ${unit}`;
    
    // Badge 2: Промежуточный вес
    document.getElementById("w-badge-2").textContent = `${midVal} ${unit}`;
    
    // Badge 3 & 4: Целевой вес
    document.getElementById("w-badge-3").textContent = `${targetVal} ${unit}`;
    document.getElementById("w-badge-4").textContent = `${targetVal} ${unit}`;

    // 7. Расчет дат (оставляем без изменений)
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

  // Добавляем вызов в MutationObserver (который мы создали в версии 1.5)
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
   НОВАЯ ЛОГИКА ЭКРАНА 34 (Interactive Analysis)
   ========================= */

async function startAnalysisScenario() {
  const view34 = document.getElementById('view-34');
  const lineFill = document.getElementById('timeline-fill');
  
  // Элементы шагов
  const items = [
    document.getElementById('tl-item-1'), // Analyzing
    document.getElementById('tl-item-2'), // Searching
    document.getElementById('tl-item-3'), // Calories
    document.getElementById('tl-item-4')  // Water
  ];
  
  if (!lineFill || !items[0]) return;

  // --- 1. СБРОС СОСТОЯНИЯ (RESET) ---
  // Если мы зашли на экран заново, нужно все очистить
  lineFill.style.transition = 'none'; // Отключаем плавность для мгновенного сброса
  lineFill.style.height = '0%';
  items.forEach(item => {
    item.classList.remove('completed', 'pulsing', 'active');
  });

  items[0].classList.add('completed'); // сразу же возвращаем галочку первому пункту

  // Возвращаем плавность (немного ждем, чтобы браузер понял сброс)
  setTimeout(() => { lineFill.style.transition = 'height 1.5s linear'; }, 50);

  // --- ХЕЛПЕРЫ ---
  
  // Проверка: мы всё еще на экране 34?
  const isActive = () => view34.classList.contains('active');

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const animateLineTo = async (percent) => {
    if (!isActive()) return; // Проверка перед стартом
    lineFill.style.height = `${percent}%`;
    await wait(1500); // Ждем пока CSS анимация пройдет
  };

  const waitForPopup = (popupId) => {
    return new Promise(resolve => {
      if (!isActive()) { resolve(); return; } // Если ушли с экрана, сразу выходим

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

  // 0. Старт 
  await wait(500); 
  if (!isActive()) return; // <--- ВАЖНО: Если ушли, стоп.

  // 1. Линия к Пункту 2
  await animateLineTo(33); 
  if (!isActive()) return;

  // 2. Пульсация (Пункт 2)
  items[1].classList.add('pulsing');
  await wait(3000); // 3 пульсации
  items[1].classList.remove('pulsing');
  if (!isActive()) return;

  // 3. Попап 1
  // Проверка внутри waitForPopup не даст ему открыться, если мы ушли,
  // но добавим проверку и тут для надежности.
  if (isActive()) {
      await waitForPopup('popup-1');
  }
  if (!isActive()) return;

  // 4. Галочка на Пункт 2
  items[1].classList.add('completed');

  // 5. Линия к Пункту 3
  await animateLineTo(66);
  if (!isActive()) return;

  // 6. Пульсация (Пункт 3)
  items[2].classList.add('pulsing');
  await wait(3000); 
  items[2].classList.remove('pulsing');
  if (!isActive()) return;

  // 7. Попап 2
  if (isActive()) {
      await waitForPopup('popup-2');
  }
  if (!isActive()) return;

  // 8. Галочка на Пункт 3
  items[2].classList.add('completed');

  // 9. Линия к Пункту 4
  await animateLineTo(100);
  if (!isActive()) return;

  // 10. Пульсация и Финиш (Пункт 4)
  items[3].classList.add('pulsing');
  await wait(3000);
  items[3].classList.remove('pulsing');
  if (!isActive()) return;
  
  items[3].classList.add('completed');

  // 11. Переход дальше
  await wait(500);
  if (!isActive()) return;
  
  // Ищем следующий экран (35) или делаем другое действие
  const allViews = Array.from(document.querySelectorAll(".view"));
  const view35Index = allViews.findIndex(v => v.id === 'view-35'); // Убедитесь, что view-35 существует
  
  if (view35Index !== -1 && typeof showView === 'function') {
      showView(view35Index);
  } else {
      console.log("Сценарий завершен, но view-35 не найден.");
  }
}
  

// Наблюдатель: запускает сценарий и видео, когда мы попадаем на view-34
  const v34 = document.getElementById("view-34");
  const video34 = document.getElementById("video-analysis"); // Получаем видео

  if (v34) {
    const observer34 = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Если экран стал активным
        if (mutation.target.classList.contains("active")) {
          // Запускаем сценарий таймлайна
          startAnalysisScenario();
          
          // Запускаем видео
          if (video34) {
            video34.currentTime = 0; // Начинаем с начала
            video34.play().catch(e => console.log("Autoplay prevented:", e));
          }
        } 
        // Если ушли с экрана
        else {
          if (video34) {
            video34.pause(); // Останавливаем видео для экономии ресурсов
          }
        }
      });
    });
    observer34.observe(v34, { attributes: true, attributeFilter: ["class"] });
  }
   /* =========================================
     ЛОГИКА ЭКРАНА 35 (EMAIL)
     ========================================= */
  const emailInput = document.getElementById("email-input");
  const emailBtn = document.getElementById("btn-email-next");

  if (emailInput && emailBtn) {
    // Регулярное выражение для email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Функция проверки, которую будем вызывать при вводе
    function validateEmail() {
      const val = emailInput.value.trim();
      const isValid = val.length > 0 && emailPattern.test(val);

      // 1. Управляем кнопкой "Continue" внизу (Footer Button)
      // Если email валидный -> false (активна), иначе -> true (выключена)
      emailBtn.disabled = !isValid;

      // 2. Обновляем состояние стрелки в хедере
      checkNavState();
    }

    // Слушаем каждый ввод символа
    emailInput.addEventListener("input", validateEmail);

    // Обработка нажатия Enter (для удобства на ПК)
    emailInput.addEventListener("keypress", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!emailBtn.disabled) {
          emailBtn.click();
        }
      }
    });
  }

}); // Конец DOMContentLoaded

/* ========== AMPLITUDE FUNNEL TRACKING (ИСПРАВЛЕННЫЙ) ========== */
(function() {
  let lastTrackedScreen = '';
  let eventSequence = 0;
  let isTrackingInitialized = false;
  
  function initAmplitudeTracking() {
    if (!window.amplitude) {
      setTimeout(initAmplitudeTracking, 100);
      return;
    }
    isTrackingInitialized = true;
    console.log('Amplitude tracking ready');
  }
  
  window.trackScreenView = function(screenId) {
    if (!window.amplitude || !screenId || !isTrackingInitialized) {
      // Если Amplitude еще не готов, пробуем позже
      setTimeout(() => window.trackScreenView(screenId), 50);
      return;
    }
    
    const screenNum = parseInt(screenId.replace('view-', '')) || 0;
    
    if (screenId !== lastTrackedScreen) {
      lastTrackedScreen = screenId;
      eventSequence++;
      
      // Создаем уникальный timestamp для каждого события
      const eventTimestamp = Date.now();
      
      try {
        // Пробуем использовать logEventWithTimestamp если доступен
        if (amplitude.getInstance && amplitude.getInstance().logEventWithTimestamp) {
          amplitude.getInstance().logEventWithTimestamp(
            'funnel_screen_viewed',
            {
              screen_id: screenId,
              screen_number: screenNum,
              sequence: eventSequence,
              view_index: window.currentViewIndex || 0,
              absolute_timestamp: eventTimestamp
            },
            null,
            null,
            eventTimestamp
          );
        } else {
          // Fallback на обычный logEvent
          amplitude.logEvent('funnel_screen_viewed', {
            screen_id: screenId,
            screen_number: screenNum,
            sequence: eventSequence,
            view_index: window.currentViewIndex || 0,
            timestamp: new Date(eventTimestamp).toISOString(),
            event_time_ms: eventTimestamp
          });
        }
        
        // Принудительно отправляем
        if (amplitude.getInstance && amplitude.getInstance().uploadEvents) {
          amplitude.getInstance().uploadEvents();
        }
        
        console.log(`📡 Amplitude: ${screenId} (screen ${screenNum}, seq: ${eventSequence})`);
      } catch (e) {
        console.error('Amplitude send error:', e);
      }
    }
  };
  
  // Инициализируем когда DOM готов
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAmplitudeTracking);
  } else {
    initAmplitudeTracking();
  }
})();
/* ========== END AMPLITUDE TRACKING ========== */

/* --- ФУНКЦИЯ ДЛЯ DATE PICKER (SWIPER) --- */
function initSwiperDatePicker() {
  // 1. Генерация данных

  // Месяцы
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

  // Дни (1..31)
  const dayWrapper = document.getElementById("wrapper-day");
  if (dayWrapper) {
    let daysHtml = "";
    for (let i = 1; i <= 31; i++) {
      daysHtml += `<div class="swiper-slide">${i}</div>`;
    }
    dayWrapper.innerHTML = daysHtml;
  }

  // Годы (Текущий + 10 лет вперед)
  const yearWrapper = document.getElementById("wrapper-year");
  if (yearWrapper) {
    const currentYear = new Date().getFullYear();
    let yearsHtml = "";
    for (let i = 0; i < 10; i++) {
      yearsHtml += `<div class="swiper-slide">${currentYear + i}</div>`;
    }
    yearWrapper.innerHTML = yearsHtml;
  }

  // 2. Инициализация Swiper
  // Общие настройки для всех трех колонок
  const config = {
    direction: "vertical",
    slidesPerView: 5, // Показываем 5 элементов (2 сверху, 1 центр, 2 снизу)
    centeredSlides: true, // Активный элемент по центру
    loop: true, // Бесконечная прокрутка
    mousewheel: true, // Поддержка колесика мыши
    grabCursor: true, // Курсор-рука
    slideToClickedSlide: true, // Клик по дате делает её активной
  };

  // Создаем экземпляры
  const swiperM = new Swiper(".swiper-month", config);
  const swiperY = new Swiper(".swiper-year", config);
  new Swiper(".swiper-day", config);

  window.userTargetDate = "";
  
  const monthsShort = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];

  // Функция для сохранения даты
  window.saveUserSelectedDate = function (isSkipped = false) {
    if (isSkipped) {
      // Если пропущено: берем текущую дату + 6 месяцев
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);

      const mName = monthsShort[futureDate.getMonth()];
      const yName = futureDate.getFullYear().toString();
      window.userTargetDate = `${mName} ${yName}`;
    } else {
      // Если выбрано: берем активные слайды из Swiper
      const activeMonthText =
        swiperM.slides[swiperM.activeIndex].textContent.trim();
      const activeYearText =
        swiperY.slides[swiperY.activeIndex].textContent.trim();

      const mShort = monthsShort[months.indexOf(activeMonthText)];
      window.userTargetDate = `${mShort} ${activeYearText}`;
    }
    console.log("Target Date Saved:", window.userTargetDate);
  };
}

// --- ЭКРАН 25-26 ---

document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     ЛОГИКА ЭКРАНА 25 (PROGRESS BAR BUTTON)
     ========================= */
     
  const view25 = document.getElementById("view-25");
  
  if (view25) {
    const btnContainer = document.getElementById("btn-progress-container");
    const btnFill = document.getElementById("btn-progress-fill");
    const btnText = document.getElementById("btn-progress-text");
    
    // Переменная, чтобы не запускать анимацию дважды, если пользователь вернется назад
    let hasAnimated25 = false; 

    const observer25 = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.target.classList.contains("active")) {
          // Если зашли на экран - запускаем анимацию
          runProgressButtonAnimation();
        } else {
          // Если ушли с экрана - сбрасываем (опционально, если хотите, чтобы каждый раз проигрывалось)
          resetProgressButton();
        }
      });
    });

    observer25.observe(view25, { attributes: true, attributeFilter: ["class"] });

    function runProgressButtonAnimation() {
      // Сброс перед стартом
      btnFill.style.width = '0%';
      btnText.textContent = 'Progress 0%';
      btnContainer.classList.remove('ready');
      // Удаляем триггер перехода, пока не дойдет до 100%
      btnContainer.removeAttribute('data-trigger'); 
      
      let startTime = null;
      const duration = 4000; // 4 секунды

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        
        // Вычисляем процент (от 0 до 100)
        let percent = Math.min((progress / duration) * 100, 100);
        
        // Обновляем UI
        btnFill.style.width = `${percent}%`;
        btnText.textContent = `Progress ${Math.floor(percent)}%`;

        if (progress < duration) {
          // Продолжаем анимацию
          window.requestAnimationFrame(step);
        } else {
          // Финиш
          finishAnimation();
        }
      }

      window.requestAnimationFrame(step);
    }

    function finishAnimation() {
      btnFill.style.width = '100%';
      btnText.textContent = 'Continue'; // Или оставить 'Progress 100%', как решите
      btnContainer.classList.add('ready');
      
      // Делаем кнопку активной для глобального обработчика кликов
      btnContainer.setAttribute('data-trigger', 'next');
      
      // Небольшая вибрация на мобильном, если поддерживается
      if (navigator.vibrate) navigator.vibrate(50);
    }

    function resetProgressButton() {
       // Если нужно сбрасывать состояние при уходе со слайда
       btnFill.style.width = '0%';
       btnText.textContent = 'Progress 0%';
       btnContainer.classList.remove('ready');
       btnContainer.removeAttribute('data-trigger');
    }
  }


  const view26 = document.getElementById("view-26");
  if (!view26) return;

  // --- ЭЛЕМЕНТЫ ---
  const btns = view26.querySelectorAll(".toggle-btn");
  const groupCm = view26.querySelector("#input-cm-group");
  const groupFt = view26.querySelector("#input-ft-group");
  const btnNext = view26.querySelector("#btn-next");

  // Поля ввода
  const inputCm = view26.querySelector("#val-cm");
  const inputFt = view26.querySelector("#val-ft");
  const inputIn = view26.querySelector("#val-in");
  const inputs = view26.querySelectorAll(".input-huge");

  // Плашка и ее содержимое
  const banner = view26.querySelector("#info-banner");
  const iconInfo = view26.querySelector("#icon-info");
  const iconError = view26.querySelector("#icon-error");
  const bannerTitle = view26.querySelector("#banner-title");
  const bannerDesc = view26.querySelector("#banner-desc");

  // Переменные состояния
  let currentUnit = "cm"; // 'cm' или 'ft'
  let savedHeightCm = 0; // Здесь храним актуальный рост в см

  // --- ФУНКЦИИ КОНВЕРТАЦИИ ---

  // Из СМ в Футы/Дюймы
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

  // Из Футов/Дюймов в СМ
  function ftInToCm(ft, inches) {
    const f = parseFloat(ft) || 0;
    const i = parseFloat(inches) || 0;
    return Math.round(f * 30.48 + i * 2.54);
  }

  // --- ВАЛИДАЦИЯ И ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ---

  function updateState() {
    // 1. Определяем текущий рост в сантиметрах
    if (currentUnit === "cm") {
      savedHeightCm = parseInt(inputCm.value) || 0;
    } else {
      savedHeightCm = ftInToCm(inputFt.value, inputIn.value);
    }

    // 2. Логика отображения

    // Если поле пустое -> Сброс в исходное состояние (Info), кнопка выключена
    if (savedHeightCm === 0) {
      setBanner("info");
      btnNext.disabled = true;
      return;
    }

    // Если значение недопустимое (<100 или >300) -> Ошибка
    if (savedHeightCm < 100 || savedHeightCm > 300) {
      setBanner("error");
      btnNext.disabled = true; // Кнопка неактивна
    } else {
      // Значение валидное -> Успех
      setBanner("info");
      btnNext.disabled = false; // Кнопка активна
      window.userHeightCm = savedHeightCm; // Сохраняем рост глобально для экрана 27
      window.userHeightUnit = currentUnit; // <--- ДОБАВИТЬ ЭТУ СТРОКУ (сохраняем 'cm' или 'ft')
    }
    checkNavState();
  }

  // Управление видом плашки
  function setBanner(state) {
    if (state === "error") {
      banner.classList.add("error");

      iconInfo.classList.add("hidden");
      iconError.classList.remove("hidden");

      bannerTitle.textContent = "Please double-check and enter valid height";
      bannerDesc.classList.add("hidden"); // Скрываем описание в ошибке
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

  // --- ОБРАБОТЧИКИ СОБЫТИЙ ---

  // 1. Ввод цифр
  inputs.forEach((input) => {
    input.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, ""); // Только цифры
      updateState();
    });
  });

  // 2. Переключение вкладок
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Не делаем ничего, если кликнули на уже активную кнопку
      if (btn.classList.contains("active")) return;

      const newUnit = btn.dataset.unit;

      // Конвертация значений ПЕРЕД переключением
      if (newUnit === "ft") {
        // Переход CM -> FT
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
        // Переход FT -> CM
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

      // Переключаем визуальный стиль кнопок
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Обновляем состояние
      currentUnit = newUnit;
      updateState();
    });
  });
});

// --- ЭКРАН 27 ---
document.addEventListener("DOMContentLoaded", () => {
  const view27 = document.getElementById("view-27");
  if (!view27) return;

  // --- ЭЛЕМЕНТЫ ---
  const btns = view27.querySelectorAll(".toggle-btn");
  const groupKg = view27.querySelector("#input-weight-kg-group");
  const groupLb = view27.querySelector("#input-weight-lb-group");
  const btnNext = view27.querySelector("#btn-next-weight");

  const inputKg = view27.querySelector("#val-weight-kg");
  const inputLb = view27.querySelector("#val-weight-lb");
  const inputs = view27.querySelectorAll(".input-huge");

  // Плашка
  const banner = view27.querySelector("#info-banner-weight");
  const iconInfo = view27.querySelector("#icon-info-weight");
  const iconError = view27.querySelector("#icon-error-weight");
  const iconSuccess = view27.querySelector("#icon-success-weight");
  const bannerTitle = view27.querySelector("#banner-title-weight");
  const bannerDesc = view27.querySelector("#banner-desc-weight");

  // Состояние
  let currentUnit = "kg"; // 'kg' или 'lb'
  let savedWeightKg = 0;

  // --- КОНВЕРТАЦИЯ ---
  const KG_TO_LB = 2.20462;

  function kgToLb(kg) {
    return Math.round(kg * KG_TO_LB);
  }
  function lbToKg(lb) {
    return Math.round(lb / KG_TO_LB);
  }

  // --- РАСЧЕТ BMI ---
  function calculateBMI(weightKg, heightCm) {
    if (!heightCm || heightCm <= 0) return 0;
    const heightM = heightCm / 100;
    return (weightKg / (heightM * heightM)).toFixed(1); // Округляем до 1 знака (напр. 24.5)
  }

  // --- ЛОГИКА ОТОБРАЖЕНИЯ (STATES) ---
  function updateState() {
    // 1. Читаем вес
    if (currentUnit === "kg") {
      savedWeightKg = parseFloat(inputKg.value) || 0;
    } else {
      const lbVal = parseFloat(inputLb.value) || 0;
      savedWeightKg = lbToKg(lbVal);
    }

    // Сброс классов плашки
    banner.classList.remove("error", "success");
    iconError.classList.add("hidden");
    iconInfo.classList.remove("hidden"); // По умолчанию показываем info (синюю/зеленую иконку)
    btnNext.disabled = false; // По умолчанию активна, выключим если ошибка

    // 2. Проверки лимитов (Error State 1 & 6)
    // 4.1 Вес < 20 кг
    if (savedWeightKg < 20 && savedWeightKg > 0) {
      setBannerStyle("error");
      bannerTitle.textContent = "Your weight is too low for this program.";
      bannerDesc.classList.add("hidden"); // Текст не указан в ТЗ для этого кейса, скрываем или оставляем пустым
      btnNext.disabled = true;
      return;
    }

    // 4.6 Вес > 299 кг (т.е. 300 и больше)
    if (savedWeightKg > 299) {
      setBannerStyle("error");
      bannerTitle.textContent =
        "Your weight is too high to work out with this program.";
      bannerDesc.classList.add("hidden");
      btnNext.disabled = true;
      return;
    }

    // Если пусто или 0
    if (savedWeightKg === 0) {
      bannerTitle.textContent = "Enter your weight";
      bannerDesc.textContent =
        "We need your weight to calculate your BMI and build a personalized plan.";
      bannerDesc.classList.remove("hidden");
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

    bannerDesc.classList.remove("hidden");

    // 4. Логика по BMI диапазонам

    // Underweight (BMI < 18.5) -> ERROR STYLE
    if (bmi < 18.5) {
      setBannerStyle("error");
      // Используем innerHTML для поддержки тега <b>
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>underweight</b>.`;
      bannerDesc.textContent =
        "You have some work ahead of you, but it's great that you're taking this first step. We'll use your BMI to create a program just for you.";
    }
    // Normal (18.5 <= BMI <= 24.9) -> SUCCESS STYLE
    else if (bmi >= 18.5 && bmi <= 24.9) {
      setBannerStyle("success");
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>normal</b>`;
      bannerDesc.textContent =
        "You're starting from a great place! Now we'll use your BMI to create a program tailored to your needs.";
    }
    // Overweight (25.0 <= BMI <= 29.9) -> ERROR STYLE
    else if (bmi >= 25.0 && bmi <= 29.9) {
      setBannerStyle("error");
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>overweight</b>`;
      bannerDesc.textContent =
        "You have some work ahead of you, but it's great that you're taking this first step. We'll use your BMI to create a program just for you.";
    }
    // Obese (BMI > 29.9) -> ERROR STYLE
    else {
      setBannerStyle("error");
      bannerTitle.innerHTML = `Your BMI is ${bmi} which is considered <b>obese</b>`;
      bannerDesc.textContent =
        "You have some work ahead of you, but it's great that you're taking this first step. We'll use your BMI to create a program just for you.";
    }
    checkNavState();
  }

  // Хелпер для стилизации плашки
  function setBannerStyle(type) {
    // Сначала скрываем ВСЕ иконки
    iconInfo.classList.add("hidden");
    iconError.classList.add("hidden");
    iconSuccess.classList.add("hidden");

    if (type === "error") {
      banner.classList.add("error");
      iconError.classList.remove("hidden"); // Показываем красную (26.2)
    } else if (type === "success") {
      banner.classList.add("success");
      iconSuccess.classList.remove("hidden"); // Показываем новую (26.3)
    } else {
      // Default (Info)
      iconInfo.classList.remove("hidden"); // Показываем синюю (26.1)
    }
  }

  // --- СОБЫТИЯ ---

  // Ввод цифр
  inputs.forEach((inp) => {
    inp.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
      updateState();
    });
  });

  // Переключение LB / KG
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;

      const newUnit = btn.dataset.unit;

      if (newUnit === "lb") {
        // KG -> LB
        const kgVal = parseFloat(inputKg.value);
        if (kgVal) inputLb.value = kgToLb(kgVal);
        else inputLb.value = "";

        groupKg.classList.add("hidden");
        groupLb.classList.remove("hidden");
      } else {
        // LB -> KG
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

// --- ЭКРАН 28 (ОБНОВЛЕННЫЙ) ---
document.addEventListener("DOMContentLoaded", () => {
  const view28 = document.getElementById("view-28");
  if (!view28) return;

  // --- ЭЛЕМЕНТЫ ---
  const btns = view28.querySelectorAll(".toggle-btn");
  const groupKg = view28.querySelector("#input-target-kg-group");
  const groupLb = view28.querySelector("#input-target-lb-group");
  const btnNext = view28.querySelector("#btn-next-target");

  const inputKg = view28.querySelector("#val-target-kg");
  const inputLb = view28.querySelector("#val-target-lb");
  const inputs = view28.querySelectorAll(".input-huge");

  // Плашка
  const banner = view28.querySelector("#info-banner-target");
  const iconInfo = view28.querySelector("#icon-info-target");
  const iconError = view28.querySelector("#icon-error-target");

  const bannerTitle = view28.querySelector("#banner-title-target");
  const bannerDesc = view28.querySelector("#banner-desc-target");

  // Состояние
  let currentUnit = "kg";
  let targetWeightKg = 0;

  // --- КОНВЕРТАЦИЯ ---
  const KG_TO_LB = 2.20462;
  function kgToLb(kg) {
    return Math.round(kg * KG_TO_LB);
  }
  function lbToKg(lb) {
    return Math.round(lb / KG_TO_LB);
  }

  // --- РАСЧЕТ ДИАПАЗОНОВ ---
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

  // --- ЛОГИКА ОТОБРАЖЕНИЯ (STATES) ---
  function updateState() {
    // 1. Читаем введенный целевой вес
    if (currentUnit === "kg") {
      targetWeightKg = parseFloat(inputKg.value) || 0;
    } else {
      const lbVal = parseFloat(inputLb.value) || 0;
      targetWeightKg = lbToKg(lbVal);
    }

    // === [НОВОЕ] СОХРАНЯЕМ В ГЛОБАЛЬНУЮ ПЕРЕМЕННУЮ ===
    window.userTargetWeightKg = targetWeightKg;
    // =================================================

    // Сброс стилей плашки
    setBannerStyle("info");
    btnNext.disabled = false;

    // 0. Если пусто
    if (targetWeightKg === 0) {
      bannerTitle.textContent = "Target weight";
      bannerDesc.textContent =
        "Enter your goal weight to see how much you need to lose.";
      btnNext.disabled = true;
      return;
    }

    // --- ПОЛУЧЕНИЕ ГЛОБАЛЬНЫХ ДАННЫХ ---
    const userHeight = window.userHeightCm || 170;
    const currentWeight = window.userWeightKg || 80;

    // Считаем диапазоны и сохраняем глобально
    const range = calculateWeightRange(userHeight);
    window.recommendedMinWeight = range.min;
    window.recommendedMaxWeight = range.max;

    // Форматируем Min/Max для текста
    let displayMin = range.min;
    let displayMax = range.max;
    if (currentUnit === "lb") {
      displayMin = kgToLb(range.min);
      displayMax = kgToLb(range.max);
    }

    // --- ПРОВЕРКИ ---

    // 2.1. Вес < 20 кг -> ERROR
    if (targetWeightKg < 20) {
      setBannerStyle("error");
      bannerTitle.textContent = "Uh-oh! Low weight alert!";
      bannerDesc.textContent = `A normal weight range for your height is between ${displayMin} and ${displayMax}. Any weight below ${displayMin} is classified as underweight and is not recommended by World Health Organization.`;
      btnNext.disabled = true;
      return;
    }

    // 2.2. Целевой вес >= Текущего веса -> ERROR
    if (targetWeightKg >= currentWeight) {
      setBannerStyle("error");
      bannerTitle.textContent =
        "Your target weight should be less than your current weight";
      bannerDesc.textContent =
        "Please double check. You might have used metric system instead of imperial. You can change preferred unit system at the top of this page";
      btnNext.disabled = true;
      return;
    }

    // 2.3. 20 <= Цель < MIN (Недобор веса) -> ERROR, ACTIVE
    if (targetWeightKg >= 20 && targetWeightKg < range.min) {
      setBannerStyle("error");
      bannerTitle.textContent = "Uh-oh! Low weight alert!";
      bannerDesc.textContent = `A normal weight range for your height is between ${displayMin} and ${displayMax}. Any weight below ${displayMin} is classified as underweight and is not recommended by World Health Organization.`;
      return;
    }

    // 2.4. MIN <= Цель < Текущий (Нормальный сброс) -> INFO, ACTIVE
    if (targetWeightKg >= range.min && targetWeightKg < currentWeight) {
      setBannerStyle("info");

      const lossPct = (
        ((currentWeight - targetWeightKg) / currentWeight) *
        100
      ).toFixed(1);
      window.weightLossPct = lossPct; // Это уже сохранялось, оставляем как есть

      bannerTitle.textContent = `Get moving: lose ${lossPct}% of your weight`;
      bannerDesc.textContent =
        "Working out just 5 minutes per day can significantly improve your overall well-being.";
      return;
    }
    checkNavState();
  }

  // Хелпер для стилей
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

  // --- СОБЫТИЯ ---
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

  /* =========================
     ЛОГИКА ЭКРАНА 29 (PROFILE SUMMARY)
     ========================= */

  function updateView29() {
    // 1. Получаем данные (или дефолтные, если тестируем без прохода)
    const heightCm = window.userHeightCm || 170;
    const weightKg = window.userWeightKg || 65;
    const bmi = parseFloat(window.userBMI) || 22.5;
    const minW = window.recommendedMinWeight || 53;
    const maxW = window.recommendedMaxWeight || 81;

    // Определяем единицы измерения (смотрим на активную кнопку в View-27)
    // Если пользователь выбрал LB, конвертируем для отображения
    let isLb = false;
    const lbBtn = document.querySelector(
      '#view-27 .toggle-btn[data-unit="lb"]'
    );
    if (lbBtn && lbBtn.classList.contains("active")) {
      isLb = true;
    }

    // === НАЧАЛО ИЗМЕНЕНИЙ ===
    // Определяем единицы измерения РОСТА (смотрим на активную кнопку в View-26)
    let isFt = false;
    const ftBtn = document.querySelector(
      '#view-26 .toggle-btn[data-unit="ft"]'
    );
    if (ftBtn && ftBtn.classList.contains("active")) {
      isFt = true;
    }

    // Формируем строку для отображения роста
    let displayHeightStr = "";
    if (isFt) {
      // Конвертация CM -> FT/IN
      const realFeet = heightCm / 30.48;
      let ft = Math.floor(realFeet);
      let inches = Math.round((realFeet - ft) * 12);
      // Корректировка округления (если дюймов 12, то это +1 фут)
      if (inches === 12) {
        ft++;
        inches = 0;
      }
      displayHeightStr = `${ft}' ${inches}"`;
    } else {
      displayHeightStr = `${Math.round(heightCm)} cm`;
    }
    // === КОНЕЦ ИЗМЕНЕНИЙ (логика расчета готова) ===

    // --- Функции конвертации для отображения ---
    const toDisplayWeight = (kg) =>
      isLb ? Math.round(kg * 2.20462) : Math.round(kg);
    const unitLabel = isLb ? "lb" : "kg";

    // --- 2. Заполнение Текстовых Полей ---
    document.getElementById("disp-height").textContent = displayHeightStr;
    document.getElementById("disp-weight").textContent = `${toDisplayWeight(
      weightKg
    )} ${unitLabel}`;
    document.getElementById("disp-bmi").textContent = bmi.toFixed(2);

    // Диапазон нормы
    document.getElementById("disp-range").textContent = `${toDisplayWeight(
      minW
    )} - ${toDisplayWeight(maxW)} ${unitLabel}`;

    // --- 3. Логика Верхней Карточки (Цвет и Сообщение) ---
    // --- 3. Логика Верхней Карточки (Цвет и Сообщение) ---
    const topCard = document.getElementById("profile-top-card");
    const msgBox = document.getElementById("profile-message-box");

    // Сброс предыдущих классов
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
      // 1.1. BMI <= 18.5 — Синий вариант
      topCard.classList.add("profile-card--blue");
      msgBox.classList.add("profile-message-box--blue");
      msgBox.innerHTML = `<span>‼️</span> You're at risk of health problems`;
    } else if (bmi >= 28.0) {
      // 1.2. BMI >= 28.0 — Красный вариант
      topCard.classList.add("profile-card--red");
      msgBox.classList.add("profile-message-box--red");
      msgBox.innerHTML = `<span>🏃</span> Let's get in shape`;
    } else {
      // 1.3. В любом другом случае — Зеленый вариант
      topCard.classList.add("profile-card--green");
      msgBox.classList.add("profile-message-box--green");
      msgBox.innerHTML = `<span>🔥</span> You have a great figure, keep it up!`;
    }

    // --- 4. Логика Градиентной Шкалы (Треугольник) ---
    // Условия: 18.5 -> 20%, 25.0 -> 40%, 28.0 -> 60%, 32.0 -> 80%
    let gradPercent = 0;

    if (bmi <= 18.5) {
      // 0 .. 18.5 => 0% .. 20%
      gradPercent = (bmi / 18.5) * 20;
    } else if (bmi < 25) {
      // 18.5 .. 25 => 20% .. 40%
      gradPercent = 20 + ((bmi - 18.5) / (25 - 18.5)) * 20;
    } else if (bmi < 28) {
      // 25 .. 28 => 40% .. 60%
      gradPercent = 40 + ((bmi - 25) / (28 - 25)) * 20;
    } else if (bmi < 32) {
      // 28 .. 32 => 60% .. 80%
      gradPercent = 60 + ((bmi - 28) / (32 - 28)) * 20;
    } else {
      // 32+ => 80% .. 100% (лимитируем до 100)
      gradPercent = 80 + ((bmi - 32) / 10) * 20;
      if (gradPercent > 100) gradPercent = 100;
    }

    document.getElementById("triangle-gradient").style.left = `${gradPercent}%`;

    // --- 5. Логика Нижней Серой Плашки (CSS Шкала) ---
    const titleStatus = document.getElementById("weight-status-title");
    const seg1 = document.getElementById("seg-1");
    const seg2 = document.getElementById("seg-2");
    const seg3 = document.getElementById("seg-3");
    const rowDiff = document.getElementById("row-diff");
    const diffVal = document.getElementById("disp-diff");

    // Сброс цветов сегментов
    [seg1, seg2, seg3].forEach((el) => (el.className = "css-scale-seg"));
    rowDiff.classList.add("hidden"); // Скрываем строку разницы по умолчанию

    // Расчет позиции треугольника CSS (18.5 = 33.33%, 25.0 = 66.66%)
    let cssPercent = 0;
    // Точки: 0->0%, 18.5->33.33%, 28->66.66%, 40->100% (условно)

    if (bmi <= 18.5) {
      // 1.1. BMI <= 18.5 — горит только seg-1 (Синий)
      titleStatus.textContent = "Your weight is within the low range";
      seg1.classList.add("blue");

      // Расчет позиции треугольника (от 0 до 18.5 -> от 0% до 33.33%)
      cssPercent = (bmi / 18.5) * 33.33;
      if (cssPercent < 0) cssPercent = 0;

      // Разница веса до нормы
      if (weightKg < minW) {
        rowDiff.classList.remove("hidden");
        const diff = toDisplayWeight(minW - weightKg);
        diffVal.textContent = `+${diff} ${unitLabel}`;
      }
    } else if (bmi >= 28.0) {
      // 1.2. BMI >= 28.0 — горит только seg-3 (Красный)
      titleStatus.textContent = "Your weight is within the high range";
      seg3.classList.add("red");

      // Расчет позиции треугольника (от 28.0 до 40.0 -> от 66.66% до 100%)
      // 40 BMI берем как условный максимум для шкалы
      cssPercent = 66.66 + ((bmi - 28.0) / (40.0 - 28.0)) * 33.34;
      if (cssPercent > 100) cssPercent = 100;

      // Разница веса (лишний вес)
      if (weightKg > maxW) {
        rowDiff.classList.remove("hidden");
        const diff = toDisplayWeight(weightKg - maxW);
        diffVal.textContent = `-${diff} ${unitLabel}`;
      }
    } else {
      // 1.3. В любом другом случае (18.5 < BMI < 28.0) — горит только seg-2 (Зеленый)
      titleStatus.textContent = "Your weight is within the normal range";
      seg2.classList.add("green");

      // Расчет позиции треугольника (от 18.5 до 28.0 -> от 33.33% до 66.66%)
      cssPercent = 33.33 + ((bmi - 18.5) / (28.0 - 18.5)) * 33.33;
    }

    // Применяем итоговую позицию треугольника
    document.getElementById("triangle-css").style.left = `${cssPercent}%`;
  }

  // Наблюдатель за переключением вью, чтобы запускать расчет при входе на экран 29
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
[file content end]
