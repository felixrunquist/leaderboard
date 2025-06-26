import initializeDb from "db/models";
import cookie from "cookie";
import { verifyToken, verifyUser } from "@/lib/auth";
import createHandler from '@/lib/api-handler';
const handler = createHandler();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a paginated list of users (admin only)
 *     description: Returns a list of users with pagination support. Requires admin access.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: continueToken
 *         schema:
 *           type: string
 *         description: Base64-encoded cursor to continue pagination.
 *     responses:
 *       200:
 *         description: A list of users and optional pagination token.
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
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       username:
 *                         type: string
 *                       email:
 *                         type: string
 *                         format: email
 *                       admin:
 *                         type: boolean
 *                 continueToken:
 *                   type: string
 *                   nullable: true
 *                   description: Token to continue pagination.
 *       400:
 *         description: Invalid continue token format.
 *       403:
 *         description: Unauthorized access. User is not an admin or not authenticated.
 *       500:
 *         description: Server error while retrieving users.
 */

const PAGE_SIZE = 100;

handler.get(async (req, res) => {
    const models = await initializeDb();

    // Verify admin user
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    const verifiedToken = await verifyToken(token);
    const currentUser = await verifyUser(verifiedToken?.payload);
    if (!verifiedToken || !currentUser?.admin) {
        return res.status(403).json({ error: true, message: "Only admin users can view accounts." });
    }

    const { continueToken } = req.query;
    let lastSeenId = 0;
    if (continueToken) {
        try {
            const decoded = Buffer.from(continueToken, 'base64').toString('utf8');
            lastSeenId = parseInt(decoded, 10);
        } catch (err) {
            return res.status(400).json({ error: true, message: 'Invalid continue token' });
        }
    }

    try {
        const users = await models.users.findAll({
            where: lastSeenId ? { id: { [models.Sequelize.Op.gt]: lastSeenId } } : undefined,
            order: [['id', 'ASC']],
            limit: PAGE_SIZE + 1,
            attributes: ['name', 'username', 'email', 'admin'],
        });

        let nextToken = null;
        if (users.length > PAGE_SIZE) {
            const lastUser = users[PAGE_SIZE - 1];
            nextToken = Buffer.from(String(lastUser.id), 'utf8').toString('base64');
            users.length = PAGE_SIZE;
        }

        return res.status(200).json({
            users,
            continueToken: nextToken,
        });

    } catch (err) {
        console.error("Failed to fetch users:", err);
        return res.status(500).json({ error: true, message: "Server error while fetching users." });
    }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (admin only)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mysecurepassword
 *               admin:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     admin:
 *                       type: boolean
 *       400:
 *         description: Missing required fields or invalid input
 *       403:
 *         description: Only admins can create new users
 *       409:
 *         description: A user with that username or email already exists
 *       500:
 *         description: Server error while creating the user
 */
handler.post(async (req, res) => {
    const models = await initializeDb();

    // Parse request body
    const { name, username, email, password, admin = false } = typeof req.body !== 'object' ? JSON.parse(req.body) : req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: true, message: "Username, email, and password are required." });
    }

    // Verify admin user
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    const verifiedToken = await verifyToken(token);
    const currentUser = await verifyUser(verifiedToken?.payload);
    if (!verifiedToken || !currentUser?.admin) {
        return res.status(403).json({ error: true, message: "Only admin users can view accounts." });
    }

    try {
        // Check for existing user
        const existingUser = await models.users.findOne({
            where: {
                [models.Sequelize.Op.or]: [
                    { username },
                    { email },
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ error: true, message: "A user with that username or email already exists." });
        }

        // Create user
        const newUser = await models.users.create({
            name,
            username,
            email,
            password, // hashed by Sequelize hook
            admin,
        });

        const { id } = newUser;
        return res.status(201).json({ user: { id, name, username, email, admin } });
    } catch (err) {
        console.error("Failed to create user:", err);
        return res.status(500).json({ error: true, message: "Failed to create user." });
    }
});

/**
 * @swagger
 * /api/users:
 *   delete:
 *     summary: Delete a user account (admin only)
 *     description: Deletes a user by `id`, `username`, or `email`. Requires admin authorization.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *             oneOf:
 *               - required: [username]
 *               - required: [email]
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User "johndoe" deleted successfully.
 *       400:
 *         description: Missing identifier
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

handler.delete(async (req, res) => {
    const models = await initializeDb();
    let { username, email } = typeof req.body != 'object' ? JSON.parse(req.body) : req.body;

    // Verify admin user
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    const verifiedToken = await verifyToken(token);
    const currentUser = await verifyUser(verifiedToken?.payload);
    try {
        if (!verifiedToken || !currentUser?.admin) {
            return res.status(403).json({ error: true, message: "Only admin users can delete accounts." });
        }

        if (!username && !email) {
            return res.status(400).json({ error: true, message: "To delete a user one must supply either the username or email" });
        }

        //Find user
        const userToDelete = await models.users.findOne({ where: username ? {username} : {email} });

        if (!userToDelete) {
            return res.status(404).json({ error: true, message: "User not found" });
        }

        await userToDelete.destroy();

        return res.status(200).json({
            error: false,
            message: `User "${userToDelete.username}" deleted successfully.`,
        });
    } catch (err) {
        console.error("Failed to delete user:", err);
        return res.status(500).json({ error: true, message: "Failed to delete user." });
    }
});

export default handler;
