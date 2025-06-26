module.exports = (sequelize, DataTypes) => {
  const CoursAdherent = sequelize.define('CoursAdherent', {
    coursId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Cours',
        key: 'id'
      }
    },
    adherentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Adherent',
        key: 'id'
      }
    }
  }, {
    tableName: 'CoursAdherent',
    timestamps: false
  });

  return CoursAdherent;
};