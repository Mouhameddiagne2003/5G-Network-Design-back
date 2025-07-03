const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const authRoutes = require("./services/auth/routes");
const projectRoutes = require("./services/projects/routes");
const resultRoutes = require("./services/results/routes");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(cookieParser());
app.use(bodyParser.json());

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/sites", require("./services/sites/routes"));


app.use(cors({
  origin: ['http://localhost:3000'], // Spécifiez l'origine exacte
  credentials: true, // Permet les cookies/tokens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get("/", (req, res) => {
  res.send("Serveur backend 5G Network Designer opérationnel !");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port:   ${PORT}`);
});
