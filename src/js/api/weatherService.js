export class WeatherService {
    constructor() {
        this.baseURL = import.meta.env.VITE_API_BASE_URL;
        this.apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
    }

    /**
     * Получает текущую погоду для города
     */
    async getCurrentWeather(city) {
        const url = `${this.baseURL}/weather?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=ru`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * КРАТКИЙ прогноз - для главной страницы (группировка по дням)
     */
    async getBriefForecast(city, days = 5) {
        const data = await this.fetchForecastData(city);
        return this.processBriefForecastData(data, days);
    }

    /**
     * ДЕТАЛЬНЫЙ прогноз - для почасового просмотра (все интервалы)
     */
    async getDetailedForecast(city, days = 5) {
        const data = await this.fetchForecastData(city);
        return this.processDetailedForecastData(data, days);
    }

    /**
     * Общий метод для получения сырых данных прогноза
     */
    async fetchForecastData(city) {
        const url = `${this.baseURL}/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric&lang=ru`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * Обработка данных для КРАТКОГО прогноза (группировка по дням)
     */
    processBriefForecastData(forecastData, days) {
        const dailyForecasts = {};
        
        forecastData.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const dateKey = date.toDateString();
            
            if (!dailyForecasts[dateKey]) {
                dailyForecasts[dateKey] = {
                    date: date,
                    dateString: this.formatDate(date),
                    temps: [],
                    weather: [],
                    humidity: [],
                    wind: [],
                    pressure: []
                };
            }
            
            dailyForecasts[dateKey].temps.push(item.main.temp);
            dailyForecasts[dateKey].weather.push({
                main: item.weather[0].main,
                description: item.weather[0].description,
                icon: item.weather[0].icon
            });
            dailyForecasts[dateKey].humidity.push(item.main.humidity);
            dailyForecasts[dateKey].wind.push(item.wind.speed);
            dailyForecasts[dateKey].pressure.push(item.main.pressure);
        });
        
        const processedForecasts = Object.values(dailyForecasts)
            .slice(0, days)
            .map(day => this.calculateDailyStats(day));
        
        return {
            city: forecastData.city,
            forecasts: processedForecasts
        };
    }

    /**
     * Обработка данных для ДЕТАЛЬНОГО прогноза (все интервалы)
     */
    processDetailedForecastData(forecastData, days) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + days);
        
        const detailedForecasts = forecastData.list
            .filter(item => {
                const itemDate = new Date(item.dt * 1000);
                return itemDate <= targetDate;
            })
            .map(item => ({
                datetime: new Date(item.dt * 1000),
                timestamp: item.dt,
                date: this.formatDate(new Date(item.dt * 1000)),
                time: this.formatTime(new Date(item.dt * 1000)),
                temp: Math.round(item.main.temp),
                feels_like: Math.round(item.main.feels_like),
                humidity: item.main.humidity,
                pressure: item.main.pressure,
                wind_speed: item.wind.speed,
                wind_deg: item.wind.deg,
                weather: {
                    main: item.weather[0].main,
                    description: item.weather[0].description,
                    icon: item.weather[0].icon
                },
                pop: item.pop || 0
            }));

        const forecastsByDay = this.groupForecastsByDay(detailedForecasts);

        return {
            city: forecastData.city,
            forecasts: detailedForecasts,
            forecastsByDay: forecastsByDay
        };
    }

    /**
     * Группирует прогнозы по дням
     */
    groupForecastsByDay(forecasts) {
        const grouped = {};
        
        forecasts.forEach(forecast => {
            const dateKey = forecast.date;
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = {
                    date: forecast.date,
                    dateObj: new Date(forecast.datetime),
                    forecasts: []
                };
            }
            
            grouped[dateKey].forecasts.push(forecast);
        });
        
        return grouped;
    }

    /**
     * Вычисляет статистику для дня (среднее, максимум, минимум)
     */
    calculateDailyStats(dayData) {
        const temps = dayData.temps;
        const humidity = dayData.humidity;
        const wind = dayData.wind;
        const pressure = dayData.pressure;
        
        return {
            date: dayData.date,
            dateString: dayData.dateString,
            temp: {
                current: Math.round(temps[0]),
                max: Math.round(Math.max(...temps)),
                min: Math.round(Math.min(...temps)),
                average: Math.round(temps.reduce((a, b) => a + b) / temps.length)
            },
            weather: dayData.weather[0],
            allWeather: dayData.weather,
            humidity: Math.round(humidity.reduce((a, b) => a + b) / humidity.length),
            wind: Math.round(wind.reduce((a, b) => a + b) / wind.length * 10) / 10,
            pressure: Math.round(pressure.reduce((a, b) => a + b) / pressure.length)
        };
    }

    /**
     * Форматирует дату в читаемый вид
     */
    formatDate(date) {
        const options = { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        };
        return date.toLocaleDateString('ru-RU', options);
    }

    /**
     * Форматирует время
     */
    formatTime(date) {
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

export const weatherService = new WeatherService();