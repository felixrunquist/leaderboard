import swaggerSpec from '@/lib/swagger';
import handler from "@/lib/api-handler";

handler.get((req, res) => {
    if (process.env.NODE_ENV === 'development') {
        // Disable caching in dev
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    } else {
        // In production, allow caching for better performance
        res.setHeader('Cache-Control', 'public, max-age=3600'); 
    }


    res.status(200).json(swaggerSpec);
})

export default handler;