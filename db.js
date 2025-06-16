// db.js
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('mala4322_judo_nice_controle', 'mala4322_judo_nice_controle', 'z.il9cFQG-#u', {
  host: '109.234.165.210',
  dialect: 'mysql'
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importer les modèles
db.Utilisateur = require('./models/utilisateur.model')(sequelize, DataTypes);
db.Role = require('./models/role.model')(sequelize, DataTypes);

// Associer les relations
Object.keys(db).forEach(model => {
  if (db[model].associate) db[model].associate(db);
});

module.exports = db;
