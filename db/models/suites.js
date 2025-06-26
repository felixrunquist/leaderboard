export default function suites(sequelize, DataTypes) {
    const suites = sequelize.define('suites',{
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        rankAlgorithm: {
            type: DataTypes.STRING,
            defaultValue: 'avg',
            allowNull: true,
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });
    suites.associate = function (models) {
        suites.belongsToMany(models.testcases, {through: 'Testcases_Suites', foreignKey: 'suiteId', onDelete: 'CASCADE'})
        suites.belongsToMany(models.users, {through: 'Users_Suites', foreignKey: 'suiteId', onDelete: 'CASCADE'})
    };
    return suites;
};