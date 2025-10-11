import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'

export default function CustomConnectButton() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()

  const handleClick = () => {
    // Always open the AppKit modal - this gives access to:
    // - Network selection
    // - Profile/Account management  
    // - Disconnect option
    // - All the same functionality as the default button
    open()
  }

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <button
      onClick={handleClick}
      className="group relative px-6 py-3 bg-black text-white rounded-lg font-medium transition-all duration-200 hover:bg-gray-800 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-black/20"
    >
      <span className="relative z-10">
        {isConnected ? (
          <span>{formatAddress(address)}</span>
        ) : (
          'Connect Wallet'
        )}
      </span>
      
      {/* Subtle background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
    </button>
  )
}
