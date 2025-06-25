import { jwtkey } from "./constants";
import { jwtVerify } from 'jose'

export async function verifyToken(token) {
    // console.log(token)
    if (!token) {
        return false;
    }
    try {
        return await jwtVerify(token, new TextEncoder().encode(jwtkey));
    } catch (e) {
        console.log('e:', e);
        return null;
    }
}

import initializeDb from '@/db/models/index.js'
export async function verifyUser(credentials) {
    if(!credentials){
        return false
    }
    const models = await initializeDb();
    const { username, email } = credentials;

    return await models.users.findOne({
        where: { email, username },
        attributes: ['username', 'email', 'admin'],
        limit: 1,
    });
}