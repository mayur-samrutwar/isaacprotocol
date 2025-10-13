import React from 'react'
import LeftMenu from './LeftMenu'
import CustomConnectButton from './CustomConnectButton'

export default function Navbar() {
  return (
    <>
      {/* Top navigation bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-end pt-2">
          <CustomConnectButton />
        </div>
      </div>

      {/* Left side menu (mounted via Navbar for consistency across pages) */}
      <LeftMenu />
    </>
  )
}


