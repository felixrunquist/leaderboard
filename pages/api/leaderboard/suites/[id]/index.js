import handler from "@/l/api-handler";
import initializeDb from "db/models";

/**
 * @swagger
 * /api/leaderboard/suites/{id}:
 *   get:
 *     tags:
 *       - Suites
 *     summary: Get a specific suite by ID
 *     description: Returns detailed information about a test suite, including its name, rank algorithm, creation date, and associated test cases.
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
                }
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

export default handler;