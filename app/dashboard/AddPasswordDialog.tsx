'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from '@/lib/supabase'
import { encryptData } from '@/lib/crypto'
import { useVault } from '@/context/VaultContext'
import { Plus } from 'lucide-react'

interface Props {
  onPasswordAdded: () => void
}

export function AddPasswordDialog({ onPasswordAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [siteName, setSiteName] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { masterKey } = useVault()

  const handleSave = async () => {
    if (!siteName || !password || !masterKey) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)

    try {
      const secretPayload = JSON.stringify({
        username: username,
        password: password
      })

      const { encrypted, iv } = encryptData(secretPayload, masterKey)

      const { error } = await supabase.from('vault_items').insert({
        site_name: siteName,
        site_url: siteUrl,
        encrypted_blob: encrypted,
        iv: iv,
      })

      if (error) throw error

      toast.success("Password Encrypted & Saved")
      setOpen(false)
      
      setSiteName('')
      setSiteUrl('')
      setUsername('')
      setPassword('')
      
      onPasswordAdded()

    } catch (error: any) {
      toast.error("Failed to save: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.5)] border-none">
            <Plus className="mr-2 h-4 w-4" /> Add Entry
        </Button>
      </DialogTrigger>
      {/* DARK MODE DIALOG CONTENT */}
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Add New Entry</DialogTitle>
          <DialogDescription className="text-slate-400">
            Data is encrypted locally before transmission.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="site" className="text-slate-300">Site Name</Label>
            <Input
              id="site"
              placeholder="e.g. Netflix"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-slate-300">URL</Label>
            <Input
              id="url"
              placeholder="e.g. netflix.com"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-slate-300">Username</Label>
            <Input
              id="username"
              placeholder="email@example.com"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">Password</Label>
            <Input
              id="password"
              type="text" 
              placeholder="Secret123"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500 font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
            {loading ? "Encrypting..." : "Save to Vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}