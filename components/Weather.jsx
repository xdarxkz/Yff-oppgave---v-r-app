import React, { useState, useEffect } from 'react';
import './Weather.css';
import search_icon from '../assets/search.png';
import wind_icon from '../assets/wind.png';
import rain_icon from '../assets/rain.png';
import clear_icon from '../assets/clear.png';
import cloud_icon from '../assets/cloud.png';
import drizzle_icon from '../assets/drizzle.png';
import snow_icon from '../assets/snow.png';

export default function Weather() {
  const [weatherData, setWeatherData] = useState(null); // Lagrer værdata
  const [location, setLocation] = useState('Oslo'); // Standard sted
  const [coordinates, setCoordinates] = useState({ lat: 59.9139, lon: 10.7522 }); // Koordinater for Oslo
  const [loading, setLoading] = useState(false); // Lastestatus
  const [searchInput, setSearchInput] = useState(''); // Søketekst
  const [suggestions, setSuggestions] = useState([]); // Forslag til byer
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1); // Indeks for aktivt forslag
  const [clockColor, setClockColor] = useState('#ffffff'); // Farge på klokken
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString()); // Nåværende tid

  // Oppdaterer tiden hvert sekund
  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timerId); // Rydd opp ved avmontering
  }, []);

  // Hent koordinater basert på stedsnavn ved bruk av Nominatim
  const fetchCoordinates = async (locationName) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${locationName}&format=json&limit=1`);
      const data = await response.json();
      if (data && data.length > 0) {
        setCoordinates({ lat: data[0].lat, lon: data[0].lon });
        setLocation(locationName);
      } else {
        alert('Sted ikke funnet');
      }
    } catch (error) {
      console.error('Feil ved henting av koordinater:', error);
    }
  };

  // Hent byforslag basert på søketekst
  const fetchCitySuggestions = async (query) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=10`);
      const data = await response.json();
      if (data) {
        const suggestions = data.map(item => `${item.display_name}`);
        setSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Feil ved henting av byforslag:', error);
    }
  };

  // Hent værdata fra Yr.no
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true); // Sett til å laste
      try {
        const response = await fetch(
          `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${coordinates.lat}&lon=${coordinates.lon}`,
          {
            headers: { 'User-Agent': 'DittProgramNavn/1.0 (din.email@eksempel.com)' }, // Yr.no krever User-Agent header
          }
        );
        const data = await response.json();
        setWeatherData(data); // Lagrer værdata
        updateClockColor(data); // Oppdaterer klokkefargen
      } catch (error) {
        console.error('Feil ved henting av værdata:', error);
      } finally {
        setLoading(false); // Sett lasting til ferdig
      }
    };

    if (coordinates.lat && coordinates.lon) {
      fetchWeather(); // Hent vær hvis koordinater er satt
    }
  }, [coordinates]);

  // Oppdater fargen på klokken basert på værforhold
  const updateClockColor = (data) => {
    const weatherDetails = data.properties.timeseries[0].data.next_1_hours?.summary?.symbol_code || '';
    if (weatherDetails.includes('clear')) {
      setClockColor('#FFD700'); // Gull for klart vær
    } else if (weatherDetails.includes('cloud')) {
      setClockColor('#C0C0C0'); // Sølv for skyer
    } else if (weatherDetails.includes('rain')) {
      setClockColor('#4682B4'); // Stålblått for regn
    } else if (weatherDetails.includes('snow')) {
      setClockColor('#F0F8FF'); // Lys blå for snø
    } else {
      setClockColor('#FFFFFF'); // Standard farge
    }
  };

  // Utfører søk når brukeren trykker på søkeknappen
  const handleSearch = () => {
    if (searchInput.trim()) {
      fetchCoordinates(searchInput);
      setSuggestions([]); // Fjern forslag
    }
  };

  // Håndterer tastetrykk i søkefeltet
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'ArrowDown') {
      setActiveSuggestionIndex((prevIndex) => Math.min(prevIndex + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      setActiveSuggestionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
      setSearchInput(suggestions[activeSuggestionIndex]);
      fetchCoordinates(suggestions[activeSuggestionIndex]);
      setSuggestions([]); // Fjern forslag
      setActiveSuggestionIndex(-1);
    }
  };

  // Oppdaterer søketekst og henter nye byforslag
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    setSearchInput(inputValue);
    if (inputValue.length > 1) {
      fetchCitySuggestions(inputValue); // Hent forslag hvis tekstlengden er over 1
    } else {
      setSuggestions([]);
    }
  };

  // Returnerer riktig værikon basert på værforhold
  const getWeatherIcon = () => {
    if (!weatherData) return null;

    const weatherDetails = weatherData.properties.timeseries[0].data.next_1_hours?.summary?.symbol_code || '';

    if (weatherDetails.includes('clear')) return clear_icon;
    if (weatherDetails.includes('cloud')) return cloud_icon;
    if (weatherDetails.includes('drizzle')) return drizzle_icon;
    if (weatherDetails.includes('rain')) return rain_icon;
    if (weatherDetails.includes('snow')) return snow_icon;

    return clear_icon;
  };

  return (
    <div className="weather">
      <div className="search-bar">
        <input
          type="text"
          placeholder='Søk etter by'
          value={searchInput}
          onChange={handleInputChange}
          onKeyDown={handleSearchKeyPress}
        />
        <img
          src={search_icon}
          alt="Søk"
          onClick={handleSearch}
          className="search-icon"
        />
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((city, index) => (
              <li
                key={index}
                className={activeSuggestionIndex === index ? 'active' : ''}
                onClick={() => {
                  setSearchInput(city);
                  fetchCoordinates(city);
                  setSuggestions([]);
                }}
              >
                {city}
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading ? (
        <p>Laster...</p>
      ) : weatherData ? (
        <>
          <p className='temperature'>
            {weatherData.properties.timeseries[0].data.instant.details.air_temperature}°C
          </p>
          <p className='location'>{location}</p>
          <img className='weather-icon' src={getWeatherIcon()} alt="Vær ikon" />
          <div className="weather-data">
            <div className="col">
              <img src={rain_icon} alt="Regn" />
              <div>
                <p>{weatherData.properties.timeseries[0].data.next_1_hours?.details?.precipitation_amount} mm</p>
              </div>
            </div>
            <div className="col">
              <img src={wind_icon} alt="Vindhastighet" />
              <div>
                <p>{weatherData.properties.timeseries[0].data.instant.details.wind_speed} m/s</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p>Ingen værdata tilgjengelig.</p>
      )}
    </div>
  );
}
