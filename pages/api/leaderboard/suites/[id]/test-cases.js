import handler from "@/lib/api-handler";
import initializeDb from "db/models";

const PAGE_SIZE = 100;

//Returns a list of test cases with pagination
handler.get(async (req, res) => {
    const models = await initializeDb();

    const suiteId = req.query.id

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
                    attributes: [],
                    where: { id: suiteId }, // filter to only test cases in this suite
                    required: true,         // ensures only matching rows are returned
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
 * /api/leaderboard/suites/{id}/test-cases:
 *   post:
 *     tags:
 *       - Test Cases
 *       - Suites
 *     summary: Add test cases to a suite
 *     description: >
 *       Associates test cases with a suite using either their IDs or names.  
 *       Rejects test cases that are already linked to the suite.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the suite to update
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             description: An array of test case IDs or names to associate
 *             items:
 *               oneOf:
 *                 - type: integer
 *                   example: 42
 *                 - type: string
 *                   example: "Login test"
 *     responses:
 *       201:
 *         description: Test cases successfully added to the suite
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
 *                         example: 42
 *                       name:
 *                         type: string
 *                         example: "Login test"
 *       400:
 *         description: Invalid input or test cases already belong to the suite
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: One or more test cases already belong to the suite.
 *       404:
 *         description: Suite not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Suite with id 1 not found.
 *       500:
 *         description: Server error while associating test cases
 */

// Add test cases to a suite
handler.post(async (req, res) => {
    const models = await initializeDb();
    const suiteId = req.query.id;

    let testCases = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    try {
        // Verify that the suite exists
        const suite = await models.suites.findByPk(suiteId, {
            include: [{
                model: models.testcases,
                as: 'testcases',
                attributes: ['id']
            }]
        });

        // Extract valid testCase IDs that already belong to the suite
        const validTestCaseIds = new Set(suite.testcases.map(tc => tc.id));

        if (!suite) {
            return res.status(404).json({ error: true, message: `Suite with id ${suiteId} not found.` });
        }

        // Associate test cases
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

            if(validTestCaseIds.intersection(new Set(foundTestCases.map(tc => tc.id))).size > 0){
                return res.status(400).json({
                    error: true,
                    message: `One or more test cases already belong to the suite.`,
                });
            }

            if (foundTestCases.length !== testCases.length) {
                return res.status(400).json({
                    error: true,
                    message: `One or more test cases not found.`,
                });
            }

            // Associate test cases with the suite
            await suite.addTestcases(foundTestCases);

            //Return the test cases
            return res.status(201).json({testcases: foundTestCases.map(({id, name}) => ({id, name}))})
        }
    }catch (error) {
        console.error("Failed to add test cases to suite:", error);
        return res.status(500).json({ error: true, message: "Failed to add test cases to suite" });
    }
})

/**
 * @swagger
 * /api/leaderboard/suites/{id}/test-cases:
 *   delete:
 *     tags:
 *       - Suites
 *     summary: Remove test cases from a suite
 *     description: >
 *       Removes the specified test cases (by ID or name) from the given suite.
 *       All test cases must already be associated with the suite.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the suite to update
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             description: Array of test case IDs or names to remove from the suite
 *             items:
 *               oneOf:
 *                 - type: integer
 *                   example: 42
 *                 - type: string
 *                   example: "Login test"
 *     responses:
 *       201:
 *         description: Test cases successfully removed from the suite
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
 *                         example: 42
 *                       name:
 *                         type: string
 *                         example: "Login test"
 *       400:
 *         description: Invalid input or test cases do not belong to the suite
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: One or more test cases don't belong to the suite.
 *       404:
 *         description: Suite not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Suite with id 1 not found.
 *       500:
 *         description: Server error while removing test cases from the suite
 */


// Remove test cases from a suite
handler.delete(async (req, res) => {
    const models = await initializeDb();
    const suiteId = req.query.id;

    let testCases = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    try {
        // Verify that the suite exists
        const suite = await models.suites.findByPk(suiteId, {
            include: [{
                model: models.testcases,
                as: 'testcases',
                attributes: ['id']
            }]
        });

        // Extract valid testCase IDs that already belong to the suite
        const validTestCaseIds = new Set(suite.testcases.map(tc => tc.id));

        if (!suite) {
            return res.status(404).json({ error: true, message: `Suite with id ${suiteId} not found.` });
        }

        // Associate test cases
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

            if((new Set(foundTestCases.map(tc => tc.id)).difference(validTestCaseIds)).size > 0){
                return res.status(400).json({
                    error: true,
                    message: `One or more test cases don't belong to the suite.`,
                });
            }

            if (foundTestCases.length !== testCases.length) {
                return res.status(400).json({
                    error: true,
                    message: `One or more test cases not found.`,
                });
            }

            // Associate test cases with the suite
            await suite.removeTestcases(foundTestCases);
            res.status(201).json({testcases: foundTestCases.map(({id, name}) => ({id, name}))})
        }
    }catch (error) {
        console.error("Failed to add test cases to suite:", error);
        return res.status(500).json({ error: true, message: "Failed to add test cases to suite" });
    }
})

export default handler;