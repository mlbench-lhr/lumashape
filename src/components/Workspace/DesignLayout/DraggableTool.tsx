import { Tool } from "./types";

interface DraggableToolProps {
  tool: Tool;
}

const DraggableTool: React.FC<DraggableToolProps> = ({ tool }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(tool));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
        {tool.image ? (
          <img src={tool.image} alt={tool.name} className="w-6 h-6 object-contain" />
        ) : (
          <span className="text-lg">{tool.icon}</span>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{tool.name}</span>
          <div className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-medium">
            {tool.brand}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DraggableTool;