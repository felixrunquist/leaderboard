import handler from "@/l/api-handler";
import cookie from 'cookie';

import { verifyToken, verifyUser } from "@/l/auth";

/**
 * @swagger
 * /api/users/check-auth:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Check authentication and return user credentials
 *     description: >
 *       Verifies a JWT token from the `Authorization` header or `token` cookie.
 *       Returns user credentials if valid, otherwise returns 403.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: "user123"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *       403:
 *         description: Unauthorized - token is missing or invalid
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
 *                   example: "Unauthorized"
 */

handler.get(async (req, res) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    
    const verifiedToken = await verifyToken(token)
    console.log(verifiedToken)
    const userCredentials = await verifyUser(verifiedToken.payload);

    if(verifiedToken && userCredentials){
        res.status(200).json(userCredentials);
    }else{
        res.status(403).json({error: true, message: "Unauthorized"})
    }
})

export default handler;