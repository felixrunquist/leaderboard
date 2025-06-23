
const registeredHandlers = {};

export default async function handler(req, res){
    if(registeredHandlers[req.method.toLowerCase()]){
        return await registeredHandlers[req.method.toLowerCase()](req,res);
    }
    return res.status(404).json({error: true, message: "Route not found"})
}

handler.get = (fn) => {
    registeredHandlers.get = fn;
}

handler.post = (fn) => {
    registeredHandlers.post = fn;
}