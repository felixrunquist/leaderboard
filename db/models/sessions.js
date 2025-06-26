export default function sessions(sequelize, DataTypes) {
    const sessions = sequelize.define('sessions', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true
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
        totalScore: {
            type: DataTypes.FLOAT,
            allowNull: true
        }
    });
    sessions.associate = function (models) {
        // associations can be defined here
        sessions.belongsTo(models.suites, {
            foreignKey: 'suiteId',
            as: 'suite',
            onDelete: 'CASCADE',
        });

        sessions.belongsTo(models.users, {
            foreignKey: 'user',
            targetKey: 'username', // important: points to a non-primary column
            as: 'userDetails',
        });

        sessions.hasMany(models.scores, {
            foreignKey: 'sessionId',
            as: 'scores',
        });

        // Add hook to update suite.updated after session creation
        sessions.addHook('afterCreate', async (session, options) => {
            const { suiteId, date } = session;

            if (!suiteId || !date) return;

            await models.suites.update(
                { updated: date },
                { where: { id: suiteId }, transaction: options.transaction }
            );
        });
    };
    return sessions;
};