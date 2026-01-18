// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//       <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={100}
//           height={20}
//           priority
//         />
//         <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//           <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//             To get started, edit the page.tsx file.
//           </h1>
//           <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//             Looking for a starting point or more instructions? Head over to{" "}
//             <a
//               href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Templates
//             </a>{" "}
//             or the{" "}
//             <a
//               href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//               className="font-medium text-zinc-950 dark:text-zinc-50"
//             >
//               Learning
//             </a>{" "}
//             center.
//           </p>
//         </div>
//         <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//           <a
//             className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={16}
//               height={16}
//             />
//             Deploy Now
//           </a>
//           <a
//             className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Documentation
//           </a>
//         </div>
//       </main>
//     </div>
//   );
// }

'use client'

import { useState } from "react"
import {Button} from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
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
  const {setMasterKey} = useVault()

  const handleAuth = async () => {
    setLoading(true) 

    try {
      if (!email || !password) {
        toast.error("Please enter both email and password")
        setLoading(false)
        return
      }

      const loginHash = hashPassword(password, email)

      if (isLogin) {
        const {data, error} = await supabase.auth.signInWithPassword({
          email: email,
          password: loginHash,
        })

        if (error) throw error;

        const userSalt = data.user.user_metadata?.encrypted_salt;

        if (!userSalt){
          toast.error("Critical Error: Encryption Salt missing.");
          return;
        }

        const finalMasterKey = hashPassword(password, userSalt);

        setMasterKey(finalMasterKey);
        toast.success("Vault Unlocked");
        router.push('/dashboard');
      } else {
        //  signup logic  

        const newSalt = generateSalt();

        const {data, error} = await supabase.auth.signUp ({
          email: email,
          password: loginHash,
          options: {
            data: {
              encryption_salt: newSalt,
            },
          },
        })

        if (error) throw error;

        toast.success("Account created! You can now log in.");

      }
    } catch (err: any) {
      toast.error(err.message || "something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Unlock Vault": "Create Master Vault"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Enter Credentials to decrypt your Data." : "Set a Master Password."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space=-y-4">
          <div className="space-y-2">
            <Label htmlFor="email"></Label>
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
              placeholder="........."
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

























