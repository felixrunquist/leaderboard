import cookie from 'cookie';
import initializeDb from "db/models";
import {verifyToken, verifyUser} from '@/lib/auth';
import handler from '@/lib/api-handler';

/**
 * @swagger
 * /api/leaderboard/sessions/{id}:
 *   delete:
 *     tags:
 *       - Sessions
 *     summary: Delete a session
 *     description: Deletes a session if the user is either an admin or an owner of the associated suite.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the session to delete
 *         schema:
 *           type: integer
 *           example: 101
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: Unauthorized to delete this session
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
 *         description: Session not found
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
 *         description: Server error while deleting session
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

handler.delete(async (req, res) => {
  const models = await initializeDb();
  const sessionId = req.query.id;

  // Parse token from cookie or Authorization header
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token || req.headers['authorization'];
  const verifiedToken = await verifyToken(token);

  if (!verifiedToken) {
    return res.status(403).json({ error: true, message: "Unauthorized" });
  }

  const { username, admin } = await verifyUser(verifiedToken.payload);

  try {
    const session = await models.sessions.findByPk(sessionId, {
      include: {
        model: models.suites,
        as: 'suite',
        include: {
          model: models.users,
          as: 'users',
          through: { attributes: [] },
          attributes: ['username']
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: true, message: `Session with id ${sessionId} not found.` });
    }

    const suite = session.suite;
    const isOwner = suite?.users?.some(user => user.username === username);

    if (!admin && !isOwner) {
      return res.status(403).json({ error: true, message: "You must be an owner of the suite or an admin user to delete tihs session." });
    }

    await session.destroy();
    return res.status(200).json({ error: false, message: "Deleted session" });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return res.status(500).json({ error: true, message: "Failed to delete session" });
  }
});

export default handler;
