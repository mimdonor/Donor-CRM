import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";


export async function middleware(req) {
    const token = await getToken({
        req: req,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', token?.email)
        .single();

   

    const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('permissions')
        .eq('role_name', userData?.role)
        .single();

    

    const permissions = roleData?.permissions;

    const url = req.nextUrl.clone();
    if (url.pathname.startsWith('/donors') && !permissions?.donorModule?.allowAccess) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    if (url.pathname.startsWith('/donations') && !permissions?.donationsModule?.allowAccess) {
        return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    }

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
