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
      favoriteCities: this.loadFavoritesFromStorage(),
      currentCity: null,
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

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Геолокация не поддерживается браузером"));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000,
      });
    });
  }

  async fetchWeatherByGeolocation() {
    this.setState({ isLoading: true, error: null });

    try {
      const position = await this.getCurrentPosition();
      const weather = await weatherService.getWeatherByCoords(
        position.coords.latitude,
        position.coords.longitude
      );

      const [briefForecast, detailedForecast] = await Promise.all([
        weatherService.getBriefForecast(weather.name, 3),
        weatherService.getDetailedForecast(weather.name, 5),
      ]);

      this.setState({
        currentWeather: weather,
        briefForecast,
        detailedForecast,
        selectedDay: Object.keys(detailedForecast.forecastsByDay)[0],
        isLoading: false,
        error: null,
      });

      localStorage.setItem("lastSearchedCity", weather.name);
    } catch (error) {
      this.setState({
        isLoading: false,
        error: this.getGeolocationError(error),
      });
    }
  }

  getGeolocationError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Доступ к геолокации запрещён. Разрешите доступ в настройках браузера.";
      case error.POSITION_UNAVAILABLE:
        return "Информация о местоположении недоступна.";
      case error.TIMEOUT:
        return "Время ожидания геолокации истекло.";
      default:
        return "Не удалось определить местоположение.";
    }
  }

loadFavoritesFromStorage() {
    try {
        const stored = localStorage.getItem('favoriteCities');

        if (!stored || stored === 'null' || stored === 'undefined') {
            return [];
        }
        
        const parsed = JSON.parse(stored);

        return Array.isArray(parsed) ? parsed : [];
        
    } catch (error) {
        console.error('Error loading favorites:', error);

        localStorage.removeItem('favoriteCities');
        return [];
    }
}

  saveFavoritesToStorage(favorites) {
    try {
      localStorage.setItem("favoriteCities", JSON.stringify(favorites));
    } catch (error) {
      console.error("Error saving favorites", error);
    }
  }

  addToFavorites(cityData) {
    const favorite = {
      id: `${cityData.name}-${cityData.sys.country}`,
      name: cityData.name,
      country: cityData.sys.country,
      temp: Math.round(cityData.main.temp),
      weather: cityData.weather[0],
      timestamp: Date.now(),
    };

    const favorites = [...this.state.favoriteCities];

    if (!favorites.find((fav) => fav.id === favorite.id)) {
      favorites.push(favorite);
      this.setState({ favoriteCities: favorites });
      this.saveFavoritesToStorage(favorites);
      return true;
    }
    return false;
  }

  removeFromFavorites(cityId) {
    const favorites = this.state.favoriteCities.filter(
      (fav) => fav.id !== cityId
    );
    this.setState({ favoriteCities: favorites });
    this.saveFavoritesToStorage(favorites);
  }

  isFavorite(cityData) {
    const cityId = `${cityData.name}-${cityData.sys.country}`;
    return this.state.favoriteCities.some((fav) => fav.id === cityId);
  }

  async loadFavoriteCity(cityName) {
    this.setState({ isLoading: true, error: null });

    try {
      const [currentWeather, briefForecast, detailedForecast] =
        await Promise.all([
          weatherService.getCurrentWeather(cityName),
          weatherService.getBriefForecast(cityName, 3),
          weatherService.getDetailedForecast(cityName, 5),
        ]);

      this.setState({
        currentWeather,
        briefForecast,
        detailedForecast,
        selectedDay: Object.keys(detailedForecast.forecastsByDay)[0],
        isLoading: false,
        error: null,
      });

      localStorage.setItem("lastSearchedCity", cityName);
    } catch (error) {
      this.setState({
        isLoading: false,
        error: this.getUserFriendlyError(error),
      });
    }
  }
}

export const weatherStore = new WeatherStore();
