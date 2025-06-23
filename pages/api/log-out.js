import handler from "@/l/api-handler";

handler.get(async (req, res) => {
        res.setHeader('Set-cookie', `token=; sameSite=strict; path=/; httpOnly=true; maxAge=0`)
        res.status(200).json({error: false, message: "Logged out"})
})

export default handler;