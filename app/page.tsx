'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { hashPassword, generateSalt } from "@/lib/crypto"
import { useVault } from "@/context/VaultContext"
import { ShieldCheck } from 'lucide-react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { setMasterKey } = useVault()

  const handleAuth = async () => {
    setLoading(true)
    console.log("--- START AUTH ---"); 
    
    try {
      if (!email || !password) {
        toast.error("Please enter both email and password")
        setLoading(false)
        return
      }

      const loginHash = hashPassword(password, email);

      if (isLogin) {
        // ==========================
        //      LOGIN LOGIC
        // ==========================
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: loginHash, 
        })

        if (error) throw error;

        const userSalt = data.user?.user_metadata?.encryption_salt;
        
        if (!userSalt) {
             toast.error("Critical Error: Encryption Salt missing.");
             return;
        }

        const finalMasterKey = hashPassword(password, userSalt);
        
        setMasterKey(finalMasterKey);
        toast.success("Vault Unlocked");
        router.push('/dashboard');

      } else {
        // ==========================
        //      SIGNUP LOGIC
        // ==========================
        const newSalt = generateSalt();

        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: loginHash,
          options: {
            data: { encryption_salt: newSalt },
            emailRedirectTo: `${window.location.origin}/`,
          },
        })

        if (error) throw error;
        
        toast.success("Signup successful!", {
            description: "Check your email to confirm your account.",
            duration: 6000, 
        });
        
        setPassword('');
        setIsLogin(true);
      }

    } catch (err: any) {
      console.error("Auth Error:", err);
      
      // --- NEW: SPECIFIC ERROR HANDLING ---
      if (err.message.includes("already registered") || err.message.includes("User already registered")) {
          toast.error("Email Already Registered", {
              description: "This email is already in use. Please switch to Login.",
              duration: 5000,
          });
      } else if (err.message.includes("Invalid login")) {
          toast.error("Access Denied", {
              description: "Incorrect Email or Password.",
          });
      } else {
          // Fallback for other errors
          toast.error(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    // CYBER BACKGROUND: Dark Slate 950
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 space-y-8">
      
      {/* --- BRANDING HEADER --- */}
      <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center justify-center gap-3 mb-2">
            <ShieldCheck className="w-12 h-12 text-cyan-400" />
            <h1 className="text-5xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] font-[family-name:var(--font-orbitron)]">
              PASSKEEP
            </h1>
        </div>
        <p className="text-cyan-600 font-mono text-xs md:text-sm tracking-[0.3em] uppercase opacity-80">
          Zero Knowledge Encryption
        </p>
      </div>

      <Card className="w-full max-w-md border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">
            {isLogin ? "Access Terminal": "Initialize Vault"}
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            {isLogin ? "Decrypt your personal data." : "Set a secure master password."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">Email Identity</Label>
              <Input
                id="email"
                type="email"
                placeholder="operative@passkeep.com"
                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Master Key</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••••••"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(8,145,178,0.4)] transition-all" 
            onClick={handleAuth} 
            disabled={loading}
          >
            {loading ? "PROCESSING..." : (isLogin ? "UNLOCK SYSTEM" : "ESTABLISH UPLINK")}
          </Button>
          <Button variant="ghost" className="w-full text-sm text-slate-500 hover:text-cyan-400 hover:bg-transparent transition-colors" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "New user? Create Identification" : "Existing user? Login"}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="fixed bottom-4 text-[10px] text-slate-700 font-mono">
        SECURE CONNECTION // ENCRYPTED
      </div>
    </div>
  )
}




