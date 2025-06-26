import initializeDb from "db/models";
import { verifyToken, verifyUser } from "@/l/auth";
import cookie from 'cookie';
import createHandler from '@/lib/api-handler';
const handler = createHandler();

/**
 * @swagger
 * /api/leaderboard/suites/{id}:
 *   get:
 *     tags:
 *       - Suites
 *     summary: Get a specific suite by ID
 *     description: Returns detailed information about a test suite, including its name, rank algorithm, creation date, associated test cases, and users.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the suite to retrieve.
 *     responses:
 *       200:
 *         description: Suite found
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
 *                       description: Test cases associated with this suite
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
 *                       description: Users associated with this suite
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           username:
 *                             type: string
 *                           email:
 *                             type: string
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

//Get info on particular suite
handler.get(async (req, res) => {
    const models = await initializeDb();
    const id = req.query.id;

    try {

        const suite = await models.suites.findOne({
            where: { id },
            attributes: ['id', 'name', 'rankAlgorithm', 'date'],
            include: [
                {
                    model: models.testcases,
                    through: { attributes: [] }, // exclude join table fields
                    as: 'testcases',
                    attributes: ['id', 'name', 'weight'], // include relevant testcase fields
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
            return res.status(404).json({ error: true, message: `Suite ${id} not found` })
        }

        res.status(200).json({ suite });
    } catch (error) {
        console.error('Failed to fetch suite:', error);
        res.status(500).json({ error: true, message: 'Failed to fetch suite' });
    }
})

/**
 * @swagger
 * /api/leaderboard/suites/{id}:
 *   delete:
 *     tags:
 *       - Suites
 *     summary: Delete a test suite
 *     description: Deletes a test suite if the requester is an owner of the suite or an admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the suite to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Suite successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       403:
 *         description: Unauthorized or forbidden
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
 *       500:
 *         description: Server error during deletion
 */

handler.delete(async (req, res) => {
    const models = await initializeDb();
    const suiteId = req.query.id

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
            return res.status(403).json({ error: true, message: `To delete the suite ${suite.name} you must be an owner of it or an admin user. `});
        }

        //Delete suite
        await suite.destroy()

        return res.status(200).json({ error: false, message: `Suite ${suite.name} deleted.` });
    } catch (error) {
        console.error("Failed to delete suite:", error);
        return res.status(500).json({ error: true, message: "Failed to delete suite." });
    }
})

export default handler;