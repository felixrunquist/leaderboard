import handler from "@/lib/api-handler";
import initializeDb from "db/models";

/**
 * @swagger
 * /api/leaderboard/test-cases/count:
 *   get:
 *     tags:
 *      - Test Cases
 *     summary: Get total test case count
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

// Counts all the test cases
handler.get(async (req, res) => {
    const models = await initializeDb();

    try {
        const count = await models.testcases.count()
        res.status(200).json({ count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: true, message: 'Server errror - failed to fetch test cases' });
    }
})

export default handler;