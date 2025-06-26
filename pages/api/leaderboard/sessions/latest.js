import { calculateSessionScore } from "@/l/db-helper";
import initializeDb from "db/models";
import createHandler from '@/lib/api-handler';
const handler = createHandler();
/**
 * @swagger
 * /api/leaderboard/sessions/latest:
 *   get:
 *     tags:
 *       - Sessions
 *     summary: Get latest sessions
 *     description: Returns a list of the most recent sessions along with their scores and suite/testcase metadata.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: The maximum number of latest sessions to return.
 *     responses:
 *       200:
 *         description: List of recent sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       commitId:
 *                         type: string
 *                       suiteId:
 *                         type: integer
 *                       suite:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           rankAlgorithm:
 *                             type: string
 *                       scores:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             score:
 *                               type: number
 *                             testCaseId:
 *                               type: integer
 *                             testCaseName:
 *                               type: string
 *                             testCaseWeight:
 *                               type: number
 *                       score:
 *                         type: number
 *       500:
 *         description: Failed to fetch sessions
 */


//Returns the latest sessions
handler.get(async (req, res) => {
    const models = await initializeDb();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    try {
        let sessionList = await models.sessions.findAll({
            order: [['date', 'DESC']],
            limit,
            attributes: ['commitId', 'date', 'id', 'suiteId', 'username'],
            include: [
                {
                    model: models.suites,
                    as: 'suite',
                    attributes: ['name', 'rankAlgorithm'],
                },
                {
                    model: models.scores,
                    as: 'scores',
                    attributes: [
                        'score',
                        'testCaseId'
                    ],
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

        // Flatten the data
        sessionList = sessionList.map(session => {
            const scores = session.scores.map(score => ({
                ...score.toJSON(),
                testCaseName: score.testcase?.name,
                testCaseWeight: score.testcase?.weight,
                testcase: undefined
            }));
            return {
                ...session.toJSON(),
                scores,
            };
        });

        //Calculate the scores
        sessionList = sessionList.map(i => ({...i, score: calculateSessionScore(i)})) 
         

        res.status(200).json({ sessions: sessionList });
    } catch (error) {
        console.error('Failed to fetch sessions:', error);
        res.status(500).json({ error: true, message: 'Failed to fetch sessions' });
    }
})

export default handler;