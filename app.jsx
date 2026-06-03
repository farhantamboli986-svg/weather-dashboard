const { useState, useEffect } = React;

function getWeatherIcon(code, isDay = true) {
    const weatherCodeMap = {
        0: '☀️', 1: '⛅', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
        51: '🌦️', 61: '🌧️', 63: '🌧️', 65: '🌧️',
        71: '❄️', 73: '❄️', 75: '❄️',
        80: '🌧️', 81: '🌧️', 82: '⛈️',
        85: '❄️', 86: '❄️', 95: '⛈️', 96: '⛈️', 99: '⛈️',
    };
    return weatherCodeMap[code] || '🌡️';
}

function getDayName(dateString) {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
}

function WeatherDashboard() {
    const [city, setCity] = useState('London');
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [coordinates, setCoordinates] = useState({ lat: 51.5074, lon: -0.1278 });

    const getCoordinates = async (cityName) => {
        try {
            setLoading(true);
            setError('');
            
            const response = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`
            );
            const data = await response.json();

            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                setCoordinates({
                    lat: result.latitude,
                    lon: result.longitude,
                });
                return { lat: result.latitude, lon: result.longitude };
            } else {
                setError(`City "${cityName}" not found. Try another search.`);
                setLoading(false);
                return null;
            }
        } catch (err) {
            setError('Error fetching city: ' + err.message);
            setLoading(false);
            return null;
        }
    };

    const fetchWeather = async (lat, lon) => {
        try {
            setLoading(true);
            setError('');

            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
            );
            const data = await response.json();

            if (data.current) {
                const current = {
                    temp: data.current.temperature_2m,
                    humidity: data.current.relative_humidity_2m,
                    windSpeed: data.current.wind_speed_10m,
                    weatherCode: data.current.weather_code,
                    isDay: data.current.is_day,
                };
                setWeather(current);

                const forecastData = data.daily.time.slice(0, 7).map((date, index) => ({
                    date,
                    maxTemp: data.daily.temperature_2m_max[index],
                    minTemp: data.daily.temperature_2m_min[index],
                    weatherCode: data.daily.weather_code[index],
                }));
                setForecast(forecastData);
            }
            setLoading(false);
        } catch (err) {
            setError('Error fetching weather: ' + err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather(coordinates.lat, coordinates.lon);
    }, [coordinates]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (city.trim()) {
            const coords = await getCoordinates(city);
            if (coords) {
                setCoordinates(coords);
            }
        }
    };

    return (
        <div className="container">
            <div className="header">
                <h1>🌤️ Weather Dashboard</h1>
                <p>Get real-time weather information</p>
            </div>

            <form className="search-container" onSubmit={handleSearch}>
                <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name..."
                />
                <button type="submit">Search</button>
            </form>

            {error && <div className="error">{error}</div>}

            {loading && (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading weather data...</p>
                </div>
            )}

            {weather && !loading && (
                <div className="current-weather">
                    <h2 className="city-name">{city}</h2>
                    <p className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    
                    <div className="weather-icon">
                        {getWeatherIcon(weather.weatherCode, weather.isDay)}
                    </div>
                    
                    <div className="temperature-display">
                        {Math.round(weather.temp)}°C
                    </div>

                    <div className="weather-info">
                        <div className="weather-item">
                            <div className="label">Humidity</div>
                            <div className="value">{weather.humidity}%</div>
                        </div>
                        <div className="weather-item">
                            <div className="label">Wind Speed</div>
                            <div className="value">{Math.round(weather.windSpeed)} km/h</div>
                        </div>
                        <div className="weather-item">
                            <div className="label">Feels Like</div>
                            <div className="value">{Math.round(weather.temp - 2)}°C</div>
                        </div>
                    </div>
                </div>
            )}

            {forecast.length > 0 && !loading && (
                <div>
                    <h3 className="forecast-title">📅 7-Day Forecast</h3>
                    <div className="forecast-grid">
                        {forecast.map((day, index) => (
                            <div key={index} className="forecast-card">
                                <div className="day">{getDayName(day.date)}</div>
                                <div className="icon">{getWeatherIcon(day.weatherCode)}</div>
                                <div className="temp">
                                    {Math.round(day.maxTemp)}° / {Math.round(day.minTemp)}°
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<WeatherDashboard />);
