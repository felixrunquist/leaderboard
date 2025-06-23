import handler from "@/l/api-handler";
import models from '@/db/models/index.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { jwtkey } from '@/lib/constants'

handler.post(async (req, res) => {
    const { email, username, password } = JSON.parse(req.body);

    if ((!email && !username) || !password) {
        return res.status(403).json({ error: true, message: 'Missing username/email or password' });
    }
    let user;
    if(email){
        user = await models.users.findOne({
            where: { email },
            attributes: ['id', 'email', 'password'],
            limit: 1,
        });
    }else{
        user = await models.users.findOne({
            where: { username },
            attributes: ['id', 'email', 'password'],
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
    };
    // Sign token to expire in 1 year in seconds
    const token = jwt.sign(payload, jwtkey, { expiresIn: 31556926, });

    res.setHeader('Set-cookie', `token=${token}; sameSite=strict; httpOnly=true; maxAge=${60*60*24}`)

    res.status(200).json({error: false, token: 'Bearer ' + token});

})

export default handler