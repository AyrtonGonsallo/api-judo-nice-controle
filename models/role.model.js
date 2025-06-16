// models/role.model.js
module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
        id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
        },
        titre: {
        type: DataTypes.STRING,
        allowNull: false
        }
    }, 
    {
        tableName: 'Role',
        timestamps: false,
        underscored: true,
        charset: 'latin1',
        collate: 'latin1_swedish_ci'
    }
);

  Role.associate = (models) => {
    Role.hasMany(models.Utilisateur, { foreignKey: 'roleId' });
  };

  return Role;
};
