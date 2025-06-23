import bcrypt from 'bcryptjs'

export default function suites(sequelize, DataTypes) {
    const testcases = sequelize.define('suites',{
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
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    });
    return testcases;
};