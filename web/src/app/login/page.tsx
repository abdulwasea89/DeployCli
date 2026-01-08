"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { useState, Suspense } from "react";
import { CheckCircle2 } from "lucide-react";

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const code = searchParams.get("CODE");
    const [isVerified, setIsVerified] = useState(false);

    const handleAuthSuccess = async (userId: string, sessionToken: string) => {
        if (code) {
            // Verify the code with the backend
            try {
                const response = await fetch("http://localhost:3001/custom/auth/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, userId, sessionToken }),
                });

                if (response.ok) {
                    setIsVerified(true);
                }
            } catch (err) {
                console.error("Failed to verify code:", err);
            }
        } else {
            // If no code, just show success
            setIsVerified(true);
        }
    };

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
