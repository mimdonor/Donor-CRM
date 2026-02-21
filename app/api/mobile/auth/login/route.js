import { NextResponse } from "next/server";

// Handle CORS preflight request from browsers (Expo web)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-App-Version, X-Platform',
        },
    });
}
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
             return NextResponse.json({ success: false, message: "Missing email or password" }, { status: 400 });
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return NextResponse.json({ success: false, message: "User doesn't exist" }, { status: 404 });
        }

        // Matching web app NextAuth logic precisely
        if (password !== user.password) {
            return NextResponse.json({ success: false, message: "Password is incorrect" }, { status: 401 });
        }

        const tokenPayload = { id: user.id, email: user.email, role: user.role };
        const secret = process.env.NEXTAUTH_SECRET || "default_secret";
        
        const accessToken = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });
        const refreshToken = jwt.sign(tokenPayload, secret, { expiresIn: '30d' });

        return NextResponse.json({
            success: true,
            message: "Login successful",
            data: {
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: 7 * 24 * 60 * 60,
                },
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error("Mobile login error:", error);
        return NextResponse.json({ success: false, message: "Failed to login. " + error.message }, { status: 500 });
    }
}
