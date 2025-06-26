import { calculateSessionScore } from "@/l/db-helper";
import initializeDb from "db/models";
import createHandler from '@/lib/api-handler';
const handler = createHandler();

/**
 * @swagger
 * /api/leaderboard/suites/count:
 *   get:
 *     tags:
 *      - Suites
 *     summary: Get total suite count
 *     responses:
 *       200:
 *         description: Count returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 42
 *       500:
 *         description: Internal server error
 */

// Counts all the suites
handler.get(async (req, res) => {
    const models = await initializeDb();
    try {
        const count = await models.suites.count()
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ error: true, message: 'Failed to fetch suites' });
    }
})

export default handler;