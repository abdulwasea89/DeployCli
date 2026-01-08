"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LogOut } from "lucide-react";
import LoginPage from "./login/page";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const sessionData = await authClient.getSession();
      setSession(sessionData);
      setLoading(false);
    };
    checkSession();
  }, []);

  const handleLogout = async () => {
    await authClient.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="w-[400px] shadow-xl border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              Already Logged In
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">{session.user.name || "User"}</p>
              <p className="text-sm text-slate-500">{session.user.email}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-slate-600 mb-3">
                Your web session is active. You can now use the terminal or continue browsing.
              </p>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <LoginPage />;
}
