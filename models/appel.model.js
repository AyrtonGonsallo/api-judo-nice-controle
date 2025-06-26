// models/adherent.model.js
module.exports = (sequelize, DataTypes) => {
  const Appel = sequelize.define('Appel', {
        id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
        },
        status: {
        type: DataTypes.BOOLEAN,// true present, false absent
        unique: false,
        allowNull: false
        },
        date: {
        type: DataTypes.DATEONLY,
        unique: false,
        allowNull: false
        },
        adherentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'adherentId'
        },
        coursId : {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'coursId'
        },
    }, 
    {
        tableName: 'Appel',
        timestamps: false,
        underscored: true,
        charset: 'latin1',
        collate: 'latin1_swedish_ci',
        indexes: [
      {
        unique: true,
        fields: ['adherentId', 'coursId', 'date']  // empêche la duplication d’un appel par jour, cours et adhérent
      }
    ]
    }
);

  Appel.associate = (models) => {
    Appel.belongsTo(models.Adherent, { foreignKey: 'adherentId' });
    Appel.belongsTo(models.Cours, { foreignKey: 'coursId' });
  };

  return Appel;
};
