import { verifyToken, verifyUser } from "@/l/auth";
import { calculateSessionScore } from "@/l/db-helper";
import handler from "@/lib/api-handler";
import initializeDb from "db/models";

/**
 * @swagger
 * /api/leaderboard/suites/{id}/sessions:
 *   get:
 *     tags:
 *       - Sessions
 *       - Suites
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

/**
 * @swagger
 * /api/leaderboard/suites/{id}/sessions:
 *   post:
 *     tags:
 *       - Sessions
 *       - Suites
 *     summary: Create a session for a suite
 *     description: >
 *       Creates a new session under the specified suite and records scores for associated test cases.
 *       The user is inferred from the authorization token. Test case scores must correspond to test cases in the suite.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the suite
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-23T04:24:26.559Z"
 *                 description: Optional ISO date of the session
 *               commitId:
 *                 type: string
 *                 example: "a1b2c3d"
 *                 description: Optional commit ID for the session
 *               scores:
 *                 type: array
 *                 description: Scores for test cases belonging to the suite
 *                 items:
 *                   type: object
 *                   required:
 *                     - testCaseId
 *                     - score
 *                   properties:
 *                     testCaseId:
 *                       type: integer
 *                       example: 42
 *                       description: ID of a test case in the suite
 *                     score:
 *                       type: number
 *                       example: 0.95
 *                       description: Numeric score for the test case
 *     responses:
 *       201:
 *         description: Session and scores created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sessionId:
 *                   type: integer
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid input (e.g. missing scores or invalid test case)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Unauthorized (missing or invalid token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Suite not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error during session creation
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
import cookie from 'cookie';

handler.post(async (req, res) => {
    const models = await initializeDb();
    const suiteId = req.query.id;
    const { date, commitId, scores } = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    //Get username from auth token
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    const verifiedToken = await verifyToken(token);
    const { username } = await verifyUser(verifiedToken.payload);
    if (!verifiedToken || !username) {
        res.status(403).json({ error: true, message: "Unauthorized" });
    }

    if (!Array.isArray(scores)) {
        return res.status(400).json({ error: true, message: "scores array is required." });
    }

    //Make sure the date is valid
    let formattedDate;
    if (date) {
        const dateClass = new Date(date);
        if (isNaN(dateClass.getTime())) {
            return res.status(400).json({ error: true, message: "The date needs to be valid." });
        }
        formattedDate = dateClass.toISOString();
    }

    try {
        // Verify that the suite exists
        const suite = await models.suites.findByPk(suiteId, {
            include: [{
                model: models.testcases,
                as: 'testcases',
                attributes: ['id']
            }]
        });

        if (!suite) {
            return res.status(404).json({ error: true, message: `Suite with id ${suiteId} not found.` });
        }

        // Extract valid testCase IDs that belong to the suite
        const validTestCaseIds = new Set(suite.testcases.map(tc => tc.id));

        // Validate that all score testCaseIds belong to suite
        for (const score of scores) {
            if (!validTestCaseIds.has(score.testCaseId)) {
                return res.status(400).json({ error: true, message: `Test case id ${score.testCaseId} does not belong to suite ${suiteId}.` });
            }
            if (typeof score.score !== 'number') {
                return res.status(400).json({ error: true, message: `Score for testCaseId ${score.testCaseId} must be a number.` });
            }
        }

        // Create the session
        const newSession = await models.sessions.create({
            date: formattedDate || undefined,
            suiteId,
            username,
            commitId: commitId || null,
        });

        // Bulk create scores linked to the session
        const scoresToCreate = scores.map(s => ({
            sessionId: newSession.id,
            testCaseId: s.testCaseId,
            score: s.score,
        }));

        await models.scores.bulkCreate(scoresToCreate);

        //Get the created session
        let session = await models.sessions.findOne({
            where: { id: newSession.id },
            include: [
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
        const newScores = session.scores.map(score => ({
            ...score.toJSON(),
            testCaseName: score.testcase?.name,
            testCaseWeight: score.testcase?.weight,
            testcase: undefined
        }));
        session = {
            ...session.toJSON(),
            scores: newScores,
        }

        return res.status(201).json({ session });
    } catch (error) {
        console.error("Failed to create session:", error);
        return res.status(500).json({ error: true, message: "Failed to create session." });
    }
});

export default handler;