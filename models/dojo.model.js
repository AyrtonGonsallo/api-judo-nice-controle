// models/dojo.model.js
module.exports = (sequelize, DataTypes) => {
  const Dojo = sequelize.define('Dojo', {
        id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
        },
        nom: {
        type: DataTypes.STRING,
        allowNull: false
        }
    }, 
    {
        tableName: 'Dojo',
        timestamps: false,
        underscored: true,
        charset: 'latin1',
        collate: 'latin1_swedish_ci'
    }
);

  Dojo.associate = (models) => {
  Dojo.hasMany(models.Cours, { foreignKey: 'dojoId' });
  Dojo.hasMany(models.Utilisateur, { foreignKey: 'dojoId' });
};

  return Dojo;
};
