import handler from "@/l/api-handler";
import initializeDb from '@/db/models/index.js';

import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid'
import { SignJWT } from 'jose'

import { jwtkey } from '@/lib/constants'

import cookie from 'cookie';

import { verifyToken, verifyUser } from "@/l/auth";
/**
 * @swagger
 * /api/users/auth:
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

/**
 * @swagger
 * /api/users/auth:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Authenticate user and return JWT token
 *     description: Authenticates a user using email or username and password. Returns a JWT token and sets a `token` cookie on success.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: Optional if username is provided
 *               username:
 *                 type: string
 *                 example: "user123"
 *                 description: Optional if email is provided
 *               password:
 *                 type: string
 *                 example: "securePassword123"
 *             required:
 *               - password
 *     responses:
 *       200:
 *         description: Authentication successful, JWT token returned
 *         headers:
 *           Set-Cookie:
 *             description: HttpOnly cookie containing JWT token
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: boolean
 *                   example: false
 *                 token:
 *                   type: string
 *                   example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       403:
 *         description: Invalid credentials or missing fields
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
 *                   example: "Username or password incorrect"
 *       500:
 *         description: Internal server error
 */

handler.post(async (req, res) => {
    const { email, username, password } = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    if ((!email && !username) || !password) {
        return res.status(403).json({ error: true, message: 'Missing username/email or password' });
    }
    const models = await initializeDb();
    let user;
    if(email){
        user = await models.users.findOne({
            where: { email },
            attributes: ['id', 'username', 'email', 'password'],
            limit: 1,
        });
    }else{
        user = await models.users.findOne({
            where: { username },
            attributes: ['id', 'username', 'email', 'password'],
            limit: 1,
        });
    }
    if (!user) {
        return res.status(403).json({ status: 'error', error: 'Username or password incorrect' });
    }

    const userData = user.toJSON();
    /* Check and compare password */
    const matches = await bcrypt.compare(password, userData.password);
    if(!matches){
        return res.status(403).json({ status: 'error', error: 'Username or password incorrect' });

    }
    // User matched, create JWT
    const payload = {
        id: userData.id,
        email: userData.email,
        username: userData.username
    };
    // Sign token to expire in 60 days
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setJti(nanoid())
        .setIssuedAt()
        .setExpirationTime('60d')
        .sign(new TextEncoder().encode(jwtkey))


    res.setHeader('Set-cookie', `token=${token}; sameSite=strict; path=/; httpOnly=true; maxAge=${60*60*24}`)
    res.setHeader('Bearer', token)

    res.status(200).json({error: false, token: token});

})

export default handler