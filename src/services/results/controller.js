const prisma = require("../../config/prismaClient");
const router = require("express").Router();

// Middleware pour loguer toutes les requêtes
router.use((req, res, next) => {
  console.log("Requête reçue:", {
    method: req.method,
    url: req.url,
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
  next();
});

// Endpoint pour calculer la couverture
router.post("/calculate-coverage/:projectId", async (req, res) => {
  console.log("=== DÉBUT CALCUL COVERAGE ===");
  const { projectId } = req.params;
  const { gainAntenne, pertesSysteme, receiverSensitivity } = req.body;

  // Validation des paramètres
  if (
    gainAntenne == null ||
    pertesSysteme == null ||
    receiverSensitivity == null ||
    isNaN(gainAntenne) ||
    isNaN(pertesSysteme) ||
    isNaN(receiverSensitivity)
  ) {
    console.log("Paramètres invalides pour calculate-coverage:", req.body);
    return res.status(400).json({ error: "gainAntenne, pertesSysteme et receiverSensitivity doivent être des nombres valides." });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      console.log("Projet non trouvé pour ID:", projectId);
      return res.status(404).json({ error: "Projet introuvable" });
    }

    const { frequency, zoneType, power, antennaHeight, userHeight } = project;

    // Validation des paramètres du projet
    if (
      !frequency ||
      !zoneType ||
      !power ||
      !antennaHeight ||
      !userHeight ||
      isNaN(frequency) ||
      isNaN(power) ||
      isNaN(antennaHeight) ||
      isNaN(userHeight)
    ) {
      console.log("Paramètres du projet invalides:", project);
      return res.status(400).json({ error: "Les paramètres du projet doivent être valides." });
    }

    // Calcul de la portée avec COST-231
    const f = frequency * 1000; // MHz
    const hb = antennaHeight;
    const hm = userHeight;
    const Cm = zoneType === "URBAIN" ? 3 : 0;
    const ahm = 3.2 * Math.pow(Math.log10(11.75 * hm), 2) - 4.97;

    const Lmax = power - receiverSensitivity;
    const logD =
      (Lmax - 46.3 - 33.9 * Math.log10(f) + 13.82 * Math.log10(hb) - ahm - Cm) /
      (44.9 - 6.55 * Math.log10(hb));

    if (logD <= 0 || isNaN(logD)) {
      console.log("logD invalide:", logD);
      return res.status(400).json({ error: "Paramètres invalides pour le calcul de la portée." });
    }

    const d = Math.pow(10, logD); // km
    const coveragePerNode = Math.PI * d * d;

    const L =
      46.3 +
      33.9 * Math.log10(f) -
      13.82 * Math.log10(hb) -
      ahm +
      (44.9 - 6.55 * Math.log10(hb)) * Math.log10(d) +
      Cm;

    if (isNaN(L)) {
      console.log("Perte de propagation (L) invalide:", L);
      return res.status(400).json({ error: "Erreur dans le calcul de la perte de propagation." });
    }

    const linkBudget = power + gainAntenne - pertesSysteme - L - receiverSensitivity;

    // Vérifier si un enregistrement existe
    const existingResult = await prisma.result.findFirst({
      where: { projectId: project.id, type: "COVERAGE" },
    });

    console.log("Avant opération pour COVERAGE:", { projectId, existingResult });

    let result;
    if (existingResult) {
      // Mise à jour
      result = await prisma.result.update({
        where: { projectId_type: { projectId: project.id, type: "COVERAGE" } },
        data: {
          coverage: coveragePerNode,
          report: {
            d_km: d,
            coverage_km2: coveragePerNode,
            pertePropagation_dB: L,
            budgetLiaison_dB: linkBudget,
            margeFading_dB: receiverSensitivity,
            gainAntenne_dBi: gainAntenne,
            pertesSysteme_dB: pertesSysteme,
            Lmax_dB: Lmax,
            a_hm: ahm,
          },
        },
      });
    } else {
      // Création
      result = await prisma.result.create({
        data: {
          projectId: project.id,
          type: "COVERAGE",
          coverage: coveragePerNode,
          report: {
            d_km: d,
            coverage_km2: coveragePerNode,
            pertePropagation_dB: L,
            budgetLiaison_dB: linkBudget,
            margeFading_dB: receiverSensitivity,
            gainAntenne_dBi: gainAntenne,
            pertesSysteme_dB: pertesSysteme,
            Lmax_dB: Lmax,
            a_hm: ahm,
          },
        },
      });
    }

    console.log("Après opération pour COVERAGE:", result);
    console.log("=== FIN CALCUL COVERAGE ===");
    res.json({
      message: "✅ Couverture calculée avec succès",
      result,
    });
  } catch (err) {
    console.error("Erreur dans calculateCoverage:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint pour calculer la capacité
router.post("/calculate-capacity/:projectId", async (req, res) => {
  console.log("=== DÉBUT CALCUL CAPACITY ===");
  const { projectId } = req.params;
  const { SNR, modulation, debitParUtilisateur } = req.body;

  // Validation des paramètres
  if (
    SNR == null ||
    modulation == null ||
    debitParUtilisateur == null ||
    isNaN(SNR) ||
    isNaN(debitParUtilisateur)
  ) {
    console.log("Paramètres invalides pour calculate-capacity:", req.body);
    return res.status(400).json({ error: "SNR, modulation et debitParUtilisateur doivent être valides." });
  }

  // Validation de la modulation
  const modulationEff = {
    QPSK: 2,
    "16QAM": 4,
    "64QAM": 6,
    "256QAM": 8,
    "1024QAM": 10,
  };
  const eta = modulationEff[modulation] || 6; // Défaut à 64QAM
  if (!modulationEff[modulation]) {
    console.log("Modulation invalide:", modulation);
    return res.status(400).json({ error: "Modulation non supportée." });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      console.log("Projet non trouvé pour ID:", projectId);
      return res.status(404).json({ error: "Projet introuvable" });
    }

    const { bandwidth, area, userDensity } = project;

    // Validation des paramètres du projet
    if (!bandwidth || !area || !userDensity || isNaN(bandwidth) || isNaN(area) || isNaN(userDensity)) {
      console.log("Paramètres du projet invalides:", project);
      return res.status(400).json({ error: "Les paramètres du projet doivent être valides." });
    }

    const B = bandwidth * 1e6; // Hz
    const totalUsers = area * userDensity;

    // Capacité théorique (Shannon)
    const capacityTheorique_bps = B * Math.log2(1 + SNR) * eta;
    const capacityTheorique_Mbps = capacityTheorique_bps / 1e6;

    // Capacité pratique (rendement estimé à 70%)
    const rendement = 0.7;
    const capacityPratique_Mbps = capacityTheorique_Mbps * rendement;

    // Débit total requis
    const debitTotal_Mbps = totalUsers * debitParUtilisateur;

    // Nombre max d'utilisateurs
    const maxUsers = Math.floor(capacityPratique_Mbps / debitParUtilisateur);

    // Efficacité
    const efficacite = (capacityPratique_Mbps / capacityTheorique_Mbps) * 100;

    // Vérifier si un enregistrement existe
    const existingResult = await prisma.result.findFirst({
      where: { projectId: project.id, type: "CAPACITY" },
    });

    console.log("Avant opération pour CAPACITY:", { projectId, existingResult });

    let result;
    if (existingResult) {
      // Mise à jour
      result = await prisma.result.update({
        where: { projectId_type: { projectId: project.id, type: "CAPACITY" } },
        data: {
          capacity: capacityPratique_Mbps,
          report: {
            modulation,
            eta,
            SNR,
            bandwidth_MHz: bandwidth,
            capacityTheorique_Mbps,
            capacityPratique_Mbps,
            debitParUtilisateur_Mbps: debitParUtilisateur,
            debitTotal_Mbps,
            utilisateursMax: maxUsers,
            efficacite: efficacite.toFixed(2),
          },
        },
      });
    } else {
      // Création
      result = await prisma.result.create({
        data: {
          projectId: project.id,
          type: "CAPACITY",
          capacity: capacityPratique_Mbps,
          report: {
            modulation,
            eta,
            SNR,
            bandwidth_MHz: bandwidth,
            capacityTheorique_Mbps,
            capacityPratique_Mbps,
            debitParUtilisateur_Mbps: debitParUtilisateur,
            debitTotal_Mbps,
            utilisateursMax: maxUsers,
            efficacite: efficacite.toFixed(2),
          },
        },
      });
    }

    console.log("Après opération pour CAPACITY:", result);
    console.log("=== FIN CALCUL CAPACITY ===");
    res.json({
      message: "✅ Capacité calculée avec succès",
      result,
    });
  } catch (err) {
    console.error("Erreur dans calculateCapacity:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint pour calculer le dimensionnement
router.post("/calculate-dimensionnement/:projectId", async (req, res) => {
  console.log("=== DÉBUT CALCUL DIMENSIONNEMENT ===");
  const { projectId } = req.params;
  const { coutParGnodeb, devise } = req.body;

  // Validation des paramètres
  if (coutParGnodeb == null || !devise || isNaN(coutParGnodeb)) {
    console.log("Paramètres invalides pour calculate-dimensionnement:", req.body);
    return res.status(400).json({ error: "coutParGnodeb et devise doivent être valides." });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      console.log("Projet non trouvé pour ID:", projectId);
      return res.status(404).json({ error: "Projet introuvable" });
    }

    const resultCouverture = await prisma.result.findFirst({
      where: { projectId: project.id, type: "COVERAGE" },
    });

    const resultCapacite = await prisma.result.findFirst({
      where: { projectId: project.id, type: "CAPACITY" },
    });

    if (!resultCouverture || !resultCapacite) {
      console.log("Résultats manquants:", { resultCouverture, resultCapacite });
      return res.status(400).json({
        error: "Les calculs de couverture et de capacité doivent être effectués en premier.",
      });
    }

    // Validation des données de couverture et capacité
    if (
      !resultCouverture.report.coverage_km2 ||
      !resultCapacite.report.utilisateursMax ||
      isNaN(resultCouverture.report.coverage_km2) ||
      isNaN(resultCapacite.report.utilisateursMax)
    ) {
      console.log("Données de couverture ou capacité invalides:", {
        coverage_km2: resultCouverture.report.coverage_km2,
        utilisateursMax: resultCapacite.report.utilisateursMax,
      });
      return res.status(400).json({ error: "Données de couverture ou capacité invalides." });
    }

    const area = project.area;
    const totalUsers = project.area * project.userDensity;
    const coverage_km2 = resultCouverture.report.coverage_km2;
    const usersSupported = resultCapacite.report.utilisateursMax;

    const gnodebCouverture = Math.ceil(area / coverage_km2);
    const gnodebCapacite = Math.ceil(totalUsers / usersSupported);
    const gnodebFinal = Math.max(gnodebCouverture, gnodebCapacite);

    const efficaciteCouverture = ((gnodebCouverture / gnodebFinal) * 100).toFixed(1);
    const coutEstime = gnodebFinal * coutParGnodeb;

    // Vérifier si un enregistrement existe
    const existingResult = await prisma.result.findFirst({
      where: { projectId: project.id, type: "GNODEB" },
    });

    console.log("Avant opération pour GNODEB:", { projectId, existingResult });

    let result;
    if (existingResult) {
      // Mise à jour
      result = await prisma.result.update({
        where: { projectId_type: { projectId: project.id, type: "GNODEB" } },
        data: {
          gnodebCount: gnodebFinal,
          report: {
            surface_km2: area,
            userDensity: project.userDensity,
            totalUsers,
            gnodebParCouverture: gnodebCouverture,
            gnodebParCapacite: gnodebCapacite,
            gnodebRecommande: gnodebFinal,
            efficaciteCouverture: efficaciteCouverture + "%",
            coutParGnodeb,
            devise,
            coutEstime: `${coutEstime.toLocaleString()} ${devise}`,
          },
        },
      });
    } else {
      // Création
      result = await prisma.result.create({
        data: {
          projectId: project.id,
          type: "GNODEB",
          gnodebCount: gnodebFinal,
          report: {
            surface_km2: area,
            userDensity: project.userDensity,
            totalUsers,
            gnodebParCouverture: gnodebCouverture,
            gnodebParCapacite: gnodebCapacite,
            gnodebRecommande: gnodebFinal,
            efficaciteCouverture: efficaciteCouverture + "%",
            coutParGnodeb,
            devise,
            coutEstime: `${coutEstime.toLocaleString()} ${devise}`,
          },
        },
      });
    }

    console.log("Après opération pour GNODEB:", result);
    console.log("=== FIN CALCUL DIMENSIONNEMENT ===");
    res.json({
      message: "✅ Dimensionnement calculé avec succès",
      result,
    });
  } catch (err) {
    console.error("Erreur dans calculateDimensionnement:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;