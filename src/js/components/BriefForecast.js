import { weatherStore } from "../store/WeatherStore";

export class BriefForecast {
  constructor(container) {
    if (!container) {
      console.error("BriefForecast: container is null or undefined");
      return;
    }

    this.container = container;
    this.elements = {};
    this.unsubscribe = null;

    this.init();
  }

  init() {
    this.createStructure();
    this.unsubscribe = weatherStore.subscribe(this.render.bind(this));
    this.render(weatherStore.getState());
  }

  createStructure() {
    this.container.innerHTML = "";

    this.elements.section = document.createElement("section");
    this.elements.section.className = "brief-forecast";

    this.elements.header = document.createElement("h2");
    this.elements.header.className = "brief-forecast__header";

    this.elements.days = document.createElement("div");
    this.elements.days.className = "brief-forecast__days";

    this.elements.section.appendChild(this.elements.header);
    this.elements.section.appendChild(this.elements.days);
    this.container.appendChild(this.elements.section);

    this.elements.section.style.display = "none";
  }

  render(state) {
    const { briefForecast, isLoading, error, units } = state;

    if (isLoading) {
      this.renderLoading();
    } else if (error || !briefForecast) {
      this.renderEmpty();
    } else {
      this.renderForecast(briefForecast, units);
    }
  }

  renderForecast(forecastData, units) {
    this.elements.header.textContent = "Прогноз на 3 дня";

    this.elements.days.innerHTML = "";

    forecastData.forecasts.forEach((day, index) => {
      const dayElement = this.createDayElement(day, units, index);
      this.elements.days.appendChild(dayElement);
    });

    this.elements.section.style.display = "block";
  }

  createDayElement(day, units, index) {
    const dayElement = document.createElement("div");
    dayElement.className = "brief-forecast__day";
    dayElement.setAttribute("data-date", day.dateString);
    dayElement.setAttribute("role", "button");
    dayElement.setAttribute("tabindex", "0");
    dayElement.setAttribute("aria-expanded", "false");

    dayElement.addEventListener("click", () => {
      this.toggleDayDetails(day.dateString);
    });

    dayElement.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        this.toggleDayDetails(day.dateString);
      }
    });

    const dayName = document.createElement("div");
    dayName.className = "brief-forecast__day-name";
    dayName.textContent = this.getDayName(day.date, index);

    const icon = document.createElement("img");
    icon.className = "brief-forecast__icon";
    icon.src = `https://openweathermap.org/img/wn/${day.weather.icon}.png`;
    icon.alt = day.weather.description;

    const tempsContainer = document.createElement("div");
    tempsContainer.className = "brief-forecast__temps";

    const tempMaxValue = Math.round(
      weatherStore.convertTemperature(day.temp.max, units)
    );
    const tempMinValue = Math.round(
      weatherStore.convertTemperature(day.temp.min, units)
    );
    const unitSymbol = units === "metric" ? "°C" : "°F";

    const tempMax = document.createElement("span");
    tempMax.className = "brief-forecast__temp-max";
    tempMax.textContent = `${tempMaxValue}${unitSymbol}`;

    const tempMin = document.createElement("span");
    tempMin.className = "brief-forecast__temp-min";
    tempMin.textContent = `${tempMinValue}${unitSymbol}`;

    tempsContainer.appendChild(tempMax);
    tempsContainer.appendChild(tempMin);

    const weatherDesc = document.createElement("div");
    weatherDesc.className = "brief-forecast__weather";
    weatherDesc.textContent = day.weather.description;

    dayElement.appendChild(dayName);
    dayElement.appendChild(icon);
    dayElement.appendChild(tempsContainer);
    dayElement.appendChild(weatherDesc);

    return dayElement;
  }
  toggleDayDetails(dateString) {
    const { detailedForecast } = weatherStore.getState();

    if (!detailedForecast) return;

    const dayData = detailedForecast.forecastsByDay[dateString];

    const dayElement = this.container.querySelector(
      `[data-date="${dateString}"]`
    );

    if (!dayElement) return;

    const isExpanded = dayElement.getAttribute("aria-expanded") === "true";

    if (isExpanded) {
      this.collapseDayDetails(dayElement);
    } else {
      this.collapseAllDayDetails();
      this.expandDayDetails(dayElement, dayData);
    }
  }

  expandDayDetails(dayElement, dayData) {
    const detailsContainer = document.createElement("div");
    detailsContainer.className = "brief-forecast__day-details";

    const hoursContainer = document.createElement("div");
    hoursContainer.className = "brief-forecast__hours";

    dayData.forecasts.forEach((hour) => {
      const hourElement = this.createHourElement(hour);
      hoursContainer.appendChild(hourElement);
    });

    detailsContainer.appendChild(hoursContainer);

    dayElement.parentNode.insertBefore(
      detailsContainer,
      dayElement.nextSibling
    );

    dayElement.setAttribute("aria-expanded", "true");
    dayElement.classList.add("brief-forecast__day--expanded");
  }

  collapseDayDetails(dayElement) {
    const detailsContainer = dayElement.nextElementSibling;
    if (
      detailsContainer &&
      detailsContainer.classList.contains("brief-forecast__day-details")
    ) {
      detailsContainer.remove();
    }

    dayElement.setAttribute("aria-expanded", "false");
    dayElement.classList.remove("brief-forecast__day--expanded");
  }

  collapseAllDayDetails() {
    const expandedDays = this.container.querySelectorAll(
      ".brief-forecast__day--expanded"
    );
    expandedDays.forEach((dayElement) => {
      this.collapseDayDetails(dayElement);
    });
  }

  createHourElement(hourData) {
    const { units } = weatherStore.getState();

    const tempValue = Math.round(
      weatherStore.convertTemperature(hourData.temp, units)
    );
    const unitSymbol = units === "metric" ? "°C" : "°F";

    const hourElement = document.createElement("div");
    hourElement.className = "brief-forecast__hour";

    hourElement.innerHTML = `
        <div class="brief-forecast__hour-time">${hourData.time}</div>
        <img class="brief-forecast__hour-icon" 
             src="https://openweathermap.org/img/wn/${
               hourData.weather.icon
             }.png" 
             alt="${hourData.weather.description}">
        <div class="brief-forecast__hour-temp">${tempValue}${unitSymbol}</div> <!-- ⭐ КОНВЕРТИРОВАННАЯ ТЕМПЕРАТУРА ⭐ -->
        <div class="brief-forecast__hour-details">
            <span>💧 ${hourData.humidity}%</span>
            <span>💨 ${hourData.wind_speed} м/с</span>
            ${
              hourData.pop > 0
                ? `<span>🌧️ ${Math.round(hourData.pop * 100)}%</span>`
                : ""
            }
        </div>
    `;

    return hourElement;
  }

  getDayName(date, index) {
    const today = new Date();
    const targetDate = new Date(date);

    if (index === 0) return "Завтра";

    const options = { weekday: "short" };
    return targetDate.toLocaleDateString("ru-RU", options);
  }

  renderLoading() {
    this.elements.days.innerHTML = "";

    const loadingElement = document.createElement("div");
    loadingElement.className = "brief-forecast__loading";

    const spinner = document.createElement("div");
    spinner.className = "brief-forecast__loading-spinner";

    const text = document.createElement("p");
    text.textContent = "Загружаем прогноз...";

    loadingElement.appendChild(spinner);
    loadingElement.appendChild(text);
    this.elements.days.appendChild(loadingElement);

    this.elements.section.style.display = "block";
  }

  renderEmpty() {
    this.elements.section.style.display = "none";
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
