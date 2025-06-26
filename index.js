// index.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth.routes');
const dojos_coursRoutes = require('./routes/dojo_cours.routes');
const professeursRoutes = require('./routes/professeurs.routes');
const adherents_appelsRoutes = require('./routes/adherent_appel.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res_string="Bienvenue sur l’API de Contrôle de Présences ! <br>"
    res_string+="http://localhost:3000/api/auth/init <br>"
    res_string+="http://localhost:3000/api/auth/utilisateurs <br>"
    res_string+="http://localhost:3000/ <br>"
  res.send(res_string);

});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dojo_cours', dojos_coursRoutes);
app.use('/api/professeurs', professeursRoutes);
app.use('/api/adherents', adherents_appelsRoutes);

// Connexion à la base et sync
db.sequelize.sync().then(() => {
  console.log('Base de données synchronisée');
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Erreur lors de la synchronisation avec la base de données :', err);
});
