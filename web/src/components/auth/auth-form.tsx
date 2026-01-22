"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export function AuthForm({ code, onAuthSuccess }: { code?: string, onAuthSuccess: (userId: string, sessionToken: string) => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");

    const handleSignUp = async () => {
        setIsLoading(true);
        setError("");
        const { data, error: signUpError } = await authClient.signUp.email({
            email,
            password,
            name,
            callbackURL: "/",
        });

        if (signUpError) {
            setError(signUpError.message || "Failed to sign up");
            setIsLoading(false);
        } else if (data) {
            console.log("Sign up successful, data:", JSON.stringify(data));
            const token = (data as any).session?.token || (data as any).token || (data as any).sessionToken || "";
            if (!token) console.warn("No token found in sign up response");
            onAuthSuccess(data.user.id, token);
        }
    };

    const handleSignIn = async () => {
        setIsLoading(true);
        setError("");
        const { data, error: signInError } = await authClient.signIn.email({
            email,
            password,
        });

        if (signInError) {
            setError(signInError.message || "Failed to sign in");
            setIsLoading(false);
        } else if (data) {
            console.log("Sign in successful, data:", JSON.stringify(data));
            const token = (data as any).session?.token || (data as any).token || (data as any).sessionToken || "";
            if (!token) console.warn("No token found in sign in response");
            onAuthSuccess(data.user.id, token);
        }
    };

    return (
        <Card className="w-[400px] shadow-xl border-slate-200 dark:border-slate-800">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">Cloud CLI Auth</CardTitle>
                <CardDescription className="text-center">
                    {code ? `Verifying terminal code: ${code}` : "Authentication required for terminal access"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="email-login">Email</Label>
                            <Input id="email-login" type="email" placeholder="m@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password-login">Password</Label>
                            <Input id="password-login" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button className="w-full" onClick={handleSignIn} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sign In
                        </Button>
                    </TabsContent>
                    <TabsContent value="signup" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="John Doe" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email-signup">Email</Label>
                            <Input id="email-signup" type="email" placeholder="m@example.com" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password-signup">Password</Label>
                            <Input id="password-signup" type="password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button className="w-full" onClick={handleSignUp} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-xs text-slate-500">Secure authentication powered by Better Auth</p>
            </CardFooter>
        </Card>
    );
}
