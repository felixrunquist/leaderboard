import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/edge-auth'

export const config = {
    matcher: ['/auth/:path*', '/api/auth/:path', '/', '/api/leaderboard/:path*'],
}

export async function middleware(req) {
    const token = req.cookies.get('token')?.value || req.headers.get('authorization')
    console.log(token)

    const verifiedToken = await verifyToken(token)

    if (verifiedToken) {
        return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/login', req.url))
}