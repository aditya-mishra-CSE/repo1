import React, { useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import {
  FaPen,
  FaEraser,
  FaUndo,
  FaRedo,
  FaTrash,
  FaDownload,
  FaFileImport,
} from "react-icons/fa";

const ReDraw = () => {
  const canvasRef = useRef(null);

  // Tool & pen states
  const [tool, setTool] = useState("pen");
  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showColors, setShowColors] = useState(false);

  const colors = [
    "#000000",
    "#FF0000",
    "#008000",
    "#0000FF",
    "#f3f4f6",
    "#FFCDD2",
    "#FFF59D",
    "#BBDEFB",
  ];

  // Cursor styles
  const cursorStyles = {
    pen:
      "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
    eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${eraserSize / 2} ${eraserSize / 2}, auto`,
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
    document.body.classList.toggle("dark-mode");
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 relative w-[1100px] h-[600px]">
        {/* Whiteboard container */}
        <div className="flex w-full h-full gap-2">
          {/* Canvas */}
          <div className="flex-1 h-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
            <ReactSketchCanvas
              ref={canvasRef}
              strokeColor={tool === "pen" ? penColor : "#FFFFFF"}
              strokeWidth={penSize}
              eraserWidth={eraserSize}
              backgroundImage={backgroundImage}
              canvasColor="transparent"
              style={{
                borderRadius: "12px",
                cursor: cursorStyles[tool],
                width: "100%",
                height: "100%",
              }}
            />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 h-full w-24 items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            {/* Pen */}
            <button
              onClick={() => {
                setTool("pen");
                canvasRef.current.eraseMode(false);
              }}
              className={`p-2 rounded-full transition ${
                tool === "pen"
                  ? "bg-blue-100 dark:bg-gray-600 text-blue-600"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-500"
              }`}
            >
              <FaPen size={20} />
            </button>

            {/* Pen Size */}
            {tool === "pen" && (
              <div className="flex flex-col items-center">
                <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Pen Size
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={penSize}
                  onChange={(e) => setPenSize(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {penSize}px
                </span>
              </div>
            )}

            {/* Eraser */}
            <button
              onClick={() => {
                setTool("eraser");
                canvasRef.current.eraseMode(true);
              }}
              className={`p-2 rounded-full transition ${
                tool === "eraser"
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-500"
              }`}
            >
              <FaEraser size={20} />
            </button>

            {/* Eraser Size */}
            {tool === "eraser" && (
              <div className="flex flex-col items-center">
                <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                  Eraser Size
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={eraserSize}
                  onChange={(e) => setEraserSize(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {eraserSize}px
                </span>
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
                        className={`w-6 h-6 rounded-full border-2 ${
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
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-blue-500 transition"
            >
              <FaUndo size={20} />
            </button>

            {/* Redo */}
            <button
              onClick={() => canvasRef.current.redo()}
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:text-blue-500 transition"
            >
              <FaRedo size={20} />
            </button>

            {/* Clear */}
            <button
              onClick={() => {
                canvasRef.current.clearCanvas();
                setBackgroundImage(null);
              }}
              className="p-2 rounded-full hover:text-red-500 transition"
            >
              <FaTrash size={20} />
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className="p-2 rounded-full hover:text-green-500 transition"
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
              className="p-2 rounded-full cursor-pointer hover:text-purple-500 transition"
            >
              <FaFileImport size={20} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReDraw;
