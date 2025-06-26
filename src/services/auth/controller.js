const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const prisma = require("../../config/prismaClient");
const { errorHandler } = require("../../utils/errorHandler");

const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(errorHandler(400, "Erreur de validation", errors.array()));
  }

  const { username, email, password } = req.body;

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return next(errorHandler(400, "Cet email est déjà utilisé"));
    }
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });

    res.status(201).json({ message: "Utilisateur créé avec succès" });
  } catch (error) {
    console.error(error);
    next(errorHandler(500, "Erreur serveur"));
  }
};

const login = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      errorHandler(400, "Veuillez vérifier vos informations de connexion")
    );
  }
  const { email, password } = req.body;

  try {
    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return next(errorHandler(401, "Identifiants invalides"));
    }
    // Vérification du mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return next(errorHandler(401, "Identifiants invalides"));
    }

    // Génération du token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const age = 1000 * 60 * 60 * 24 * 7; // 7 jours

    res
      .cookie("access_token", token, {
        httpOnly: true,
        maxAge: age,
        sameSite: "none",
        secure: true,
      })
      .status(200)
      .json({
        message: "Connexion réussie",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
        token,
      });
  } catch (error) {
    console.error(error);
    next(errorHandler(500, "Erreur lors de la tentative de connexion"));
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie("access_token", {
      httpOnly: true,
      path: "/",
    });
    res.status(200).json("User has been logged out!");
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getCurrentUser };
