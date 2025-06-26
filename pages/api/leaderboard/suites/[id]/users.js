import initializeDb from "db/models";
import cookie from 'cookie';
import { verifyToken, verifyUser } from "@/l/auth";
import createHandler from '@/lib/api-handler';
const handler = createHandler();


/**
 * @swagger
 * /api/leaderboard/suites/{id}/users:
 *   get:
 *     tags:
 *       - Suites
 *       - Users
 *     summary: Get users associated with a suite
 *     description: Returns a list of users who have access to the specified test suite.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the suite
 *     responses:
 *       200:
 *         description: Successfully retrieved users of the suite
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
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
 *         description: Server error while retrieving users
 */


handler.get(async (req, res) => {
    const models = await initializeDb();
    const suiteId = req.query.id;

    try {
        // Verify that the suite exists
        const suite = await models.suites.findByPk(suiteId);
        if (!suite) {
            return res.status(404).json({ error: true, message: `Suite with id ${suiteId} not found.` });
        }

        let users = await models.users.findAll({
            attributes: ['name', 'username', 'email'],
            include: [
                {
                    model: models.suites,
                    as: 'suites',
                    where: { id: suiteId },
                    attributes: [],
                }
            ]
        });


        res.status(200).json({ users });
    } catch (error) {
        console.error('Failed to fetch users for suite', error);
        res.status(500).json({ error: true, message: 'Failed to fetch users for suite' });
    }
})

/**
 * @swagger
 * /api/leaderboard/suites/{id}/users:
 *   post:
 *     tags:
 *       - Suites
 *       - Users
 *     summary: Add users to a suite
 *     description: Adds users to the specified suite by username or email. Only current suite owners or admins may perform this action.
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
 *             type: array
 *             description: Array of usernames or emails to add to the suite
 *             items:
 *               type: string
 *               example: "jane.doe@example.com"
 *     responses:
 *       201:
 *         description: Users successfully added to the suite
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *       400:
 *         description: Invalid input, duplicate users, or users not found
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
 *         description: Unauthorized (not a suite owner or admin)
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
 *         description: Server error while adding users
 */

handler.post(async (req, res) => {
    const models = await initializeDb();
    const suiteId = req.query.id;

    let usersToAdd = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    //Get username from auth token
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    const verifiedToken = await verifyToken(token);
    const { username, admin } = await verifyUser(verifiedToken.payload);
    if (!verifiedToken || !username) {
        return res.status(403).json({ error: true, message: "Unauthorized" });
    }

    //Add users to the suite
    try {
        // Verify that the suite exists
        const suite = await models.suites.findByPk(suiteId, {
            include: [
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
            return res.status(403).json({ error: true, message: `To add users to the suite ${suite.name} you must be an owner of it or an admin user. `});
        }

        const validUsers = new Set(suite.users.map(u => u.username));

        // Associate users
        if (Array.isArray(usersToAdd) && usersToAdd.length > 0) {
            // Support test cases by ID or name
            const foundUsers = await models.users.findAll({
                where: {
                    [models.Sequelize.Op.or]: usersToAdd.flatMap(val =>
                        [{username: val}, {email: val}]
                    ),
                },
            });

            if (validUsers.intersection(new Set(foundUsers.map(u => u.username))).size > 0) {
                return res.status(400).json({
                    error: true,
                    message: `One or more users already own the suite.`,
                });
            }

            if (foundUsers.length !== usersToAdd.length) {
                return res.status(400).json({
                    error: true,
                    message: `One or more users not found.`,
                });
            }

            // Associate users with the suite
            await suite.addUsers(foundUsers);

            //Return the users
            return res.status(201).json({ users: foundUsers.map(({ name, username, email }) => ({ name, username, email })) })
        }


    } catch (error) {
        console.error("Failed to add users to suite:", error);
        return res.status(500).json({ error: true, message: "Failed to add users to suite" });
    }
})

/**
 * @swagger
 * /api/leaderboard/suites/{id}/users:
 *   delete:
 *     tags:
 *       - Suites
 *       - Users
 *     summary: Remove users from a suite
 *     description: Removes users from the specified suite by username or email. Only current suite owners or admins may perform this action.
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
 *             type: array
 *             description: Array of usernames or emails to remove from the suite
 *             items:
 *               type: string
 *               example: "jane.doe@example.com"
 *     responses:
 *       201:
 *         description: Users successfully removed from the suite
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *       400:
 *         description: Invalid input, users not found, or users not associated with the suite
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
 *         description: Unauthorized (not a suite owner or admin)
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
 *         description: Server error while removing users
 */

handler.delete(async (req, res) => {
    const models = await initializeDb();
    const suiteId = req.query.id;

    let usersToRemove = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    //Get username from auth token
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    const verifiedToken = await verifyToken(token);
    const { username, admin } = await verifyUser(verifiedToken.payload);
    if (!verifiedToken || !username) {
        return res.status(403).json({ error: true, message: "Unauthorized" });
    }

    //Remove users from the suite
    try {
        // Verify that the suite exists
        const suite = await models.suites.findByPk(suiteId, {
            include: [
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
            return res.status(403).json({ error: true, message: `To add users to the suite ${suite.name} you must be an owner of it or an admin user. `});
        }

        const validUsers = new Set(suite.users.map(u => u.username));

        // Associate test cases
        if (Array.isArray(usersToRemove) && usersToRemove.length > 0) {
            // Support test cases by ID or name
            const foundUsers = await models.users.findAll({
                where: {
                    [models.Sequelize.Op.or]: usersToRemove.flatMap(val =>
                        [{username: val}, {email: val}]
                    ),
                },
            });

            if ((new Set(foundUsers.map(u => u.username)).difference(validUsers)).size > 0) {
                return res.status(400).json({
                    error: true,
                    message: `One or more users don't belong to the suite.`,
                });
            }

            if (foundUsers.length !== usersToRemove.length) {
                return res.status(400).json({
                    error: true,
                    message: `One or more users not found.`,
                });
            }

            // Associate users with the suite
            await suite.removeUsers(foundUsers);

            //Return the removed users
            return res.status(201).json({ users: foundUsers.map(({ name, username, email }) => ({ name, username, email })) })
        }


    } catch (error) {
        console.error("Failed to remove users from suite:", error);
        return res.status(500).json({ error: true, message: "Failed to remove users to suite" });
    }
})

export default handler