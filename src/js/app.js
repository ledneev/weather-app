import { weatherStore } from "./store/WeatherStore.js";
import { WeatherCard } from "./components/WeatherCard.js";
import { SearchForm } from "./components/SearchForm.js";

class WeatherApp {
  constructor() {
    this.components = {};
    this.init();
  }

  init() {
    console.log("🌤️ Weather App инициализируется...");

    this.components.searchForm = new SearchForm(
      document.getElementById("search-container") 
    );

    this.components.weatherCard = new WeatherCard(
      document.getElementById("weather-container")
    );

    this.unsubscribeStore = weatherStore.subscribe(
      this.handleStoreUpdate.bind(this)
    );
    this.loadInitialWeather();

    console.log("✅ Weather App запущена!");
  }

  handleStoreUpdate(state) {
    if (state.currentWeather) {
      this.hideEmptyState();
    }
  }

  hideEmptyState() {
    const container = document.getElementById("weather-container");
    if (container && container.innerHTML.includes("Добро пожаловать")) {
      container.innerHTML = "";
      console.log("🗑️ Empty state очищен");
    }
  }

  async loadInitialWeather() {
    const lastCity = localStorage.getItem("lastSearchedCity");

    if (lastCity) {
      console.log(`🔄 Загружаем погоду для последнего города: ${lastCity}`);
      await weatherStore.fetchWeather(lastCity);
    } else {
      console.log("ℹ️ Введите город для отображения погоды");
      this.showEmptyState();
    }
  }

  showEmptyState() {
    const container = document.getElementById("weather-container");
    if (container && !container.querySelector(".weather-card")) {
      container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <h2>Добро пожаловать в Weather App! 🌤️</h2>
                    <p>Введите город в поиске, чтобы увидеть погоду</p>
                </div>
            `;
    }
  }

  destroy() {
    Object.values(this.components).forEach((component) => {
      if (component.destroy) {
        component.destroy();
      }
    });

    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.weatherApp = new WeatherApp();
});

window.weatherStore = weatherStore;
