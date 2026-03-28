import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
       
        const { data, error } = await supabase
            .from("organization_settings")
            .select("*")
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data
        });
            
    } catch (error) {
        console.error("[Organization Settings API] Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch organization settings", error: error.message },
            { status: 500 }
        );
    }
}
