'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVault } from '@/context/VaultContext'
import { supabase } from '@/lib/supabase'
import { decryptData } from '@/lib/crypto'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Copy, Trash2, Eye, EyeOff, LogOut, Search, ShieldCheck } from 'lucide-react'
import { AddPasswordDialog } from './AddPasswordDialog'

interface VaultItem {
  id: string
  site_name: string
  site_url: string
  encrypted_blob: string
  iv: string
}

export default function Dashboard() {
  const { masterKey, setMasterKey } = useVault()
  const router = useRouter()
  const [items, setItems] = useState<VaultItem[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!masterKey) {
      router.push('/')
    } else {
      fetchVaultItems()
    }
  }, [masterKey, router])

  const fetchVaultItems = async () => {
    try {
      const { data, error } = await supabase
        .from('vault_items')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setItems(data || [])
    } catch (error) {
      toast.error("Failed to load vault")
    } finally {
      setLoading(false)
    }
  }

  const getDecryptedPassword = (item: VaultItem) => {
    if (!masterKey) return "Error";
    try {
      const jsonString = decryptData(item.encrypted_blob, item.iv, masterKey);
      const data = JSON.parse(jsonString);
      return data.password;
    } catch (e) {
      return "Decryption Failed";
    }
  }

  const getDecryptedUsername = (item: VaultItem) => {
    if (!masterKey) return "Error";
    try {
      const jsonString = decryptData(item.encrypted_blob, item.iv, masterKey);
      const data = JSON.parse(jsonString);
      return data.username;
    } catch (e) {
      return "???";
    }
  }

  const toggleReveal = (id: string) => {
    const newRevealed = new Set(revealedIds)
    if (newRevealed.has(id)) newRevealed.delete(id)
    else newRevealed.add(id)
    setRevealedIds(newRevealed)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const handleLogout = async () => {
      setMasterKey(null);
      await supabase.auth.signOut();
      router.push('/');
  }

  const filteredItems = items.filter(item => 
    item.site_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!masterKey) return null;

  return (
    // CYBER BACKGROUND
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 font-sans text-slate-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-10 h-10 text-cyan-500" />
             <div>
                <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-[family-name:var(--font-orbitron)]">
                  VAULT DASHBOARD
                </h1>
                <p className="text-xs text-slate-500 tracking-[0.2em] uppercase">Secure Uplink Established</p>
             </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
             <div className="flex-1 md:flex-none">
                <AddPasswordDialog onPasswordAdded={fetchVaultItems} />
             </div>
             <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="border-red-900/50 text-red-400 hover:bg-red-950 hover:text-red-300"
             >
                <LogOut className="h-4 w-4 mr-2"/> Disconnect
             </Button>
          </div>
        </div>

        {/* Search Bar - Dark Mode */}
        <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 flex gap-2 items-center">
                <Search className="h-5 w-5 text-slate-500" />
                <Input 
                    placeholder="Search encrypted entries..." 
                    className="border-none shadow-none focus-visible:ring-0 bg-transparent text-white placeholder:text-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </CardContent>
        </Card>

        {/* The List (Dark Cyber Table) */}
        <Card className="overflow-hidden bg-slate-900 border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader className="bg-slate-950">
                <TableRow className="border-slate-800 hover:bg-slate-900">
                  <TableHead className="text-cyan-600 font-bold uppercase tracking-wider">Site Identity</TableHead>
                  <TableHead className="text-cyan-600 font-bold uppercase tracking-wider">Username</TableHead>
                  <TableHead className="text-cyan-600 font-bold uppercase tracking-wider">Passkey</TableHead>
                  <TableHead className="text-right text-cyan-600 font-bold uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow className="border-slate-800"><TableCell colSpan={4} className="text-center h-32 text-slate-500">Decrypting Vault...</TableCell></TableRow>
                ) : filteredItems.length === 0 ? (
                   <TableRow className="border-slate-800"><TableCell colSpan={4} className="text-center h-32 text-slate-500">Vault Empty. Initialize new entry.</TableCell></TableRow>
                ) : (
                  filteredItems.map((item) => {
                      const isRevealed = revealedIds.has(item.id);
                      const password = getDecryptedPassword(item);
                      const username = getDecryptedUsername(item);

                      return (
                      <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                              <span className="text-base text-white">{item.site_name}</span>
                              <span className="text-xs text-slate-500 font-mono">{item.site_url}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-300">{username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                              <span className={`font-mono text-sm ${isRevealed ? 'text-emerald-400' : 'text-slate-600'}`}>
                                  {isRevealed ? password : "••••••••••••"}
                              </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="hover:bg-cyan-950 hover:text-cyan-400 text-slate-400" onClick={() => copyToClipboard(password)}>
                                  <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="hover:bg-purple-950 hover:text-purple-400 text-slate-400" onClick={() => toggleReveal(item.id)}>
                                  {isRevealed ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                              </Button>
                              <Button variant="ghost" size="icon" className="hover:bg-red-950 hover:text-red-400 text-slate-600" onClick={async () => {
                                  if(confirm("Delete this password?")) {
                                      await supabase.from('vault_items').delete().eq('id', item.id);
                                      fetchVaultItems();
                                      toast.success("Deleted");
                                  }
                              }}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )})
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}










