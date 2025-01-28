"use client"

import { SessionProvider } from "next-auth/react";

export const AuthProviders = ({children}) => {
    return <SessionProvider>{children}</SessionProvider>
};