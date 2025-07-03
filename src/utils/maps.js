const axios = require("axios");

// Appelle l'API Google Maps pour récupérer un nom de lieu
async function getLocationNameFromCoords(lat, lng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // stockée dans .env
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

  try {
    const res = await axios.get(url);
    const results = res.data.results;

    if (results.length > 0) {
      const location = results[0];
      return `Site - ${location.formatted_address}`;
    } else {
      return "Site sans nom";
    }
  } catch (err) {
    console.error("Erreur reverse geocoding :", err.message);
    return "Site inconnu";
  }
}

module.exports = { getLocationNameFromCoords };
