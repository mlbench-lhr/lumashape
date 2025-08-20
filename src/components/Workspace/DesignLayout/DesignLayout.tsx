import React from 'react'
import Header from './Header'
import ControlBar from './ControlBar'
import OptionsBar from './OptionsBar'
import Canvas from './Canvas'
import Sidebar from './Sidebar'

function DesignLayout() {
  return (
   <div className="h-screen flex flex-col bg-gray-100">
      <Header />
      <ControlBar />
      <OptionsBar />
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        <Sidebar />
      </div>
    </div>
  )
}

export default DesignLayout
