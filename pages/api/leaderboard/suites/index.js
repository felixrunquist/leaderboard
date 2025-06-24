import handler from "@/l/api-handler";
import initializeDb from "db/models";

/**
 * @swagger
 * /api/leaderboard/suites:
 *   get:
 *     tags:
 *       - Suites
 *     summary: Get paginated list of test suites
 *     description: Returns a paginated list of test suites ordered by ascending ID. Supports pagination using a `continueToken`.
 *     parameters:
 *       - in: query
 *         name: continue
 *         schema:
 *           type: string
 *         required: false
 *         description: Base64 encoded token to continue fetching suites after the last received ID.
 *     responses:
 *       200:
 *         description: List of suites with optional continue token for pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       rankAlgorithm:
 *                         type: string
 *                       # Add other suite properties here if any
 *                 continueToken:
 *                   type: string
 *                   nullable: true
 *                   description: Token to use for fetching the next page of suites
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
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

const PAGE_SIZE = 100;

handler.get(async (req, res) => {//Get all test suites
    const models = await initializeDb();
    const { continueToken } = req.query;


    let lastSeenId = 0;
    if (continueToken) {
        try {
            const decoded = Buffer.from(continueToken, 'base64').toString('utf8');
            lastSeenId = parseInt(decoded, 10);
        } catch (err) {
            return res.status(400).json({ error: true, message: 'Invalid continue token' });
        }
    }

    try {
        const results = await models.suites.findAll({
            where: lastSeenId
                ? { id: { [models.Sequelize.Op.gt]: lastSeenId } }
                : undefined,
            order: [['id', 'ASC']],
            attributes: ['id', 'name', 'rankAlgorithm', 'date'],
            limit: PAGE_SIZE + 1, // Fetch one extra to check if there's more
        });

        let nextToken = null;
        if (results.length > PAGE_SIZE) {
            const lastSuite = results[PAGE_SIZE - 1];
            nextToken = Buffer.from(String(lastSuite.id), 'utf8').toString('base64');
            results.length = PAGE_SIZE; // trim extra result
        }

        return res.status(200).json({
            suites: results,
            continueToken: nextToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: true, message: 'Server errror - failed to fetch suites' });
    }

})

export default handler; 