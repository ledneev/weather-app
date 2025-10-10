import { weatherStore } from "../store/WeatherStore";

export class SearchForm {
  constructor(container) {
    if (!container) {
      console.error("SearchForm: container is null or undefined");
      return;
    }

    this.container = container;
    this.elements = {};
    this.isLoading = false;

    this.init();
  }

  init() {
    this.createStructure();
    this.bindEvents();
    this.loadSearchHistory();
  }

  createStructure() {
    this.container.innerHTML = "";

    this.elements.form = document.createElement("form");
    this.elements.form.className = "search-form";
    this.elements.form.noValidate = true;

    this.elements.inputGroup = document.createElement("div");
    this.elements.inputGroup.className = "search-form__input-group";

    this.elements.input = document.createElement("input");
    this.elements.input.type = "text";
    this.elements.input.className = "search-form__input";
    this.elements.input.placeholder = "Введите город...";
    this.elements.input.required = true;

    this.elements.button = document.createElement("button");
    this.elements.button.type = "submit";
    this.elements.button.className = "search-form__button";
    this.elements.button.innerHTML = "🔍";
    this.elements.button.title = "Найти погоду";

    this.elements.loading = document.createElement("div");
    this.elements.loading.className = "search-form__loading";
    this.elements.loading.innerHTML = "⏳";
    this.elements.loading.style.display = "none";

    this.elements.error = document.createElement("div");
    this.elements.error.className = "search-form__error";
    this.elements.error.style.display = "none";

    this.elements.inputGroup.appendChild(this.elements.input);
    this.elements.inputGroup.appendChild(this.elements.button);
    this.elements.inputGroup.appendChild(this.elements.loading);

    this.elements.form.appendChild(this.elements.inputGroup);
    this.elements.form.appendChild(this.elements.error);

    this.container.appendChild(this.elements.form);
  }

  bindEvents() {
    this.elements.form.addEventListener("submit", this.handleSubmit.bind(this));
    this.elements.input.addEventListener("input", this.handleInput.bind(this));
    this.unsubscribe = weatherStore.subscribe(
      this.handleStoreUpdate.bind(this)
    );
  }

  handleSubmit(event) {
    event.preventDefault();

    const city = this.elements.input.value.trim();

    if (this.validateInput(city)) {
      this.searchWeather(city);
    }
  }

  handleInput() {
    this.hideError();
  }

  handleStoreUpdate(state) {
    if (this.isLoading !== state.isLoading) {
      this.isLoading = state.isLoading;
      this.updateLoadingState();
    }

    if (state.error) {
      this.showError(state.error);
    } else {
      this.hideError();
    }

    if (state.currentWeather && !state.isLoading && !state.error) {
      this.saveToHistory(state.currentWeather.name);
      this.clearInput();
    }
  }

  async searchWeather(city) {
    try {
      this.setLoading(true);
      await weatherStore.fetchWeather(city);
    } catch (error) {
      console.error("Search error:", error);
      this.showError("Ошибка при поиске города");
    } finally {
      this.setLoading(false);
    }
  }

  validateInput(city) {
    if (!city) {
      this.showError("Введите название города");
      return false;
    }

    if (city.length < 2) {
      this.showError("Название города слишком короткое");
      return false;
    }

    if (!/^[a-zA-Zа-яА-Я\s\-]+$/i.test(city)) {
      this.showError("Некорректные символы в названии города");
      return false;
    }

    this.hideError();
    return true;
  }

  setLoading(isLoading) {
    this.isLoading = isLoading;
    this.updateLoadingState();
  }

  updateLoadingState() {
    if (this.isLoading) {
      this.elements.button.disabled = true;
      this.elements.input.disabled = true;
      this.elements.loading.style.display = "block";
      this.elements.button.style.display = "none";
    } else {
      this.elements.button.disabled = false;
      this.elements.input.disabled = false;
      this.elements.loading.style.display = "none";
      this.elements.button.style.display = "block";
    }
  }

  showError(message) {
    this.elements.error.textContent = message;
    this.elements.error.style.display = "block";
    this.elements.input.focus();
  }

  hideError() {
    this.elements.error.style.display = "none";
  }

  clearInput() {
    this.elements.input.value = "";
  }

  saveToHistory(city) {
    let history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    history = [city, ...history.filter((item) => item !== city)].slice(0, 5);
    localStorage.setItem("searchHistory", JSON.stringify(history));
  }

  loadSearchHistory() {
    //TODO добавить автодополнение позже
    const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    console.log("История поиска:", history);
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
