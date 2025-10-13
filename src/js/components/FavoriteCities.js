import { weatherStore } from "../store/WeatherStore";

export class FavoriteCities {
    constructor(container) {
        if (!container) {
            console.error('FavoriteCities: container is null or undefined');
            return;
        }
        
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
        this.container.innerHTML = '';
        
        this.elements.section = document.createElement('section');
        this.elements.section.className = 'favorite-cities';
        
        this.elements.header = document.createElement('h3');
        this.elements.header.className = 'favorite-cities__header';
        this.elements.header.textContent = 'Избранные города';
        
        this.elements.list = document.createElement('div');
        this.elements.list.className = 'favorite-cities__list';
        
        this.elements.section.appendChild(this.elements.header);
        this.elements.section.appendChild(this.elements.list);
        this.container.appendChild(this.elements.section);
    }

    render(state) {
        const { favoriteCities, currentWeather } = state;
        
        if (favoriteCities.length === 0) {
            this.renderEmpty();
        } else {
            this.renderFavorites(favoriteCities, currentWeather);
        }
    }

    renderFavorites(favorites, currentWeather) {
        this.elements.list.innerHTML = '';

        favorites.forEach(city => {
            const cityElement = this.createCityElement(city, currentWeather);
            this.elements.list.appendChild(cityElement);
        });
        
        this.elements.section.style.display = 'block';
    }

    createCityElement(city, currentWeather) {
        const cityElement = document.createElement('div');
        cityElement.className = 'favorite-city';
        cityElement.setAttribute('data-city-id', city.id);

        const isCurrent = currentWeather && 
                         `${currentWeather.name}-${currentWeather.sys.country}` === city.id;
        
        if (isCurrent) {
            cityElement.classList.add('favorite-city--current');
        }

        const infoContainer = document.createElement('div');
        infoContainer.className = 'favorite-city__info';

        const nameElement = document.createElement('div');
        nameElement.className = 'favorite-city__name';
        nameElement.textContent = `${city.name}, ${city.country}`;

        const tempElement = document.createElement('div');
        tempElement.className = 'favorite-city__temp';
        tempElement.textContent = `${city.temp}°C`;

        const iconElement = document.createElement('img');
        iconElement.className = 'favorite-city__icon';
        iconElement.src = `https://openweathermap.org/img/wn/${city.weather.icon}.png`;
        iconElement.alt = city.weather.description;

        infoContainer.appendChild(nameElement);
        infoContainer.appendChild(tempElement);
        infoContainer.appendChild(iconElement);

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'favorite-city__actions';

        const loadButton = document.createElement('button');
        loadButton.className = 'favorite-city__load-btn';
        loadButton.title = 'Загрузить погоду';
        loadButton.textContent = '📍';
        loadButton.addEventListener('click', () => {
            weatherStore.loadFavoriteCity(city.name);
        });

        const removeButton = document.createElement('button');
        removeButton.className = 'favorite-city__remove-btn';
        removeButton.title = 'Удалить из избранного';
        removeButton.textContent = '❌';
        removeButton.addEventListener('click', () => {
            weatherStore.removeFromFavorites(city.id);
        });

        actionsContainer.appendChild(loadButton);
        actionsContainer.appendChild(removeButton);

        cityElement.appendChild(infoContainer);
        cityElement.appendChild(actionsContainer);
        
        return cityElement;
    }

    renderEmpty() {
        this.elements.list.innerHTML = '';

        const emptyElement = document.createElement('div');
        emptyElement.className = 'favorite-cities__empty';
        
        const message = document.createElement('p');
        message.textContent = 'Нет избранных городов';
        
        const hint = document.createElement('p');
        hint.className = 'favorite-cities__hint';
        hint.textContent = 'Добавьте город в избранное, нажав на звезду в карточке погоды';
        
        emptyElement.appendChild(message);
        emptyElement.appendChild(hint);
        
        this.elements.list.appendChild(emptyElement);
        this.elements.section.style.display = 'block';
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}