const { body } = require("express-validator");

exports.projectValidationRules = [
  body("name").notEmpty().withMessage("Le nom est requis"),
  body("description").optional().isString(),

  body("area")
    .isFloat({ gt: 0 })
    .withMessage("Surface invalide (doit être > 0)"),

  body("userDensity")
    .isInt({ gt: 0 })
    .withMessage("Densité invalide (doit être un entier positif)"),

  body("frequency")
    .isFloat()
    .withMessage("La fréquence doit être un nombre décimal"),

  body("bandwidth")
    .isInt({ gt: 0 })
    .withMessage("La bande passante doit être un entier positif"),

  body("zoneType")
    .isIn(["URBAIN", "PERI_URBAIN", "RURAL"])
    .withMessage("zoneType doit être URBAIN, PERI_URBAIN ou RURAL"),

  body("services")
    .isArray({ min: 1 })
    .withMessage("Au moins un service est requis"),
  body("services.*")
    .isIn(["EMBB", "URLLC", "MMTC"])
    .withMessage("Services possibles : EMBB, URLLC, MMTC"),

  body("power")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Puissance invalide"),

  body("antennaHeight")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Hauteur antenne invalide"),

  body("userHeight")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Hauteur utilisateur invalide"),
];
