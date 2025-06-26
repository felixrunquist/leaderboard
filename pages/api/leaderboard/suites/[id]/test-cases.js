import handler from "@/lib/api-handler";
import initializeDb from "db/models";
import cookie from 'cookie';
import { verifyToken, verifyUser } from "@/l/auth";

/**
 * @swagger
 * /api/leaderboard/suites/{id}/test-cases:
 *   get:
 *     tags:
 *       - Test Cases
 *       - Suites
 *     summary: Get test cases in a suite with pagination
 *     description: >
 *       Returns a paginated list of test cases associated with a specific suite, ordered by ascending ID.
 *       Uses a `continueToken` for pagination to fetch subsequent pages.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the suite whose test cases to fetch
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Maximum number of test cases to return (max 100)
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - name: continueToken
 *         in: query
 *         required: false
 *         description: A base64-encoded ID used to fetch the next page of results
 *         schema:
 *           type: string
 *           example: "MTA="
 *     responses:
 *       200:
 *         description: A list of test cases in the suite with optional pagination token
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
 *                 continueToken:
 *                   type: string
 *                   nullable: true
 *                   example: "NDI="
 *       400:
 *         description: Invalid continue token format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: Invalid continue token
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
 *                   example: Suite with id 1 not found.
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
 *                   example: Failed to fetch test cases
 */

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
        // Verify that the suite exists
        const suite = await models.suites.findByPk(suiteId);
        if (!suite) {
            return res.status(404).json({ error: true, message: `Suite with id ${suiteId} not found.` });
        }

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
 *       Only users who are owners of the suite or admin users are authorized.  
 *       Rejects test cases that already belong to the suite or are not found.
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
 *         description: Invalid input, test cases not found, or already associated
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
 *       403:
 *         description: Unauthorized (not a suite owner or admin)
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
 *                   example: You must be an owner of the suite or an admin user.
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

// Add test cases to a suite
handler.post(async (req, res) => {
    const models = await initializeDb();
    const suiteId = req.query.id;

    let testCases = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    //Get username from auth token
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    const verifiedToken = await verifyToken(token);
    const { username, admin } = await verifyUser(verifiedToken.payload);
    if (!verifiedToken || !username) {
        return res.status(403).json({ error: true, message: "Unauthorized" });
    }

    try {
        // Verify that the suite exists
        const suite = await models.suites.findByPk(suiteId, {
            include: [
                {
                    model: models.testcases,
                    as: 'testcases',
                    attributes: ['id']
                },
                {
                    model: models.users,
                    through: { attributes: [] },
                    as: 'users',
                    attributes: ['name', 'username', 'email'],
                },
        ]
        });

        if (!suite) {
            return res.status(404).json({ error: true, message: `Suite with id ${suiteId} not found.` });
        }

        if(!suite.users.map(i => i.username).includes(username) && !admin){
            return res.status(403).json({ error: true, message: `To add sessions to the suite ${suite.name} you must be an owner of it or an admin user. `});
        }

        // Extract valid testCase IDs that already belong to the suite
        const validTestCaseIds = new Set(suite.testcases.map(tc => tc.id));

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

            if (validTestCaseIds.intersection(new Set(foundTestCases.map(tc => tc.id))).size > 0) {
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
            return res.status(201).json({ testcases: foundTestCases.map(({ id, name }) => ({ id, name })) })
        }
    } catch (error) {
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
 *       Only users who are owners of the suite or admins are authorized to perform this operation.
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
 *         description: Invalid input, test cases not found, or they don't belong to the suite
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
 *       403:
 *         description: Unauthorized (not owner of the suite or not an admin)
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
 *                   example: You must be an owner of the suite or an admin user.
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

// Remove test cases from a suite
handler.delete(async (req, res) => {
    const models = await initializeDb();
    const suiteId = req.query.id;

    let testCases = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    //Get username from auth token
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    const verifiedToken = await verifyToken(token);
    const { username, admin } = await verifyUser(verifiedToken.payload);
    if (!verifiedToken || !username) {
        return res.status(403).json({ error: true, message: "Unauthorized" });
    }

    try {
        // Verify that the suite exists
        const suite = await models.suites.findByPk(suiteId, {
            include: [
                {
                    model: models.testcases,
                    as: 'testcases',
                    attributes: ['id']
                },
                {
                    model: models.users,
                    through: { attributes: [] },
                    as: 'users',
                    attributes: ['name', 'username', 'email'],
                },
        ]
        });

        if (!suite) {
            return res.status(404).json({ error: true, message: `Suite with id ${suiteId} not found.` });
        }

        if(!suite.users.map(i => i.username).includes(username) && !admin){
            return res.status(403).json({ error: true, message: `To add sessions to the suite ${suite.name} you must be an owner of it or an admin user. `});
        }

        // Extract valid testCase IDs that already belong to the suite
        const validTestCaseIds = new Set(suite.testcases.map(tc => tc.id));

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

            if ((new Set(foundTestCases.map(tc => tc.id)).difference(validTestCaseIds)).size > 0) {
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

            //Return the removed test cases
            res.status(201).json({ testcases: foundTestCases.map(({ id, name }) => ({ id, name })) })
        }
    } catch (error) {
        console.error("Failed to add test cases to suite:", error);
        return res.status(500).json({ error: true, message: "Failed to add test cases to suite" });
    }
})

export default handler;