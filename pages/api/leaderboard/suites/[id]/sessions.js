import { calculateSessionScore } from "@/l/db-helper";
import handler from "@/lib/api-handler";
import initializeDb from "db/models";

/**
 * @swagger
 * /api/leaderboard/suites/{id}/sessions:
 *   get:
 *     tags:
 *       - Sessions
 *     summary: Get sessions for a specific suite
 *     description: Returns a list of sessions associated with a particular suite, along with suite details and calculated scores.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the suite whose sessions are being requested.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: The number of sessions to return (max 100).
 *     responses:
 *       200:
 *         description: List of sessions for the given suite
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
 *                       suiteId:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       commitId:
 *                         type: string
 *                       score:
 *                         type: number
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
 *       500:
 *         description: Server error while fetching suite sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 message:
 *                   type: string
 */


//Get sessions of a particular suite
handler.get(async (req, res) => {
    const suiteId = req.query.id

    const models = await initializeDb();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    try {
        let sessionList = await models.sessions.findAll({
            where: { suiteId },
            order: [['date', 'DESC']],
            limit,
            attributes: ['commitId', 'suiteId', 'date', 'id', 'username'],
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
        sessionList = sessionList.map(i => ({ ...i, score: calculateSessionScore(i) }))


        res.status(200).json({ sessions: sessionList });
    } catch (error) {
        console.error('Failed to fetch suite sessions:', error);
        res.status(500).json({ error: true, message: 'Failed to fetch suite sessions' });
    }
})

export default handler;