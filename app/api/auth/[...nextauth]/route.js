import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth from "next-auth/next";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { supabase } from "@/lib/supabase";


export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {},
            async authorize(credentials) {
                try {
                    const { data: user, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', credentials.email)
                        .single();

                    if (error || !user) {
                        throw new Error("User doesn't exist");
                    }

                    // const isCorrectPassword = await bcrypt.compare(
                    //     credentials.password,
                    //     user.password
                    // );

                    if (credentials.password !== user.password) {
                        throw new Error("Password is incorrect");
                    }

                    return user;
                } catch (error) {
                    console.error("Login error:", error);
                    throw new Error("Failed to login. " + error.message);
                }
            },
        })
    ],
    adapter: SupabaseAdapter({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        secret: process.env.NEXT_PUBLIC_SUPABASE_KEY,
    }),
    session: {
        strategy: 'jwt',
        maxAge: 25 * 24 * 60 * 60,
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
