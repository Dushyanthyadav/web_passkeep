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
      // 1. Prepare the Secret Package
      const secretPayload = JSON.stringify({
        username: username,
        password: password
      })

      // 2. Encrypt it using the Master Key (Client-Side Only!)
      const { encrypted, iv } = encryptData(secretPayload, masterKey)

      // 3. Send ONLY the encrypted blob to Supabase
      const { error } = await supabase.from('vault_items').insert({
        site_name: siteName,
        site_url: siteUrl,
        encrypted_blob: encrypted,
        iv: iv,
      })

      if (error) throw error

      toast.success("Password saved securely!")
      setOpen(false)
      
      // Reset form
      setSiteName('')
      setSiteUrl('')
      setUsername('')
      setPassword('')
      
      // Refresh the list
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
        <Button className="w-full md:w-auto"><Plus className="mr-2 h-4 w-4" /> Add Password</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Add New Password</DialogTitle>
          <DialogDescription>
            This will be encrypted in your browser before being sent to the database.
          </DialogDescription>
        </DialogHeader>
        
        {/* MOBILE FRIENDLY: Stacked Inputs */}
        <div className="flex flex-col gap-4 py-4">
          
          <div className="space-y-2">
            <Label htmlFor="site">Site Name</Label>
            <Input
              id="site"
              placeholder="Netflix"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="netflix.com"
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="email@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="text" // Visible so user can see what they type before saving
              placeholder="Secret123"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Encrypting..." : "Save Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}