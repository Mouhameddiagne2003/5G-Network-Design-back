const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const authRoutes = require('./services/auth/routes');
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(cookieParser());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);

app.get("/", (req, res) => {
  res.send("Serveur backend 5G Network Designer opérationnel !");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port:   ${PORT}`);
});
