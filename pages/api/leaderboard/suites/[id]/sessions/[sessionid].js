import createHandler from '@/lib/api-handler';
import initializeDb from "db/models";

const handler = createHandler();

/**
 * @swagger
 * /api/leaderboard/suites/{id}/sessions/{sessionid}:
 *   get:
 *     tags:
 *       - Sessions
 *       - Suites
 *     summary: Get a session and its rank within a suite
 *     description: >
 *       Returns details of a specific session within a suite, including its total score,
 *       rank within the suite (by descending total score), and overall statistics for the suite 
 *       such as minimum score, maximum score, and total number of sessions.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the suite.
 *       - in: path
 *         name: sessionid
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the session.
 *     responses:
 *       200:
 *         description: Session details with rank and suite statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     commitId:
 *                       type: string
 *                     suiteId:
 *                       type: integer
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     username:
 *                       type: string
 *                     totalScore:
 *                       type: number
 *                     suite:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         rankAlgorithm:
 *                           type: string
 *                     scores:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           score:
 *                             type: number
 *                           testCaseId:
 *                             type: integer
 *                           testCaseName:
 *                             type: string
 *                           testCaseWeight:
 *                             type: number
 *                 rank:
 *                   type: integer
 *                   description: Rank of the session in the suite based on totalScore
 *                 minScore:
 *                   type: number
 *                   description: Minimum score in the suite
 *                 maxScore:
 *                   type: number
 *                   description: Maximum score in the suite
 *                 totalSessions:
 *                   type: integer
 *                   description: Total number of sessions in the suite
 *       400:
 *         description: Invalid session or suite ID
 *       404:
 *         description: Session not found in the given suite
 *       500:
 *         description: Server error
 */

handler.get(async (req, res) => {
    const sessionId = req.query.sessionid;
    const suiteId = req.query.id;

    if (isNaN(sessionId) || isNaN(suiteId)) {
        return res.status(400).json({ error: true, message: 'Invalid suite or session ID' });
    }

    const models = await initializeDb();

    try {
        // Confirm session exists and belongs to suite
        const session = await models.sessions.findOne({
            where: { id: sessionId, suiteId },
            attributes: ['id', 'name', 'commitId', 'suiteId', 'date', 'username', 'totalScore'],
            include: [
                {
                    model: models.suites,
                    as: 'suite',
                    attributes: ['name', 'rankAlgorithm'],
                },
                {
                    model: models.scores,
                    as: 'scores',
                    attributes: ['score', 'testCaseId'],
                    include: [
                        {
                            model: models.testcases,
                            as: 'testcase',
                            attributes: ['name', 'weight'],
                        },
                    ],
                },
            ]
        });

        if (!session) {
            return res.status(404).json({ error: true, message: 'Session not found in suite' });
        }

        const scores = session.scores.map(score => ({
            ...score.toJSON(),
            testCaseName: score.testcase?.name,
            testCaseWeight: score.testcase?.weight,
            testcase: undefined
        }));
        const result = {
            ...session.toJSON(),
            scores,
        };

        // Efficient rank query using window function
        const [rankResult] = await models.sequelize.query(
            `
        SELECT rank FROM (
          SELECT id, RANK() OVER (ORDER BY "totalScore" DESC, id ASC) AS rank
          FROM sessions
          WHERE "suiteId" = :suiteId
        ) ranked
        WHERE id = :sessionId
      `,
            {
                replacements: { suiteId, sessionId },
                type: models.Sequelize.QueryTypes.SELECT,
            }
        );

        // Get min, max, and totalSessions in one query
        const [stats] = await models.sessions.findAll({
            where: { suiteId },
            attributes: [
                [models.Sequelize.fn('MIN', models.Sequelize.col('totalScore')), 'minScore'],
                [models.Sequelize.fn('MAX', models.Sequelize.col('totalScore')), 'maxScore'],
                [models.Sequelize.fn('COUNT', models.Sequelize.col('id')), 'totalSessions'],
            ],
            raw: true,
        });


        return res.status(200).json({
            session: result,
            rank: rankResult?.rank ?? null,
            minScore: parseFloat(stats.minScore),
            maxScore: parseFloat(stats.maxScore),
            totalSessions: parseInt(stats.totalSessions)
        });
    } catch (error) {
        console.error('Failed to fetch ranked session info:', error);
        res.status(500).json({ error: true, message: 'Server error' });
    }
});

export default handler;
