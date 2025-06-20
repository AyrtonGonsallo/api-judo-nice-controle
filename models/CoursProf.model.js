module.exports = (sequelize, DataTypes) => {
  const CoursProf = sequelize.define('CoursProf', {
    coursId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cours',
        key: 'id'
      }
    },
    utilisateurId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Utilisateur',
        key: 'id'
      }
    }
  }, {
    tableName: 'CoursProf',
    timestamps: false
  });

  return CoursProf;
};