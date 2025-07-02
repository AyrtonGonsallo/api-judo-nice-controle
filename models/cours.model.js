// models/Cours.model.js
module.exports = (sequelize, DataTypes) => {
  const Cours = sequelize.define('Cours', {
        id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
        },
        jour: {
        type: DataTypes.STRING,
        allowNull: false
        },
        heure: {
        type: DataTypes.TIME,
        unique: true,
        allowNull: false
        },
        categorie_age : {
        type: DataTypes.STRING,
        unique: false,
        allowNull: false
        },
        dojoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'dojoId'
        },
        jour_num: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'jour_num'
        }
    }, 
    {
        tableName: 'Cours',
        timestamps: false,
        underscored: true,
        charset: 'latin1',
        collate: 'latin1_swedish_ci'
    }
);

  Cours.associate = (models) => {
    Cours.belongsTo(models.Dojo, { foreignKey: 'dojoId' });
    Cours.hasMany(models.Appel, { foreignKey: 'coursId' });
    Cours.belongsToMany(models.Utilisateur, {
    through: 'CoursProf',
    foreignKey: 'coursId',
    otherKey: 'utilisateurId'
  });
  Cours.belongsToMany(models.Adherent, {
  through: 'CoursAdherent',
  foreignKey: 'coursId',
  otherKey: 'adherentId'
});
  };

 

  return Cours;
};
