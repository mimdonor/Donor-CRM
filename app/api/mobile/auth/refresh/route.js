import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        const { refreshToken } = await req.json();

        if (!refreshToken) {
             return NextResponse.json({ success: false, message: "Missing refresh token" }, { status: 400 });
        }

        const secret = process.env.NEXTAUTH_SECRET || "default_secret";
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, secret);
        } catch (e) {
            return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
        }

        const tokenPayload = { id: decoded.id, email: decoded.email, role: decoded.role };
        const accessToken = jwt.sign(tokenPayload, secret, { expiresIn: '7d' });

        return NextResponse.json({
            success: true,
            message: "Token refreshed",
            data: {
                accessToken,
            }
        });
    } catch (error) {
        console.error("Mobile refresh error:", error);
        return NextResponse.json({ success: false, message: "Failed to refresh token" }, { status: 500 });
    }
}
