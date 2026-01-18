'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner" // <--- Matches your layout.tsx
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { hashPassword, generateSalt } from "@/lib/crypto"
import { useVault } from "@/context/VaultContext"

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

      // 1. Create the Login Hash (ID Card)
      const loginHash = hashPassword(password, email);
      console.log("1. Login Hash created");

      if (isLogin) {
        // ==========================
        //      LOGIN LOGIC
        // ==========================
        console.log("2. Attempting Supabase Login..."); 
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: loginHash, 
        })

        if (error) {
            console.error("Supabase Login Error:", error.message);
            throw error;
        }

        console.log("3. Login Success. User ID:", data.user?.id);

        const userSalt = data.user?.user_metadata?.encryption_salt;
        
        if (!userSalt) {
             toast.error("Critical Error: Encryption Salt missing.");
             return;
        }

        // Re-create the Gold Key
        const finalMasterKey = hashPassword(password, userSalt);
        
        setMasterKey(finalMasterKey);
        toast.success("Vault Unlocked");
        router.push('/dashboard');

      } else {
        // ==========================
        //      SIGNUP LOGIC
        // ==========================
        console.log("2. Starting Signup...");

        // A. Generate a new random Salt
        const newSalt = generateSalt();

        // B. Register the user with Supabase
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password: loginHash, // Send the Hashed Password
          options: {
            data: {
              encryption_salt: newSalt, // Save the Salt publically
            },
            emailRedirectTo: `${window.location.origin}/`,
          },
        })

        if (error) {
            console.error("Signup Error:", error.message);
            throw error;
        }

        console.log("4. Signup Success!", data);
        
        // --- IMPROVED ALERT ---
        toast.success("Signup successful!", {
            description: "Please check your email to confirm your account before logging in.",
            duration: 6000, 
        });
        
        // Clear password and switch to login mode
        setPassword('');
        setIsLogin(true);
      }

    } catch (err: any) {
      console.error("CATCH BLOCK ERROR:", err);
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Unlock Vault": "Create Master Vault"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Enter Credentials to decrypt your Data." : "Set a Master Password."}
          </CardDescription>
        </CardHeader>
        
        {/* Fixed typo: space-y-4 instead of space=-y-4 */}
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {/* Added Label Text */}
            <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Master Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={handleAuth} disabled={loading}>
            {loading ? "Processing...": (isLogin ? "Unlock Vault" : "Create Account")}
          </Button>
          <Button variant="ghost" className="w-full text-sm text-gray-500" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "New here? Create a Vault" : "Already have a Vault? Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}








