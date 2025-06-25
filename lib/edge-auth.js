import { jwtkey } from "./constants";
import { jwtVerify } from 'jose'

export async function verifyToken(token) {
    if (!token) {
        return false;
    }
    try {
        return await jwtVerify(token, new TextEncoder().encode(jwtkey));
    } catch (e) {
        console.error('Error:', e);
        return null;
    }
}