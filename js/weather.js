// Météo via Open-Meteo (gratuit, sans clé API).
// Stratégie : géolocalisation navigateur -> sinon ville définie dans les paramètres -> sinon ville par défaut.

const DEFAULT_CITY = "Paris";
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

function mapWeatherCode(code) {
  const map = {
    0: { label: "Ciel dégagé", icon: "sun" },
    1: { label: "Plutôt dégagé", icon: "sun-cloud" },
    2: { label: "Partiellement nuageux", icon: "sun-cloud" },
    3: { label: "Couvert", icon: "cloud" },
    45: { label: "Brouillard", icon: "fog" },
    48: { label: "Brouillard givrant", icon: "fog" },
    51: { label: "Bruine légère", icon: "rain" },
    53: { label: "Bruine", icon: "rain" },
    55: { label: "Bruine forte", icon: "rain" },
    56: { label: "Bruine verglaçante", icon: "rain" },
    57: { label: "Bruine verglaçante forte", icon: "rain" },
    61: { label: "Pluie légère", icon: "rain" },
    63: { label: "Pluie", icon: "rain" },
    65: { label: "Pluie forte", icon: "rain" },
    66: { label: "Pluie verglaçante", icon: "rain" },
    67: { label: "Pluie verglaçante forte", icon: "rain" },
    71: { label: "Neige légère", icon: "snow" },
    73: { label: "Neige", icon: "snow" },
    75: { label: "Neige forte", icon: "snow" },
    77: { label: "Neige en grains", icon: "snow" },
    80: { label: "Averses légères", icon: "rain" },
    81: { label: "Averses", icon: "rain" },
    82: { label: "Averses violentes", icon: "rain" },
    85: { label: "Averses de neige", icon: "snow" },
    86: { label: "Averses de neige fortes", icon: "snow" },
    95: { label: "Orage", icon: "storm" },
    96: { label: "Orage avec grêle", icon: "storm" },
    99: { label: "Orage violent avec grêle", icon: "storm" },
  };
  return map[code] || { label: "Météo indisponible", icon: "cloud" };
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Géolocalisation non supportée"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=fr&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Géocodage impossible");
  const data = await res.json();
  const result = data?.results?.[0];
  if (!result) throw new Error("Ville introuvable");
  return { lat: result.latitude, lon: result.longitude, name: result.name };
}

async function fetchForecast(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Prévisions indisponibles");
  const data = await res.json();
  const current = data?.current;
  if (!current) throw new Error("Données météo invalides");
  const { label, icon } = mapWeatherCode(current.weather_code);
  return {
    temperature: Math.round(current.temperature_2m),
    label,
    icon,
    fetchedAt: Date.now(),
  };
}

/**
 * Récupère la météo actuelle.
 * @param {{city?: string, weatherEnabled: boolean, lastWeather?: object|null}} settings
 * @returns {Promise<{temperature:number,label:string,icon:string,fetchedAt:number}|{error:string}>}
 */
async function resolveWeather(settings) {
  let coords;
  try {
    coords = await getCurrentPosition();
  } catch {
    const city = settings.city?.trim() || DEFAULT_CITY;
    coords = await geocodeCity(city);
  }
  return await fetchForecast(coords.lat, coords.lon);
}

// Filet de sécurité : quoi qu'il arrive (permission jamais tranchée, réseau lent…)
// l'appelant reçoit une réponse sous 10s pour ne jamais rester bloqué sur "Chargement…".
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve({ error: "timeout" }), ms)),
  ]);
}

export async function getWeather(settings) {
  if (!settings.weatherEnabled) {
    return { error: "disabled" };
  }
  if (settings.lastWeather && Date.now() - settings.lastWeather.fetchedAt < CACHE_TTL_MS) {
    return settings.lastWeather;
  }
  try {
    return await withTimeout(resolveWeather(settings), 10000);
  } catch (e) {
    return { error: e.message || "unavailable" };
  }
}
