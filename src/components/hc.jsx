import React, { useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import {
  FaPen,
  FaEraser,
  FaUndo,
  FaRedo,
  FaTrash,
  FaDownload,
} from "react-icons/fa";

const Whiteboard = () => {
  const canvasRef = useRef(null);

  // States for tool and pen color
  const [tool, setTool] = useState("pen"); // pen | eraser
  const [penColor, setPenColor] = useState("#000000"); // default black
  const [penSize, setPenSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(20);

  const [showColors, setShowColors] = useState(false);

  const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#FFA500", "#800080"];

// Cursor styles (pen/eraser)
  const cursorStyles = {
    pen: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
    eraser: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><rect x=%224%22 y=%224%22 width=%2216%22 height=%2216%22 fill=%22white%22 stroke=%22black%22 stroke-width=%222%22/></svg>') 0 24, auto",
  };

  // Export canvas as image
  const handleExport = () => {
    canvasRef.current
      .exportImage("png")
      .then((data) => {
        const link = document.createElement("a");
        link.href = data;
        link.download = "whiteboard.png";
        link.click();
      })
      .catch((e) => console.log(e));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="flex bg-white rounded-xl shadow-lg p-4 relative">
        {/* Whiteboard Canvas */}
        <ReactSketchCanvas
        ref={canvasRef}
        strokeColor={tool === "pen" ? penColor : "#FFFFFF"}
        strokeWidth={tool === "pen" ? {penSize} : {eraserSize}}
        canvasColor="white"
        style={{
          borderRadius: "12px",
          border: "2px solid #e5e7eb",
          cursor: cursorStyles[tool],
        }}
        width="800px"
        height="500px"

      />


        {/* Toolbar */}
        <div className="flex flex-col items-center ml-4 space-y-4">
          
          {/* Pen */}
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded-full ${
              tool === "pen" ? "bg-gray-300 text-blue-600" : "text-gray-700"
            } hover:text-blue-500`}
          >
            <FaPen size={20} />
          </button>

          {/* Pen Size Slider */}
          {tool === "pen" && (
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-600 mb-1">Pen Size</label>
              <input
                type="range"
                min="1"
                max="20"
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs">{penSize}px</span>
            </div>
          )}

          {/* Eraser */}
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-full ${
              tool === "eraser" ? "bg-gray-300 text-blue-600" : "text-gray-700"
            } hover:text-blue-500`}
          >
            <FaEraser size={20} />
          </button>

          {/* Eraser Size Slider */}
          {tool === "eraser" && (
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-600 mb-1">Eraser Size</label>
              <input
                type="range"
                min="5"
                max="50"
                value={eraserSize}
                onChange={(e) => setEraserSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs">{eraserSize}px</span>
            </div>
          )}

            

          {/* Color Picker */}
          <div className="relative mt-2">
            {/* Button showing current color */}
            <button
              onClick={() => setShowColors(!showColors)}
              className="w-6 h-6 rounded-full border border-gray-400"
              style={{ backgroundColor: penColor || "#000000" }}
            />

            {/* Color options popover */}
            {showColors && (
              <div className="absolute right-12 top-0 bg-white border rounded shadow-md p-2 flex gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setPenColor(color);
                      setTool("pen"); // switch back to pen when selecting color
                      setShowColors(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 ${
                      penColor === color ? "border-black" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Undo */}
          <button
            onClick={() => canvasRef.current.undo()}
            className="p-2 rounded-full text-gray-700 hover:text-blue-500"
          >
            <FaUndo size={20} />
          </button>

          {/* Redo */}
          <button
            onClick={() => canvasRef.current.redo()}
            className="p-2 rounded-full text-gray-700 hover:text-blue-500"
          >
            <FaRedo size={20} />
          </button>

          {/* Clear */}
          <button
            onClick={() => canvasRef.current.clearCanvas()}
            className="p-2 rounded-full text-gray-700 hover:text-red-500"
          >
            <FaTrash size={20} />
          </button>

          {/* Save */}
          <button
            onClick={handleExport}
            className="p-2 rounded-full text-gray-700 hover:text-green-500"
          >
            <FaDownload size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;