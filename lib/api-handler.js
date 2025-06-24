
const registeredHandlers = {};

export default async function handler(req, res){
    if(registeredHandlers[req.method.toLowerCase()]){
        return await registeredHandlers[req.method.toLowerCase()](req,res);
    }
    const allow = []
    if(registeredHandlers.get){
        allow.push('GET')
    }
    if(registeredHandlers.post){
        allow.push('POST')
    }
    if(registeredHandlers.put){
        allow.push('PUT')
    }
    if(registeredHandlers.delete){
        allow.push('DELETE')
    }
    res.setHeader('Allow', allow);
    return res.status(404).json({error: true, message: "Route not found"})
}

handler.get = (fn) => {
    registeredHandlers.get = fn;
}

handler.post = (fn) => {
    registeredHandlers.post = fn;
}