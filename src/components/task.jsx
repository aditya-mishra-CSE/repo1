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

//it is of pure tailwindcss and also have whiteboard/blackboard feature
const Task = () => {
    const canvasRef = useRef(null);

    const [tool, setTool] = useState("pen"); // "pen" | "eraser"
    const [penColor, setPenColor] = useState("#000000");
    const [penSize, setPenSize] = useState(2);
    const [eraserSize, setEraserSize] = useState(20);
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [showColors, setShowColors] = useState(false);

    const colors = [
        "#000000", "#FF0000", "#008000", "#0000FF",
        "#f3f4f6", "#FFCDD2", "#FFF59D", "#BBDEFB"
    ];

    const cursorStyles = {
        pen: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
        eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${eraserSize / 2} ${eraserSize / 2}, auto`
    };

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

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
        document.body.classList.toggle("dark");
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
            <div className="flex flex-row bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 gap-4 transition-colors duration-300">
                {/* Canvas */}
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl transition-colors duration-300">
                    <ReactSketchCanvas
                        ref={canvasRef}
                        strokeColor={tool === "pen" ? penColor : "#FFFFFF"}
                        strokeWidth={penSize}
                        eraserWidth={eraserSize}
                        backgroundImage={backgroundImage}
                        canvasColor={darkMode ? "#0d1117" : "#ffffff"}
                        style={{
                            borderRadius: "12px",
                            cursor: cursorStyles[tool],
                        }}
                        width="800px"
                        height="500px"
                    />
                </div>
{/* Toolbar */}
<div className="flex flex-col items-center gap-4 p-2 rounded-lg 
                bg-gray-100 dark:bg-gray-700 transition-colors duration-300">

  {/* Dark Mode Toggle */}
  <button
    onClick={toggleDarkMode}
    className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
  >
    {darkMode ? "☀️" : "🌙"}
  </button>

  {/* Pen */}
  <button
    onClick={() => {
      setTool("pen");
      canvasRef.current.eraseMode(false);
    }}
    className={`p-2 rounded-full transition-colors ${
      tool === "pen"
        ? "bg-blue-100 dark:bg-gray-800 text-blue-600 dark:text-white"
        : "text-gray-700 dark:text-white hover:text-blue-500"
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
    className={`p-2 rounded-full transition-colors ${
      tool === "eraser"
        ? "bg-blue-100 dark:bg-gray-800 text-blue-600 dark:text-blue-300"
        : "text-gray-700 dark:text-gray-300 hover:text-blue-500"
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
    <button
      onClick={() => setShowColors(!showColors)}
      className="w-6 h-6 rounded-full border border-gray-400"
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
              className={`w-6 h-6 rounded-full border-2 transition-colors ${
                penColor === color
                  ? "border-black dark:border-white"
                  : "border-transparent"
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
    className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
  >
    <FaUndo size={20} />
  </button>

  {/* Redo */}
  <button
    onClick={() => canvasRef.current.redo()}
    className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors"
  >
    <FaRedo size={20} />
  </button>

  {/* Clear */}
  <button
    onClick={() => {
      canvasRef.current.clearCanvas();
      setBackgroundImage(null);
    }}
    className="p-2 rounded-full hover:text-red-500 text-gray-700 dark:text-gray-300 transition-colors"
  >
    <FaTrash size={20} />
  </button>

  {/* Export */}
  <button
    onClick={handleExport}
    className="p-2 rounded-full hover:text-green-500 text-gray-700 dark:text-gray-300 transition-colors"
  >
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
    className="p-2 rounded-full cursor-pointer hover:text-purple-500 text-gray-700 dark:text-gray-300 transition-colors"
  >
    <FaFileImport size={20} />
  </label>
</div>

            </div>
        </div>
    );
};

export default Task;
