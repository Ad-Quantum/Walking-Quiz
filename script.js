const fill = document.getElementById("progressFill");
const percent = document.getElementById("progressPercent");

const page1 = document.getElementById("page1");
const page2 = document.getElementById("page2");

let value = 0;

const timer = setInterval(() => {
  value += 1;
  if (value > 100) value = 100;

  // обновляем прогресс
  fill.style.width = value + "%";
  percent.textContent = value + "%";

  if (value === 100) {
    clearInterval(timer);

    // ждём 2 секунды и переключаем экран
    setTimeout(() => {
      page1.classList.add("hidden");
      page2.classList.remove("hidden");
    }, 2000);
  }
}, 40);
