import { weatherStore } from "../store/WeatherStore";
import { weatherService } from "../api/weatherService.js";

export class WeatherCard {
  constructor(container) {
    this.container = container;
    this.unsubscribe = null;
    this.elements = {};

    this.init();
  }

  init() {
    this.createStructure();
    this.unsubscribe = weatherStore.subscribe(this.render.bind(this));
    this.render(weatherStore.getState());
  }

  createStructure() {
    this.container.innerHTML = "";

    this.elements.card = document.createElement("div");
    this.elements.card.className = "weather-card";

    this.elements.header = document.createElement("div");
    this.elements.header.className = "weather-card__header";

    this.elements.city = document.createElement("h2");
    this.elements.city.className = "wether-card__city";

    this.elements.time = document.createElement("div");
    this.elements.time.className = "weather-card__time";

    this.elements.header.appendChild(this.elements.city);
    this.elements.header.appendChild(this.elements.time);

    this.elements.main = document.createElement("div");
    this.elements.main.className = "weather-card__main";

    this.elements.icon = document.createElement("img");
    this.elements.icon.className = "weather-card__icon";
    this.elements.icon.alt = "weather-icon";

    this.elements.temperature = document.createElement("div");
    this.elements.temperature.className = "weather-card__temperature";

    this.elements.main.appendChild(this.elements.icon);
    this.elements.main.appendChild(this.elements.temperature);

    this.elements.details = document.createElement("div");
    this.elements.details.className = "weather-card__details";

    this.elements.feelsLike = this.createDetailItem("feels-like", "Ощущается");
    this.elements.humidity = this.createDetailItem("humidity", "Влажность");
    this.elements.wind = this.createDetailItem("wind", "Ветер");
    this.elements.pressure = this.createDetailItem("pressure", "Давление");

    this.elements.actions = document.createElement("div");
    this.elements.actions.className = "weather-card__actions";

    this.elements.toggleUnitsBtn = document.createElement("button");
    this.elements.toggleUnitsBtn.className = "weather-card__toggle-units";
    this.elements.toggleUnitsBtn.type = "button";
    this.elements.toggleUnitsBtn.addEventListener("click", () => {
      weatherStore.toggleUnits();
    });

    this.elements.actions.appendChild(this.elements.toggleUnitsBtn);

    this.elements.card.appendChild(this.elements.header);
    this.elements.card.appendChild(this.elements.main);
    this.elements.card.appendChild(this.elements.details);
    this.elements.card.appendChild(this.elements.actions);

    this.container.appendChild(this.elements.card);
  }

  createDetailItem(key, label) {
    const item = document.createElement("div");
    item.className = `weather-card__detail weather-card__detail--${key}`;

    const labelEl = document.createElement("span");
    labelEl.className = "weather-card__detail-label";
    labelEl.textContent = label;

    const valueEl = document.createElement("span");
    valueEl.className = "weather-card__detail-value";

    item.appendChild(labelEl);
    item.appendChild(valueEl);

    this.elements.details.appendChild(item);

    return valueEl;
  }

  render(state) {
    const { currentWeather, isLoading, error, units } = state;

    if (isLoading) {
      this.renderLoading();
    } else if (error) {
      this.renderError(error);
    } else if (currentWeather) {
      this.renderWeather(currentWeather, units);
    } else {
      this.renderEmpty();
    }
  }

  renderWeather(weather, units) {
    const temp = Math.round(
      weatherStore.convertTemperature(weather.main.temp, units)
    );
    const feelsLike = Math.round(
      weatherStore.convertTemperature(weather.main.feels_like, units)
    );
    const unitSymbol = units === "metric" ? "°C" : "°F";

    this.elements.city.textContent = `${weather.name}, ${weather.sys.country}`;

    this.elements.time.textContent = weatherService.getLocalTime(weather);
    this.elements.time.title = weatherService.formatLocalTimeFull(weather);

    this.elements.temperature.textContent = `${temp}${unitSymbol}`;
    this.elements.icon.src = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
    this.elements.icon.alt = weather.weather[0].description;

    this.elements.feelsLike.textContent = `${feelsLike}${unitSymbol}`;
    this.elements.humidity.textContent = `${weather.main.humidity}%`;
    this.elements.wind.textContent = `${weather.wind.speed} м/с`;
    this.elements.pressure.textContent = `${weather.main.pressure} hPa`;

    this.elements.toggleUnitsBtn.textContent = `Переключить на ${
      units === "metric" ? "°F" : "°C"
    }`;

    this.elements.card.style.display = "block";

    this.startTimeUpdate(weather);
  }
  startTimeUpdate(weatherData) {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }

    const timezoneOffset = weatherData.timezone;

    // Первоначальное обновление
    this.updateCityTime(timezoneOffset);

    // Интервал для обновлений
    this.timeUpdateInterval = setInterval(() => {
      this.updateCityTime(timezoneOffset);
    }, 1000);
  }

  updateCityTime(timezoneOffset) {
    if (!this.elements.time) return;

    try {
      const now = new Date();
      const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
      const cityTime = new Date(utcTime + timezoneOffset * 1000);

      this.elements.time.textContent = this.formatTime(cityTime);
      this.elements.time.title = this.formatTimeFull(cityTime);
    } catch (error) {
      console.error("Time update error:", error);
      this.elements.time.textContent = "--:--";
    }
  }

  formatTime(date) {
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  formatTimeFull(date) {
    const dateStr = date.toLocaleDateString("ru-RU", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const timeStr = date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${dateStr}, ${timeStr}`;
  }

  renderLoading() {
    this.elements.card.style.display = "none";
    // TODO добавить скелетон-загрузчик
  }

  renderError(error) {
    this.elements.card.style.display = "none";
    // TODO сообщение об ошибке
  }

  renderEmpty() {
    this.elements.card.style.display = "none";
    // TODO cообщение "Введите город для поиска"
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
    }
  }
}
