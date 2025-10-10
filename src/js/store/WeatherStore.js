import { weatherService } from "../api/weatherService.js";

export class WeatherStore {
  constructor() {
    this.state = {
      currentWeather: null,
      briefForecast: null,
      detailedForecast: null,
      selectedDay: null,
      isLoading: false,
      error: null,
      units: "metric",
      language: "ru",
      lastUpdate: null,
    };
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach((callback) => callback(this.state));
  }

  setState(newState) {
    this.state = {
      ...this.state,
      ...newState,
      lastUpdate: new Date().toISOString(),
    };
    this.notifySubscribers();
  }

  getState() {
    return { ...this.state };
  }

  async fetchWeather(city) {
    this.setState({ isLoading: true, error: null });

    try {
      const [currentWeather, briefForecast, detailedForecast] =
        await Promise.all([
          weatherService.getCurrentWeather(city),
          weatherService.getBriefForecast(city, 3),
          weatherService.getDetailedForecast(city, 5),
        ]);

      this.setState({
        currentWeather: currentWeather,
        briefForecast: briefForecast,
        detailedForecast: detailedForecast,
        selectedDay: Object.keys(detailedForecast.forecastsByDay)[0],
        isLoading: false,
        error: null,
      });

      localStorage.setItem("lastSearchedCity", city);
    } catch (error) {
      this.setState({
        isLoading: false,
        error: this.getUserFriendlyError(error),
      });
    }
  }

  selectDay(date) {
    this.setState({ selectedDay: date });
  }

  getSelectedDayForecast() {
    if (!this.state.detailedForecast || !this.state.selectedDay) {
      return null;
    }

    return this.state.detailedForecast.forecastsByDay[this.state.selectedDay];
  }

  toggleUnits() {
    const newUnits = this.state.units === "metric" ? "imperial" : "metric";
    this.setState({ units: newUnits });
  }

  changeLanguage(lang) {
    this.setState({ language: lang });
  }

  clearError() {
    this.setState({ error: null });
  }

  getUserFriendlyError(error) {
    if (error.message.includes("404")) {
      return "Город не найден. Проверьте название.";
    } else if (error.message.includes("401")) {
      return "Ошибка API ключа. Проверьте настройки.";
    } else if (error.message.includes("Network Error")) {
      return "Проблемы с интернет-соединением.";
    } else {
      return "Произошла неизвестная ошибка. Попробуйте позже.";
    }
  }
  convertTemperature(temp, toUnits) {
    const fromUnits = "metric";

    if (fromUnits === toUnits) return temp;

    if (toUnits === "imperial") {
      return (temp * 9) / 5 + 32;
    }

    return temp;
  }
}

export const weatherStore = new WeatherStore();
