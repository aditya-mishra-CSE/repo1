
import React, { useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import {
  FaPen,
  FaEraser,
  FaUndo,
  FaRedo,
  FaTrash,
  FaDownload,
  FaFileImport
} from "react-icons/fa";

const White = () => {
  const canvasRef = useRef(null);

  // States
  const [tool, setTool] = useState("pen"); // pen | eraser
  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [showColors, setShowColors] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#FFA500", "#800080"];

  // Cursor styles
  const cursorStyles = {
    pen: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
    eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${eraserSize/2} ${eraserSize/2}, auto`
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
    <div className={`flex justify-center items-center min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`flex ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-4 relative`}>
        {/* Whiteboard Canvas */}
        <ReactSketchCanvas
          ref={canvasRef}
          strokeColor={tool === "pen" ? penColor : "#FFFFFF"}
          strokeWidth={penSize}
          eraserWidth={eraserSize}
          backgroundImage={backgroundImage}
          canvasColor={darkMode ? "#1F2937" : "white"}
          style={{
            borderRadius: "12px",
            border: `2px solid ${darkMode ? "#374151" : "#e5e7eb"}`,
            cursor: cursorStyles[tool],
          }}
          width="800px"
          height="500px"
        />

        {/* Toolbar */}
        <div className="flex flex-col items-center ml-4 space-y-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full text-gray-700 hover:text-yellow-500"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* Pen */}
          <button
            onClick={() => {
              setTool("pen");
              canvasRef.current.eraseMode(false);
            }}
            className={`p-2 rounded-full ${
              tool === "pen"
                ? darkMode ? "bg-gray-700 text-blue-400" : "bg-gray-300 text-blue-600"
                : darkMode ? "text-gray-300" : "text-gray-700"
            } hover:text-blue-500`}
          >
            <FaPen size={20} />
          </button>

          {/* Pen Size Slider */}
          {tool === "pen" && (
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-400 mb-1">Pen Size</label>
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
            onClick={() => {
              setTool("eraser");
              canvasRef.current.eraseMode(true);
            }}
            className={`p-2 rounded-full ${
              tool === "eraser"
                ? darkMode ? "bg-gray-700 text-blue-400" : "bg-gray-300 text-blue-600"
                : darkMode ? "text-gray-300" : "text-gray-700"
            } hover:text-blue-500`}
          >
            <FaEraser size={20} />
          </button>

          {/* Eraser Size Slider */}
          {tool === "eraser" && (
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-400 mb-1">Eraser Size</label>
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
            <button
              onClick={() => setShowColors(!showColors)}
              className="w-6 h-6 rounded-full border border-gray-400"
              style={{ backgroundColor: penColor || "#000000" }}
            />
            {showColors && (
              <div className="absolute left-1/2 mt-1 -translate-x-1/2 bg-white border rounded shadow-md p-2 flex flex-col gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setPenColor(color);
                      setTool("pen");
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
            onClick={() => {
              canvasRef.current.clearCanvas();
              setBackgroundImage(null);
            }}
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

          {/* Import Image */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setBackgroundImage(reader.result);
              reader.readAsDataURL(file);
            }}
            className="hidden"
            id="import-image"
          />
          <label
            htmlFor="import-image"
            className="p-2 rounded-full text-gray-700 hover:text-purple-500 cursor-pointer"
          >
            <FaFileImport size={20} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default White;
