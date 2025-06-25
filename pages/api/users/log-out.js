import handler from "@/l/api-handler";

/**
 * @swagger
 * /api/users/log-out:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Log out the current user
 *     description: >
 *       Logs the user out by clearing the authentication token cookie.
 *       This is done by setting the `token` cookie to an empty value with `maxAge=0`.
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         headers:
 *           Set-Cookie:
 *             description: Clears the authentication token
 *             schema:
 *               type: string
 *               example: token=; sameSite=strict; path=/; httpOnly=true; maxAge=0
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Logged out"
 */

handler.get(async (req, res) => {
        res.setHeader('Set-cookie', `token=; sameSite=strict; path=/; httpOnly=true; maxAge=0`)
        res.status(200).json({error: false, message: "Logged out"})
})

export default handler;