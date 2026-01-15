"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import React, { useState, Suspense, useEffect } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const code = searchParams.get("CODE");
    const [isVerified, setIsVerified] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [mounted, setMounted] = useState(false);
    const verificationStarted = React.useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleAuthSuccess = React.useCallback(async (userId: string, sessionToken: string) => {
        if (!code || verificationStarted.current || isVerified) {
            if (isVerified) console.log("Already verified, skipping.");
            return;
        }
        
        if (!sessionToken) {
            console.warn("handleAuthSuccess called without token!");
            return;
        }

        verificationStarted.current = true;
        console.log(`Verification starting for code: ${code}, token: ${sessionToken.substring(0, 5)}...`);
        
        try {
            const response = await fetch("http://localhost:3001/custom/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code, userId, sessionToken }),
            });

            if (response.ok) {
                console.log("Verification successful on server");
                setIsVerified(true);
            } else {
                const errData = await response.json();
                console.error("Verification failed on server:", errData);
                verificationStarted.current = false;
            }
        } catch (err) {
            console.error("Network error during verification:", err);
            verificationStarted.current = false;
        }
    }, [code, isVerified]);

    useEffect(() => {
        if (!mounted) return;

        const checkAutoLogin = async () => {
            const { data: session } = await authClient.getSession();
            console.log("Auto-login check, session:", session ? "Found" : "Not Found");
            
            if (session && code) {
                const sessionToken = 
                    (session as any).session?.token || 
                    (session as any).token || 
                    (session as any).sessionToken ||
                    document.cookie.split('better-auth.session_token=')?.[1]?.split(';')?.[0] ||
                    "";
                
                console.log("Extracted sessionToken:", sessionToken ? "Exists" : "MISSING");
                
                if (sessionToken) {
                    await handleAuthSuccess(session.user.id, sessionToken);
                }
            }
            setIsChecking(false);
        };
        checkAutoLogin();
    }, [code, handleAuthSuccess, mounted]);

    if (!mounted) return null;

    if (isChecking) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                <h1 className="text-xl font-medium">Checking session...</h1>
            </div>
        );
    }

    if (isVerified) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 animate-in zoom-in duration-300" />
                <h1 className="text-2xl font-bold">Authenticated Successfully!</h1>
                <p className="text-slate-500">You can now return to your terminal. This tab can be closed.</p>
            </div>
        );
    }

    return <AuthForm code={code || undefined} onAuthSuccess={handleAuthSuccess} />;
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <LoginContent />
            </Suspense>
        </div>
    );
}
