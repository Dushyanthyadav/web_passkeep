'use client'

import { createContext, useContext, useState, ReactNode } from "react"

interface VaultContextType {
    masterKey: string | null
    setMasterKey: (key: string | null) => void
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export function VaultProvider({children}: {children: ReactNode}) {
    const [masterKey, setMasterKey] = useState<string | null>(null)

    return (
        <VaultContext.Provider value={{masterKey, setMasterKey}}>
            {children}
        </VaultContext.Provider>
    )
}

export function useVault() {
    const context = useContext(VaultContext)
    if (context === undefined) {
        throw new Error('useVault must be used within a VaultProvider')
    }
    return context
}