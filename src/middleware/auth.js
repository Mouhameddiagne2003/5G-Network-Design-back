const jwt = require("jsonwebtoken");
const { errorHandler } = require("../utils/errorHandler");
const prisma = require("../config/prismaClient"); // Ajout de Prisma

const SECRET_KEY = process.env.JWT_SECRET || "secret_jwt_key";

// 📌 Vérifier le token JWT et l'utilisateur en base
const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) return next(errorHandler(401, "Accès non autorisé"));

    const decoded = jwt.verify(token, SECRET_KEY);

    // Optionnel : vérifier que l'utilisateur existe toujours en base
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    req.user = decoded; // ou req.user = user pour avoir toutes les infos
    next();
  } catch (error) {
    next(errorHandler(403, "Token invalide"));
  }
};

module.exports = { verifyToken };
