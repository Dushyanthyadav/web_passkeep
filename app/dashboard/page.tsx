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
import { Copy, Trash2, Eye, EyeOff, LogOut, Search } from 'lucide-react'
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

  // 1. SECURITY CHECK: If no Master Key in memory, kick them out.
  useEffect(() => {
    if (!masterKey) {
      router.push('/')
    } else {
      fetchVaultItems()
    }
  }, [masterKey, router])

  // 2. Fetch Data (Only gets encrypted blobs)
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

  // 3. Helper to Decrypt on the fly
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

  // 4. Toggle "Eye" icon
  const toggleReveal = (id: string) => {
    const newRevealed = new Set(revealedIds)
    if (newRevealed.has(id)) newRevealed.delete(id)
    else newRevealed.add(id)
    setRevealedIds(newRevealed)
  }

  // 5. Copy to Clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const handleLogout = async () => {
      setMasterKey(null); // Wipe memory
      await supabase.auth.signOut();
      router.push('/');
  }

  // Filter items based on search
  const filteredItems = items.filter(item => 
    item.site_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!masterKey) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">My Vault</h1>
          <div className="flex gap-2 w-full md:w-auto">
             <div className="flex-1 md:flex-none">
                <AddPasswordDialog onPasswordAdded={fetchVaultItems} />
             </div>
             <Button variant="outline" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2"/> Lock</Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
            <CardContent className="p-4 flex gap-2 items-center">
                <Search className="h-5 w-5 text-gray-400" />
                <Input 
                    placeholder="Search passwords..." 
                    className="border-none shadow-none focus-visible:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </CardContent>
        </Card>

        {/* The List (Clean Version without comments in Table) */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow><TableCell colSpan={4} className="text-center h-24">Loading Vault...</TableCell></TableRow>
                ) : filteredItems.length === 0 ? (
                   <TableRow><TableCell colSpan={4} className="text-center h-24 text-gray-500">No passwords found. Add one!</TableCell></TableRow>
                ) : (
                  filteredItems.map((item) => {
                      const isRevealed = revealedIds.has(item.id);
                      const password = getDecryptedPassword(item);
                      const username = getDecryptedUsername(item);

                      return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                              <span className="text-base">{item.site_name}</span>
                              <span className="text-xs text-gray-400">{item.site_url}</span>
                          </div>
                        </TableCell>
                        <TableCell>{username}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">
                                  {isRevealed ? password : "••••••••••••"}
                              </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => copyToClipboard(password)}>
                                  <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => toggleReveal(item.id)}>
                                  {isRevealed ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={async () => {
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












