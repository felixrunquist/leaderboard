import handler from "@/l/api-handler";
import initializeDb from '@/db/models/index.js';

import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid'
import { SignJWT } from 'jose'

import { jwtkey } from '@/lib/constants'

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

    res.status(200).json({error: false, token: 'Bearer ' + token});

})

export default handler