const prisma = require("../../config/prismaClient");
const { getLocationNameFromCoords } = require("../../utils/maps");

// Utilitaire : conversion angle → radian
const toRadians = (deg) => (deg * Math.PI) / 180;
const toDegrees = (rad) => (rad * 180) / Math.PI;

/**
 * Génère des positions autour d’un point central (lat, lng)
 * à une distance donnée (en km) et un angle donné
 */
function generateLatLngAround(lat, lng, radiusKm, angleDegrees) {
  const R = 6371; // rayon de la Terre en km
  const angleRad = toRadians(angleDegrees);

  const deltaLat = (radiusKm / R) * Math.cos(angleRad);
  const deltaLng = (radiusKm / R) * Math.sin(angleRad) / Math.cos(toRadians(lat));

  return {
    lat: lat + toDegrees(deltaLat),
    lng: lng + toDegrees(deltaLng)
  };
}

/**
 * Génère automatiquement les sites gNodeB autour d’un projet
 */
async function generateSites(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: parseInt(projectId) }
  });

  if (!project || !project.latitude || !project.longitude) {
    throw new Error("Latitude et longitude du projet nécessaires");
  }

  const resultCoverage = await prisma.result.findFirst({
    where: {
      projectId: project.id,
      type: "COVERAGE"
    }
  });

  const resultGnodeb = await prisma.result.findFirst({
    where: {
      projectId: project.id,
      type: "GNODEB"
    }
  });

  if (!resultCoverage || !resultGnodeb) {
    throw new Error("Résultats de couverture et dimensionnement requis");
  }

  const rayonKm = resultCoverage.report.d_km;
  const nombreSites = resultGnodeb.report.gnodebRecommande;
  const { latitude, longitude } = project;

  const sites = [];

  for (let i = 0; i < nombreSites; i++) {
    const angle = (360 / nombreSites) * i;
    const { lat, lng } = generateLatLngAround(latitude, longitude, rayonKm, angle);

    const siteName = await getLocationNameFromCoords(lat, lng);

    const site = await prisma.site.create({
      data: {
        name: siteName,
        latitude: lat,
        longitude: lng,
        radiusKm: rayonKm,
        projectId: project.id
      }
    });

    sites.push(site);
  }

  return sites;
}

module.exports = { generateSites };
