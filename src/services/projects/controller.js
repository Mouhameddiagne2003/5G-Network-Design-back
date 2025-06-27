const express = require("express");
const router = express.Router();
const { validationResult } = require("express-validator");
const prisma = require("../../config/prismaClient");
const { projectValidationRules } = require("./validation");

// 🔸 Créer un projet
router.post("/", projectValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  console.log(req.user);

  try {
    const data = {
      ...req.body,
      userId: req.user.id,
    };

    const project = await prisma.project.create({ data });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔸 Lister tous les projets de l'utilisateur
router.get("/", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔸 Voir un projet
router.get("/:id", async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!project || project.userId !== req.user.id) {
      return res.status(404).json({ error: "Projet introuvable" });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔸 Modifier un projet
router.put("/:id", projectValidationRules, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  try {
    const updated = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔸 Supprimer un projet
router.delete("/:id", async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: "Projet supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
