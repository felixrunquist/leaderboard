import handler from "@/lib/api-handler";
import initializeDb from "db/models";

/**
 * @swagger
 * /api/leaderboard/test-cases:
 *   get:
 *     tags:
 *       - Test Cases
 *     summary: Get a paginated list of test cases
 *     description: Returns a list of test cases with associated suites. Supports pagination using a continue token.
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: The number of test cases to return (max 100).
 *       - in: query
 *         name: continueToken
 *         required: false
 *         schema:
 *           type: string
 *         description: Base64-encoded ID of the last test case from the previous page.
 *     responses:
 *       200:
 *         description: A paginated list of test cases
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testcases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       weight:
 *                         type: number
 *                       suites:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                             rankAlgorithm:
 *                               type: string
 *                 continueToken:
 *                   type: string
 *                   nullable: true
 *                   description: Token to fetch the next page of test cases
 *       400:
 *         description: Invalid continue token
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
 *         description: Server error while fetching test cases
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

const PAGE_SIZE = 100;

//Returns a list of test cases with pagination
handler.get(async (req, res) => {
    const models = await initializeDb();

    const limit = Math.min(parseInt(req.query.limit, 10) || PAGE_SIZE, 100);
    const { continueToken } = req.query;

    let lastSeenId = 0;
    if (continueToken) {
        try {
            const decoded = Buffer.from(continueToken, 'base64').toString('utf8');
            lastSeenId = parseInt(decoded, 10);
            if (isNaN(lastSeenId)) throw new Error();
        } catch (err) {
            return res.status(400).json({ error: true, message: 'Invalid continue token' });
        }
    }

    try {
        let testcases = await models.testcases.findAll({
            where: lastSeenId ? { id: { [models.Sequelize.Op.gt]: lastSeenId } } : undefined,
            order: [['id', 'ASC']],
            limit: limit + 1, // fetch one extra to check for next page
            include: [
                {
                    model: models.suites,
                    through: { attributes: [] },
                    as: 'suites',
                    attributes: ['id', 'name', 'rankAlgorithm'],
                },
            ],
        });

        let nextToken = null;
        if (testcases.length > limit) {
            const lastTestCase = testcases[limit - 1];
            nextToken = Buffer.from(String(lastTestCase.id), 'utf8').toString('base64');
            testcases.length = limit; // trim extra item
        }

        res.status(200).json({ testcases, continueToken: nextToken });
    } catch (error) {
        console.error('Failed to fetch test cases:', error);
        res.status(500).json({ error: true, message: 'Failed to fetch test cases' });
    }
});

export default handler;