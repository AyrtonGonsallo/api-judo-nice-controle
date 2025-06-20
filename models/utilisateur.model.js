// models/Utilisateur.model.js
module.exports = (sequelize, DataTypes) => {
  const Utilisateur = sequelize.define('Utilisateur', {
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
        password: {
        type: DataTypes.STRING,
        allowNull: false
        },
        roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'roleId'
        },
        dojoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'dojoId'
        }
    }, 
    {
        tableName: 'Utilisateur',
        timestamps: false,
        underscored: true,
        charset: 'latin1',
        collate: 'latin1_swedish_ci'
    }
);

  Utilisateur.associate = (models) => {
    Utilisateur.belongsTo(models.Role, { foreignKey: 'roleId' });
    Utilisateur.belongsTo(models.Dojo, { foreignKey: 'dojoId' });
    Utilisateur.belongsToMany(models.Cours, {
    through: 'CoursProf',
    foreignKey: 'utilisateurId',
    otherKey: 'coursId'
  });
  };



  return Utilisateur;
};
