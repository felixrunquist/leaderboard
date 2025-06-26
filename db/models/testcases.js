export default function testcases(sequelize, DataTypes) {
    const testcases = sequelize.define('testcases',{
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
        runCommand: {
            type: DataTypes.STRING,
            allowNull: true
        },
        testData: {
            type: DataTypes.STRING,
            allowNull: true
        },
        weight: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        }
    });
    testcases.associate = function (models) {
        testcases.belongsToMany(models.suites, {through: 'Testcases_Suites', foreignKey: 'testCaseId', onDelete: 'CASCADE'})
    };
    return testcases;
};