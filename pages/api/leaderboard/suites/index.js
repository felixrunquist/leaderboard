import initializeDb from "db/models";

import { verifyToken, verifyUser } from "@/l/auth";
import cookie from 'cookie';

import createHandler from '@/lib/api-handler';
const handler = createHandler();

/**
 * @swagger
 * /api/leaderboard/suites:
 *   get:
 *     tags:
 *       - Suites
 *     summary: Get paginated list of test suites
 *     description: Returns a paginated list of test suites ordered by most recently updated. Pagination uses a base64-encoded `continueToken` combining `updated` timestamp and `id`.
 *     parameters:
 *       - in: query
 *         name: continueToken
 *         schema:
 *           type: string
 *         required: false
 *         description: "Base64 encoded token to continue fetching suites after the last seen updated timestamp and ID (format: updated|id)."
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
 *                       created:
 *                         type: string
 *                         format: date-time
 *                       updated:
 *                         type: string
 *                         format: date-time
 *                       users:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             username:
 *                               type: string
 *                             name:
 *                               type: string
 *                             email:
 *                               type: string
 *                 continueToken:
 *                   type: string
 *                   nullable: true
 *                   description: Token to use for fetching the next page of suites
 *       400:
 *         description: Invalid continue token
 *       500:
 *         description: Server error
 */

const PAGE_SIZE = 100;

handler.get(async (req, res) => {
    const models = await initializeDb();
    const { continueToken } = req.query;

    let lastUpdated = null;
    let lastId = null;

    if (continueToken) {
        try {
            const decoded = Buffer.from(continueToken, 'base64').toString('utf8');
            [lastUpdated, lastId] = decoded.split('|');
            lastId = parseInt(lastId, 10);
            if (isNaN(lastId) || !lastUpdated) throw new Error();
        } catch {
            return res.status(400).json({ error: true, message: 'Invalid continue token' });
        }
    }

    try {
        const where = lastUpdated
            ? {
                  [models.Sequelize.Op.or]: [
                      { updated: { [models.Sequelize.Op.lt]: lastUpdated } },
                      {
                          updated: lastUpdated,
                          id: { [models.Sequelize.Op.gt]: lastId },
                      },
                  ],
              }
            : undefined;

        const results = await models.suites.findAll({
            where,
            order: [['updated', 'DESC'], ['id', 'ASC']],
            limit: PAGE_SIZE + 1,
            attributes: ['id', 'name', 'rankAlgorithm', 'created', 'updated'],
            include: [
                {
                    model: models.users,
                    through: { attributes: [] },
                    as: 'users',
                    attributes: ['name', 'username', 'email'],
                },
            ],
        });

        let nextToken = null;
        if (results.length > PAGE_SIZE) {
            const lastSuite = results[PAGE_SIZE - 1];
            nextToken = Buffer.from(`${lastSuite.updated}|${lastSuite.id}`, 'utf8').toString('base64');
            results.length = PAGE_SIZE;
        }

        res.status(200).json({
            suites: results,
            continueToken: nextToken,
        });
    } catch (err) {
        console.error('Failed to fetch suites:', err);
        res.status(500).json({ error: true, message: 'Server error - failed to fetch suites' });
    }
});

/**
 * @swagger
 * /api/leaderboard/suites:
 *   post:
 *     tags:
 *       - Suites
 *     summary: Create a new test suite
 *     description: Creates a new test suite and optionally associates test cases by their IDs or names. The currently authenticated user is added as one of the owners of the suite
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
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

    // Get current user from cookie or header
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization'];

    const verifiedToken = await verifyToken(token);
    // const currentUser = await verifyUser(verifiedToken?.payload);

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: true, message: "Suite name is required and must be a string." });
    }

    try {
        const newSuite = await models.suites.create({
            name,
            rankAlgorithm: rankAlgorithm || 'avg',
        });

        const user = await models.users.findOne({
            where: {username: verifiedToken.payload.username}
        })

        if(!user){
            return res.status(403).json({ error: true, message: "Unauthorized" });
        }

        // Associate the current user with the suite
        await newSuite.addUser(user.id);

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

        const fullSuite = await models.suites.findOne({ //Suite with test cases and user
            where: { id: newSuite.id },
            include: [
                {
                    model: models.testcases,
                    through: { attributes: [] },
                    as: 'testcases',
                    attributes: ['id', 'name', 'weight'],
                },
                {
                    model: models.users,
                    through: { attributes: [] },
                    as: 'users',
                    attributes: ['name', 'username', 'email'],
                },
            ],
        });

        return res.status(201).json({ suite: fullSuite });
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