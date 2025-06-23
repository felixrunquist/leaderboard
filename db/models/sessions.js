import bcrypt from 'bcryptjs'

export default function sessions(sequelize, DataTypes) {
    const sessions = sequelize.define('sessions', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        suiteId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'suites', // this should match the table name or model name for Suite
                key: 'id',
            },
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'users', // Table name
                key: 'username',
            },
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        commitId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });
    sessions.associate = function (models) {
        // associations can be defined here
        sessions.belongsTo(models.suites, {
            foreignKey: 'suiteId',
            as: 'suites',
        });

        sessions.belongsTo(models.users, {
            foreignKey: 'user',
            targetKey: 'username', // 👈 important: points to a non-primary column
            as: 'userDetails',
        });
    };
    return sessions;
};