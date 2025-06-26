// models/adherent.model.js
module.exports = (sequelize, DataTypes) => {
  const Adherent = sequelize.define('Adherent', {
        id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
        },
        nom: {
        type: DataTypes.STRING,
        allowNull: false
        },
        prenom: {
        type: DataTypes.STRING,
        allowNull: false
        },
        email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
        },
        telephone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
        },
        date_inscription: {
        type: DataTypes.DATEONLY,
        unique: false,
        allowNull: false
        },
        dojoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'dojoId'
        },
        categorie_age : {
        type: DataTypes.STRING,
        unique: false,
        allowNull: false
        },
    }, 
    {
        tableName: 'Adherent',
        timestamps: false,
        underscored: true,
        charset: 'latin1',
        collate: 'latin1_swedish_ci'
    }
);

  Adherent.associate = (models) => {
    Adherent.belongsTo(models.Dojo, { foreignKey: 'dojoId' });
    Adherent.hasMany(models.Appel, { foreignKey: 'adherentId' });
    Adherent.belongsToMany(models.Cours, {
  through: 'CoursAdherent',
  foreignKey: 'adherentId',
  otherKey: 'coursId'
});
  };

  return Adherent;
};
