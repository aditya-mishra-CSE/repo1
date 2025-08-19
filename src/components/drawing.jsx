
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

const Drawing = () => {
  const canvasRef = useRef(null);

  // Tool & pen states
  const [tool, setTool] = useState("pen"); // "pen" | "eraser"
  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showColors, setShowColors] = useState(false);

  // Pen colors depending on mode
//   const colors = darkMode
//     ? ["#f3f4f6", "#FFCDD2", "#FFF59D", "#BBDEFB"] // light colors for blackboard
//     : ["#000000", "#FF0000", "#008000", "#0000FF"]; // dark colors for whiteboard

const colors = [
  "#000000", // black
  "#FF0000", // red
  "#008000", // green
  "#0000FF", // blue
  "#f3f4f6", // light gray
  "#FFCDD2", // pink
  "#FFF59D", // yellow
  "#BBDEFB"  // light blue
];


  // Cursor styles
  const cursorStyles = {
    pen:
      "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
    eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${eraserSize / 2} ${eraserSize / 2}, auto`
  };

  // Export canvas
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

  // Dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark");
    // // Update pen color default in dark mode
    // if (!darkMode) setPenColor("#f3f4f6"); // light pen on blackboard
    // else setPenColor("#000000"); // dark pen on whiteboard
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 relative">
        <div className="whiteboard-container">
            {/* Canvas */}
        <div className="canvas-wrapper">
          <ReactSketchCanvas
            ref={canvasRef}
            strokeColor={tool === "pen" ? penColor : "#FFFFFF"}
            strokeWidth={penSize}
            eraserWidth={eraserSize}
            backgroundImage={backgroundImage}
            canvasColor="var(--canvas-bg)"
            style={{
              borderRadius: "12px",
              cursor: cursorStyles[tool]
            }}
            width="800px"
            height="500px"
          />
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          {/* Dark Mode Toggle */}
          <button onClick={toggleDarkMode} className="button p-2 rounded-full">
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* Pen */}
          <button
            onClick={() => {
              setTool("pen");
              canvasRef.current.eraseMode(false);
            }}
            className={`button p-2 rounded-full hover:text-blue-500 ${
            tool === "pen"
              ? "bg-blue-100 dark:bg-gray-700 text-blue-600 dark:text-white"
              : "text-gray-700 dark:text-white"
            }`}
          >
            <FaPen size={20} />
          </button>

          {/* Pen Size */}
          {tool === "pen" && (
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">Pen Size</label>
              <input
                type="range"
                min="1"
                max="20"
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">{penSize}px</span>
            </div>
          )}

          {/* Eraser */}
          <button
            onClick={() => {
              setTool("eraser");
              canvasRef.current.eraseMode(true);
            }}
            className={`button p-2 rounded-full hover:text-blue-500 ${
              tool === "eraser" ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"
            }`}
          >
            <FaEraser size={20} />
          </button>

          {/* Eraser Size */}
          {tool === "eraser" && (
            <div className="flex flex-col items-center">
              <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">Eraser Size</label>
              <input
                type="range"
                min="5"
                max="50"
                value={eraserSize}
                onChange={(e) => setEraserSize(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">{eraserSize}px</span>
            </div>
          )}

          {/* Color Picker */}
         
        <div className="relative mt-2">
        {/* Button showing current color */}
        <button
            onClick={() => setShowColors(!showColors)}
            className="w-6 h-6 rounded-full border border-gray-400 button"
            style={{ backgroundColor: penColor }}
        />

        {showColors && (
            <div className="absolute left-1/2 mt-1 -translate-x-1/2 bg-white dark:bg-gray-800 border rounded shadow-md p-2 w-max">
            
            <div className="grid grid-cols-3 gap-2">
                {colors.map((color) => (
                <button
                    key={color}
                    onClick={() => {
                    setPenColor(color);
                    setTool("pen");
                    setShowColors(false);
                    }}
                    className={`w-6 h-6 rounded-full border-2 ${
                    penColor === color ? "border-black dark:border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                />
                ))}
            </div>

            </div>
        )}
        </div>


          {/* Undo */}
          <button
            onClick={() => canvasRef.current.undo()}
            className="button p-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-blue-500"
          >
            <FaUndo size={20} />
          </button>

          {/* Redo */}
          <button
            onClick={() => canvasRef.current.redo()}
            className="button p-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-blue-500"
          >
            <FaRedo size={20} />
          </button>

          {/* Clear */}
          <button
            onClick={() => {
              canvasRef.current.clearCanvas();
              setBackgroundImage(null);
            }}
            className="button p-2 rounded-full hover:text-red-500"
          >
            <FaTrash size={20} />
          </button>

          {/* Export */}
          <button onClick={handleExport} className="button p-2 rounded-full hover:text-green-500">
            <FaDownload size={20} />
          </button>

          {/* Import */}
          <input
            type="file"
            accept="image/*"
            id="import-image"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setBackgroundImage(reader.result);
              reader.readAsDataURL(file);
            }}
          />
          <label
            htmlFor="import-image"
            className="button p-2 hover:text-purple-500 rounded-full cursor-pointer"
          >
            <FaFileImport size={20} />
          </label>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Drawing;


