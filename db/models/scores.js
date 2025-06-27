import { calculateSessionScore } from "../../lib/db-helper.js";

export default function scores(sequelize, DataTypes) {
    const scores = sequelize.define('scores', {
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

    // Hook to recalculate session score after create/update/delete
    async function updateSessionTotalScore(scoreInstance, options, models) {
        const { sessionId } = scoreInstance;

        const session = await models.sessions.findByPk(sessionId, {
            include: [
                {
                    model: models.scores,
                    as: 'scores',
                    include: [{
                        model: models.testcases,
                        as: 'testcase',
                        attributes: ['weight']
                    }]
                },
                {
                    model: models.suites,
                    as: 'suite',
                    attributes: ['rankAlgorithm']
                }
            ]
        });

        if (!session) return;

        // Inject testCaseWeight into scores before calculating
        const enrichedSession = {
            ...session.toJSON(),
            scores: session.scores.map(score => ({
                ...score.toJSON(),
                testCaseWeight: score.testcase?.weight || 1
            }))
        };

        const totalScore = calculateSessionScore(enrichedSession);
        console.log('Total score for ' + session.name, totalScore);

        session.totalScore = totalScore;
        await session.save({ transaction: options.transaction });
    }

    scores.associate = function (models) {
        // associations can be defined here
        scores.belongsTo(models.sessions, {
            foreignKey: 'sessionId',
            as: 'session',
            onDelete: 'CASCADE',
        });

        scores.belongsTo(models.testcases, {
            foreignKey: 'testCaseId',
            as: 'testcase',
            onDelete: 'CASCADE',
        });

        // Hooks are also defined here
        scores.addHook('afterCreate', (scoreInstance, options) => updateSessionTotalScore(scoreInstance, options, models));
        scores.addHook('afterUpdate', (scoreInstance, options) => updateSessionTotalScore(scoreInstance, options, models));
        scores.addHook('afterDestroy', (scoreInstance, options) => updateSessionTotalScore(scoreInstance, options, models));
    };
    return scores;
};