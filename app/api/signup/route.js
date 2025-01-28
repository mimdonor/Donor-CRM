import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { supabase } from "@/lib/supabase";

export async function POST(req) {
    try {
        const { name, email, password, role } = await req.json();

        // Check if user already exists
        const { data: existingUser, error: existingUserError } = await supabase
            .from('users')
            .select('email')
            .eq('email', email)
            .single();
        

        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists!" },
                { status: 400 } 
            );
        }

        if(!existingUser && password.length < 8){
            return NextResponse.json(
                {message: "Password must be atleast 8 characters long"},
                {status: 400}
            )
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const {data, supabaseError} = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                }
            }
        })

        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({ name, email, password: hashedPassword, role })
            .single();

        if (insertError) {
            throw insertError;
        }

        return NextResponse.json(
            { message: "User registered successfully!" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error while creating user:", error);
        return NextResponse.json(
            { message: "Error creating user", error },
            { status: 500 }
        );
    }
}
