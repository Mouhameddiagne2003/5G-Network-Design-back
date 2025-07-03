const express = require("express");
const router = express.Router();
const prisma = require("../../config/prismaClient");

// 🔹 Ajouter un site
router.post("/create", async (req, res) => {
  try {
    const { name, latitude, longitude, radiusKm, projectId } = req.body;

    if (!name || !latitude || !longitude || !radiusKm || !projectId) {
      return res.status(400).json({ error: "Champs manquants" });
    }

    const site = await prisma.site.create({
      data: {
        name,
        latitude,
        longitude,
        radiusKm,
        projectId: parseInt(projectId),
      },
    });

    res.json({ message: "✅ Site ajouté avec succès", site });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Récupérer tous les sites d’un projet
router.get("/by-project/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const sites = await prisma.site.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: "asc" }
    });

    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Supprimer un site
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.site.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "🗑️ Site supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Génère les sites après le dimensionnement
router.post("/generate/:projectId", async (req, res) => {
  const { projectId } = req.params;

  try {
    const sites = await generateSites(projectId);
    res.json({ message: "✅ Sites générés avec succès", sites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
