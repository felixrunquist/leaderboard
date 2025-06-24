export default function scores(sequelize, DataTypes) {
    const scores = sequelize.define('scores',{
        sessionId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'sessions',
                key: 'id',
            },
            allowNull: false,
        },
        testCaseId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'testcases',
                key: 'id',
            },
            allowNull: false,
        },
        score: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
    });
    scores.associate = function (models) {
        // associations can be defined here
        scores.belongsTo(models.sessions, {
            foreignKey: 'sessionId',
            as: 'session',
        });

        scores.belongsTo(models.testcases, {
            foreignKey: 'testCaseId',
            as: 'testcase',
        });
    };
    return scores;
};