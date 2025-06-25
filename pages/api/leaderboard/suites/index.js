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
//Get all test suites
handler.get(async (req, res) => {
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

/**
 * @swagger
 * /api/leaderboard/suites:
 *   post:
 *     tags:
 *       - Suites
 *     summary: Create a new test suite
 *     description: Creates a new test suite and optionally associates test cases by their IDs or names.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the suite
 *               rankAlgorithm:
 *                 type: string
 *                 description: The ranking algorithm used by the suite
 *                 default: avg
 *               testCases:
 *                 type: array
 *                 description: Array of test case IDs or names to associate with the suite
 *                 items:
 *                   oneOf:
 *                     - type: integer
 *                     - type: string
 *     responses:
 *       201:
 *         description: Suite created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 suite:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     rankAlgorithm:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date-time
 *                     testcases:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           weight:
 *                             type: number
 *       400:
 *         description: Bad request (e.g. missing name or invalid test cases)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       409:
 *         description: A suite with this name already exists
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
 *                   type: boolean
 *                 message:
 *                   type: string
 */

// Add a new suite
handler.post(async (req, res) => {
    const models = await initializeDb();
    const { name, rankAlgorithm, testCases } = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: true, message: "Suite name is required and must be a string." });
    }

    try {
        const newSuite = await models.suites.create({
            name,
            rankAlgorithm: rankAlgorithm || 'avg',
        });

        // If testCases are provided, associate them
        if (Array.isArray(testCases) && testCases.length > 0) {
            // Support test cases by ID or name
            const foundTestCases = await models.testcases.findAll({
                where: {
                    [models.Sequelize.Op.or]: testCases.map(val =>
                        typeof val === 'number'
                            ? { id: val }
                            : { name: val }
                    ),
                },
            });

            if (foundTestCases.length !== testCases.length) {
                return res.status(400).json({
                    error: true,
                    message: `One or more test cases not found.`,
                });
            }

            // Associate test cases with the suite
            await newSuite.setTestcases(foundTestCases);
        }

        const suiteWithTestCases = await models.suites.findOne({
            where: { id: newSuite.id },
            include: [
                {
                    model: models.testcases,
                    through: { attributes: [] },
                    as: 'testcases',
                    attributes: ['id', 'name', 'weight'],
                },
            ],
        });

        return res.status(201).json({ suite: suiteWithTestCases });
    } catch (error) {
        console.error("Failed to create suite:", error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                error: true,
                message: `A suite with the name "${name}" already exists.`,
            });
        }

        return res.status(500).json({ error: true, message: "Failed to create suite." });
    }
});


export default handler; 