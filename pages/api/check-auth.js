import handler from "@/l/api-handler";
import cookie from 'cookie';

import { verifyToken, verifyUser } from "@/l/auth";

handler.get(async (req, res) => {
    const cookies = cookie.parse(req.headers.cookie || '');
    const token = cookies.token || req.headers['authorization']
    
    const verifiedToken = await verifyToken(token)
    console.log(verifiedToken)
    const userCredentials = await verifyUser(verifiedToken.payload);

    if(verifiedToken){
        res.status(200).json(userCredentials);
    }else{
        res.status(403).json({error: true, message: "Unauthorized"})
    }
})

export default handler;