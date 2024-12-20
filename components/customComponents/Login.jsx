"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast, Toaster } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Logo from "@/public/assets/Logo-1.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    toast.promise(
      (async () => {
          const res = await signIn("credentials", {
              email: email,
              password: password,
              redirect: false,
          });

          console.log("res", res);

          if (res.ok) {
              router.replace("/dashboard");
              return "Successfully logged in";
          } else {
              if (res.error === "Failed to login. User doesn't exist") {
                  throw new Error("User does not exist");
              } else if (
                  res.error === "Failed to login. Password is incorrect"
              ) {
                  throw new Error("Incorrect Password");
              } else {
                  throw new Error("Something went wrong!!");
              }
          }
      })(),
      {
          loading: "Logging in...",
          success: (message) => message,
          error: (error) => `Login failed: ${error.message}`,
      }
  );
  };

  return (
    <>
    <Toaster position="top-center" reverseOrder={false} />
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md relative">
        <div className="absolute w-full top-0 left-0 right-0 h-2 bg-[#F3E6D5]"></div>
        
        {/* Add corner elements to create rounded bottom corners */}
        <div className="absolute top-2 left-0 w-2 h-2 bg-white rounded-bl-full"></div>
        <div className="absolute top-2 right-0 w-2 h-2 bg-white rounded-br-full"></div>

        <CardContent>
          <div className="flex flex-col items-center mb-6 p-4 rounded-lg">
            <Image
              src={Logo}
              alt="MIM Logo"
              width={80}
              height={80}
            />
            <h1 className="text-2xl font-bold text-center mt-4">Welcome to MIM</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-[#6C665F] text-[#F3E6D5] hover:bg-[#494644] hover:text-[#e7e3de]">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default Login;