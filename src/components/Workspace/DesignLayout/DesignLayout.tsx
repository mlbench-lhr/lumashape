'use client'
import React, { useState } from 'react'
import Header from './Header'
import ControlBar from './ControlBar'
import OptionsBar from './OptionsBar'
import Canvas from './Canvas'
import Sidebar from './Sidebar'
import { DroppedTool } from './types'

function DesignLayout() {
  const [droppedTools, setDroppedTools] = useState<DroppedTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header />
      <ControlBar />
      <OptionsBar />
      <div className="flex flex-1 overflow-hidden">
        <Canvas
          droppedTools={droppedTools}
          setDroppedTools={setDroppedTools}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
        />
        <Sidebar
          droppedTools={droppedTools}
          selectedTool={selectedTool}
        />
      </div>
    </div>
  )
}

export default DesignLayout
