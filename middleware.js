import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({
        req: req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    // console.log("token", token);
    const url = req.nextUrl;
    const path = url.pathname;

    const publicPaths = ["/"];
    const loginPath = path === "/";
    const isPublicPath = publicPaths.includes(path);

    if (loginPath && token) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    
    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|fonts|favicon.ico).*)',
    ],
};
