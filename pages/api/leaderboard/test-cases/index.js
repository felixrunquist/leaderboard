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

/**
 * @swagger
 * /api/leaderboard/test-cases:
 *   post:
 *     tags:
 *       - Test Cases
 *     summary: Create a new test case
 *     description: Creates a new test case and optionally associates it with suites by IDs or names.
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
 *                 description: Name of the test case
 *               runCommand:
 *                 type: string
 *                 description: Command to run the test case
 *               testData:
 *                 type: string
 *                 description: Test data or input for the test case
 *               weight:
 *                 type: number
 *                 description: Weight or priority of the test case
 *               suites:
 *                 type: array
 *                 description: Array of suite IDs or names to associate the test case with
 *                 items:
 *                   oneOf:
 *                     - type: integer
 *                     - type: string
 *     responses:
 *       201:
 *         description: Test case created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testcase:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     runCommand:
 *                       type: string
 *                       nullable: true
 *                     testData:
 *                       type: string
 *                       nullable: true
 *                     weight:
 *                       type: number
 *                       nullable: true
 *                     suites:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           rankAlgorithm:
 *                             type: string
 *       400:
 *         description: Invalid input, missing required fields, or suites not found
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
 *         description: Test case with this name already exists
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
 *         description: Server error while creating test case
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

handler.post(async (req, res) => {
    const models = await initializeDb();
    const { name, runCommand, testData, weight, suites } = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: true, message: "Test case name is required and must be a string." });
    }
    if(runCommand && typeof runCommand != 'string'){
        return res.status(400).json({ error: true, message: "Run command must be a string." });
    }
    if(testData && typeof testData != 'string'){
        return res.status(400).json({ error: true, message: "Test data must be a string." });
    }
    if(weight && typeof weight != 'number'){
        return res.status(400).json({ error: true, message: "Weight must be an integer." });
    }

    try {
        const newTestCase = await models.testcases.create({
            name, runCommand, testData, weight
        });

        // If testCases are provided, associate them
        if (Array.isArray(suites) && suites.length > 0) {
            // Support test cases by ID or name
            const foundSuites = await models.suites.findAll({
                where: {
                    [models.Sequelize.Op.or]: suites.map(val =>
                        typeof val === 'number'
                            ? { id: val }
                            : { name: val }
                    ),
                },
            });

            if (foundSuites.length !== suites.length) {
                return res.status(400).json({
                    error: true,
                    message: `One or more suites not found.`,
                });
            }

            // Associate test cases with the suite
            await newTestCase.setSuites(foundSuites);
        }

        const testCaseWithSuites = await models.testcases.findOne({
            where: { id: newTestCase.id },
            include: [
                {
                    model: models.suites,
                    through: { attributes: [] },
                    as: 'suites',
                    attributes: ['id', 'name', 'rankAlgorithm'],
                },
            ],
        });

        return res.status(201).json({ testcase: testCaseWithSuites });
    } catch (error) {
        console.error("Failed to create test case:", error);

        if (error.name === "SequelizeUniqueConstraintError") {
            return res.status(409).json({
                error: true,
                message: `A test case with the name "${name}" already exists.`,
            });
        }

        return res.status(500).json({ error: true, message: "Failed to create test case." });
    }
})

export default handler;