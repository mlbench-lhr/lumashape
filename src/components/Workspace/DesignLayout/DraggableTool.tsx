// DraggableTool (component)
import { Tool } from "./types";

interface DraggableToolProps {
  tool: Tool;
  readOnly?: boolean;
  actions?: React.ReactNode;
}

const DraggableTool: React.FC<DraggableToolProps> = ({
  tool,
  readOnly = false,
  actions,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(tool));
    e.dataTransfer.effectAllowed = "copy";
  };

  const depthUnit = tool.metadata?.unit ?? tool.unit;
  const depthUnitLabel = depthUnit === "inches" ? "in" : depthUnit;

  return (
    <div
      draggable={!readOnly}
      onDragStart={readOnly ? undefined : handleDragStart}
      className={`relative flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
        readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      }`}
    >
      {actions && <div className="absolute top-2 left-2 z-10">{actions}</div>}

      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
        {tool.image ? (
          <img
            src={tool.image}
            alt={tool.name}
            className="w-6 h-6 object-contain"
          />
        ) : (
          <span className="text-lg">{tool.icon}</span>
        )}
      </div>
      <div className={`flex-1 min-w-0 ${actions ? "pt-5" : ""}`}>
        <div className="mt-2 space-y-1 text-xs text-gray-600">
          <div className="flex justify-between gap-4">
            <span>Tool Brand:</span>
            <span className="text-gray-900">{tool.toolBrand || "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Tool Type:</span>
            <span className="text-gray-900">
              {tool.metadata?.toolType || "—"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>SKU/PN:</span>
            <span className="text-gray-900 truncate">
              {tool.metadata?.SKUorPartNumber || "—"}
            </span>
          </div>
          {typeof tool.metadata?.depth === "number" && (
            <div className="flex justify-between gap-4">
              <span>Depth:</span>
              <span className="text-gray-900">
                {tool.metadata.depth}
                {depthUnitLabel ? (
                  <span className="ml-1 text-gray-900">{depthUnitLabel}</span>
                ) : null}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraggableTool;
