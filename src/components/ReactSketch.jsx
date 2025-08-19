// import React, { useRef, useState } from "react";
// import { ReactSketchCanvas } from "react-sketch-canvas";
// import {
//   FaUndo,
//   FaRedo,
//   FaEraser,
//   FaSave,
//   FaTrash,
//   FaPalette,
//   FaPen,
// } from "react-icons/fa";

// const canvasStyles = {
//   border: "1px solid #e5e7eb",
//   borderRadius: "12px",
//   width: "100%",
//   height: "500px",
//   background: "white",
// };

// export default function ReactSketch() {
//   const canvasRef = useRef(null);

//   const [penColor, setPenColor] = useState("#000000");
//   const [penSize, setPenSize] = useState(4);
//   const [isEraser, setIsEraser] = useState(false);

//   const handleClear = () => canvasRef.current.clearCanvas();
//   const handleUndo = () => canvasRef.current.undo();
//   const handleRedo = () => canvasRef.current.redo();

//   const handleExport = async () => {
//     const data = await canvasRef.current.exportImage("png");
//     const link = document.createElement("a");
//     link.href = data;
//     link.download = "whiteboard.png";
//     link.click();
//   };

//   // Switch between pen and eraser
//   const toggleEraser = () => {
//     setIsEraser(!isEraser);
//     setPenColor(isEraser ? "#000000" : "white");
//   };

//   // Predefined swatch colors
//   const colors = [
//     "#000000",
//     "#FF0000",
//     "#00A3FF",
//     "#00C853",
//     "#FF9800",
//     "#9C27B0",
//   ];

//   return (
//     <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
//       <div className="bg-white rounded-2xl shadow-xl p-6 flex gap-6 w-full max-w-7xl">
        
//         {/* Whiteboard */}
//         <div className="flex-1">
//           <ReactSketchCanvas
//             ref={canvasRef}
//             style={canvasStyles}
//             strokeWidth={penSize}
//             strokeColor={penColor}
//             canvasColor="white"
//           />
//         </div>

//         {/* Sidebar Toolbar */}
//         <div className="w-72 bg-gray-50 p-6 rounded-2xl shadow-md flex flex-col gap-6">
//           <h2 className="text-2xl font-bold text-gray-800 text-center">
//             🎨 Tools
//           </h2>

//           {/* Color Section */}
//           <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col gap-3 border">
//             <span className="flex items-center gap-2 text-gray-700 font-semibold">
//               <FaPalette className="text-pink-500" /> Pen Color
//             </span>
//             {/* Swatches */}
//             <div className="flex flex-wrap gap-2">
//               {colors.map((c) => (
//                 <button
//                   key={c}
//                   onClick={() => {
//                     setPenColor(c);
//                     setIsEraser(false);
//                   }}
//                   className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
//                     penColor === c ? "border-gray-800" : "border-gray-300"
//                   }`}
//                   style={{ backgroundColor: c }}
//                 />
//               ))}
//             </div>
//             {/* Custom Color Picker */}
//             <input
//               type="color"
//               value={penColor}
//               onChange={(e) => setPenColor(e.target.value)}
//               className="w-full h-10 rounded cursor-pointer border shadow-sm"
//               disabled={isEraser}
//             />
//           </div>

//           {/* Pen Size */}
//           <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col gap-3 border">
//             <span className="flex items-center gap-2 text-gray-700 font-semibold">
//               <FaPen className="text-blue-500" /> Pen Size ({penSize}px)
//             </span>
//             <input
//               type="range"
//               min="1"
//               max="20"
//               value={penSize}
//               onChange={(e) => setPenSize(parseInt(e.target.value))}
//               className="w-full cursor-pointer accent-blue-500"
//             />
//           </div>

//           {/* Action Buttons */}
//           <div className="bg-white shadow-sm rounded-xl p-4 flex flex-col gap-3 border">
//             <button
//               onClick={handleUndo}
//               className="flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold px-4 py-2 rounded-lg shadow transition transform hover:scale-105"
//             >
//               <FaUndo /> Undo
//             </button>
//             <button
//               onClick={handleRedo}
//               className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition transform hover:scale-105"
//             >
//               <FaRedo /> Redo
//             </button>
//             <button
//               onClick={toggleEraser}
//               className={`flex items-center justify-center gap-2 ${
//                 isEraser
//                   ? "bg-purple-600 hover:bg-purple-700"
//                   : "bg-gray-500 hover:bg-gray-600"
//               } text-white font-semibold px-4 py-2 rounded-lg shadow transition transform hover:scale-105`}
//             >
//               <FaEraser /> {isEraser ? "Eraser On" : "Eraser Off"}
//             </button>
//             <button
//               onClick={handleClear}
//               className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition transform hover:scale-105"
//             >
//               <FaTrash /> Clear
//             </button>
//             <button
//               onClick={handleExport}
//               className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow transition transform hover:scale-105"
//             >
//               <FaSave /> Save
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }



// import React, { useRef, useState } from "react";
// import { ReactSketchCanvas } from "react-sketch-canvas";
// import {
//   FaUndo,
//   FaRedo,
//   FaEraser,
//   FaDownload,
//   FaPen,
//   FaTrash,
// } from "react-icons/fa";

// export default function ReactSketch() {
//   const canvasRef = useRef(null);
//   const [penColor, setPenColor] = useState("#8B5CF6"); // default purple
//   const [penSize, setPenSize] = useState(4);

//   // Undo
//   const handleUndo = () => {
//     canvasRef.current?.undo();
//   };

//   // Redo
//   const handleRedo = () => {
//     canvasRef.current?.redo();
//   };

//   // Clear Canvas
//   const handleClear = () => {
//     canvasRef.current?.clearCanvas();
//   };

//   // Download as PNG
//   const handleSave = async () => {
//     const data = await canvasRef.current?.exportImage("png");
//     const link = document.createElement("a");
//     link.href = data;
//     link.download = "whiteboard.png";
//     link.click();
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-100">
//       <div className="relative bg-white rounded-xl shadow-lg p-4 flex">
//         {/* Canvas */}
//         <ReactSketchCanvas
//           ref={canvasRef}
//           strokeWidth={penSize}
//           strokeColor={penColor}
//           canvasColor="white"
//           style={{
//             borderRadius: "12px",
//             width: "700px",
//             height: "450px",
//           }}
//         />

//         {/* Toolbar */}
//         <div className="flex flex-col items-center ml-3 space-y-4">
//           {/* Color Picker */}
//           <input
//             type="color"
//             value={penColor}
//             onChange={(e) => setPenColor(e.target.value)}
//             className="w-8 h-8 rounded cursor-pointer border shadow"
//           />

//           {/* Pen Size */}
//           <input
//             type="range"
//             min="2"
//             max="15"
//             value={penSize}
//             onChange={(e) => setPenSize(parseInt(e.target.value))}
//             className="w-20 rotate-90 accent-purple-500"
//           />

//           {/* Toolbar Buttons */}
//           <button
//             onClick={handleUndo}
//             className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg shadow"
//           >
//             <FaUndo />
//           </button>
//           <button
//             onClick={handleRedo}
//             className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg shadow"
//           >
//             <FaRedo />
//           </button>
//           <button
//             onClick={handleClear}
//             className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg shadow"
//           >
//             <FaTrash />
//           </button>
//           <button
//             onClick={handleSave}
//             className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg shadow"
//           >
//             <FaDownload />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


//slected
// import React, { useRef, useState } from "react";
// import { ReactSketchCanvas } from "react-sketch-canvas";
// import {
//   FaUndo,
//   FaRedo,
//   FaEraser,
//   FaDownload,
//   FaPen,
//   FaTrash,
// } from "react-icons/fa";

// export default function ReactSketch() {
//   const canvasRef = useRef(null);
//   const [penColor, setPenColor] = useState("#000000");
//   const [penSize, setPenSize] = useState(4);
//   const [activeTool, setActiveTool] = useState("pen");

//   // Undo
//   const handleUndo = () => canvasRef.current?.undo();

//   // Redo
//   const handleRedo = () => canvasRef.current?.redo();

//   // Clear Canvas
//   const handleClear = () => canvasRef.current?.clearCanvas();

//   // Download as PNG
//   const handleSave = async () => {
//     const data = await canvasRef.current?.exportImage("png");
//     const link = document.createElement("a");
//     link.href = data;
//     link.download = "whiteboard.png";
//     link.click();
//   };

//   // Toggle Pen
//   const selectPen = () => {
//     setActiveTool("pen");
//     setPenColor("#000000"); // default black pen
//   };

//   // Toggle Eraser
//   const selectEraser = () => {
//     setActiveTool("eraser");
//     setPenColor("white"); // acts as eraser
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-100">
//       <div className="relative bg-white rounded-xl shadow-lg p-4 flex">
//         {/* Canvas */}
//         <ReactSketchCanvas
//           ref={canvasRef}
//           strokeWidth={penSize}
//           strokeColor={penColor}
//           canvasColor="white"
//           style={{
//             borderRadius: "12px",
//             width: "700px",
//             height: "450px",
//           }}
//         />

//         {/* Toolbar */}
//         <div className="flex flex-col items-center ml-4 space-y-5">
//           {/* Color Picker */}
//           <input
//             type="color"
//             value={activeTool === "pen" ? penColor : "#000000"}
//             disabled={activeTool === "eraser"}
//             onChange={(e) => setPenColor(e.target.value)}
//             className="w-8 h-8 rounded cursor-pointer border shadow"
//           />

//           {/* Pen Size Slider */}
//           <div className="flex flex-col items-center space-y-2">
//             <input
//               type="range"
//               min="2"
//               max="15"
//               value={penSize}
//               onChange={(e) => setPenSize(parseInt(e.target.value))}
//               className="w-20 accent-purple-500 cursor-pointer"
//             />
//             <span className="text-xs text-gray-600">Size</span>
//           </div>

//           {/* Toolbar Buttons */}
//           <button
//             onClick={selectPen}
//             className={`p-3 rounded-lg shadow transition ${
//               activeTool === "pen"
//                 ? "bg-purple-500 text-white"
//                 : "bg-gray-200 text-gray-800 hover:bg-purple-200"
//             }`}
//           >
//             <FaPen />
//           </button>

//           <button
//             onClick={selectEraser}
//             className={`p-3 rounded-lg shadow transition ${
//               activeTool === "eraser"
//                 ? "bg-purple-500 text-white"
//                 : "bg-gray-200 text-gray-800 hover:bg-purple-200"
//             }`}
//           >
//             <FaEraser />
//           </button>

//           <button
//             onClick={handleUndo}
//             className="p-3 bg-gray-200 hover:bg-purple-200 text-gray-800 rounded-lg shadow transition"
//           >
//             <FaUndo />
//           </button>

//           <button
//             onClick={handleRedo}
//             className="p-3 bg-gray-200 hover:bg-purple-200 text-gray-800 rounded-lg shadow transition"
//           >
//             <FaRedo />
//           </button>

//           <button
//             onClick={handleClear}
//             className="p-3 bg-gray-200 hover:bg-red-300 text-gray-800 rounded-lg shadow transition"
//           >
//             <FaTrash />
//           </button>

//           <button
//             onClick={handleSave}
//             className="p-3 bg-gray-200 hover:bg-green-300 text-gray-800 rounded-lg shadow transition"
//           >
//             <FaDownload />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


//2 selected
// import React, { useRef, useState } from "react";
// import { ReactSketchCanvas } from "react-sketch-canvas";
// import {
//   FaUndo,
//   FaRedo,
//   FaEraser,
//   FaDownload,
//   FaPen,
//   FaTrash,
// } from "react-icons/fa";

// export default function ReactSketch() {
//   const canvasRef = useRef(null);
//   const [penColor, setPenColor] = useState("#000000");
//   const [penSize, setPenSize] = useState(4);
//   const [activeTool, setActiveTool] = useState("pen");

//   const handleUndo = () => canvasRef.current?.undo();
//   const handleRedo = () => canvasRef.current?.redo();
//   const handleClear = () => canvasRef.current?.clearCanvas();

//   const handleSave = async () => {
//     const data = await canvasRef.current?.exportImage("png");
//     const link = document.createElement("a");
//     link.href = data;
//     link.download = "whiteboard.png";
//     link.click();
//   };

//   const selectPen = () => {
//     setActiveTool("pen");
//     setPenColor("#000000"); // reset to black when pen is chosen
//   };

//   const selectEraser = () => {
//     setActiveTool("eraser");
//     setPenColor("white"); // eraser works by drawing in white
//   };

//   const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#FFA500", "#800080"];

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-100">
//       <div className="relative bg-white rounded-xl shadow-lg p-4 flex">
//         {/* Canvas */}
//         <ReactSketchCanvas
//           ref={canvasRef}
//           strokeWidth={penSize}
//           strokeColor={penColor}
//           canvasColor="white"
//           style={{
//             borderRadius: "12px",
//             width: "700px",
//             height: "450px",
//           }}
//         />

//         {/* Toolbar */}
//         <div className="flex flex-col items-center ml-4 space-y-5">
//           {/* Color Palette */}
//           <div className="flex flex-wrap justify-center gap-2">
//             {colors.map((color) => (
//               <button
//                 key={color}
//                 onClick={() => {
//                   if (activeTool === "pen") {
//                     setPenColor(color);
//                   }
//                 }}
//                 className={`w-8 h-8 rounded-full border-2 transition ${
//                   penColor === color && activeTool === "pen"
//                     ? "border-purple-500 scale-110"
//                     : "border-gray-300"
//                 }`}
//                 style={{ backgroundColor: color }}
//               />
//             ))}
//           </div>

//           {/* Pen Size Slider */}
//           <div className="flex flex-col items-center space-y-2">
//             <input
//               type="range"
//               min="2"
//               max="15"
//               value={penSize}
//               onChange={(e) => setPenSize(parseInt(e.target.value))}
//               className="w-20 accent-purple-500 cursor-pointer"
//             />
//             <span className="text-xs text-gray-600">Size</span>
//           </div>

//           {/* Tools */}
//           <button
//             onClick={selectPen}
//             className={`p-3 rounded-lg shadow transition ${
//               activeTool === "pen"
//                 ? "bg-purple-500 text-white"
//                 : "bg-gray-200 text-gray-800 hover:bg-purple-200"
//             }`}
//           >
//             <FaPen />
//           </button>

//           <button
//             onClick={selectEraser}
//             className={`p-3 rounded-lg shadow transition ${
//               activeTool === "eraser"
//                 ? "bg-purple-500 text-white"
//                 : "bg-gray-200 text-gray-800 hover:bg-purple-200"
//             }`}
//           >
//             <FaEraser />
//           </button>

//           <button
//             onClick={handleUndo}
//             className="p-3 bg-gray-200 hover:bg-purple-200 text-gray-800 rounded-lg shadow transition"
//           >
//             <FaUndo />
//           </button>

//           <button
//             onClick={handleRedo}
//             className="p-3 bg-gray-200 hover:bg-purple-200 text-gray-800 rounded-lg shadow transition"
//           >
//             <FaRedo />
//           </button>

//           <button
//             onClick={handleClear}
//             className="p-3 bg-gray-200 hover:bg-red-300 text-gray-800 rounded-lg shadow transition"
//           >
//             <FaTrash />
//           </button>

//           <button
//             onClick={handleSave}
//             className="p-3 bg-gray-200 hover:bg-green-300 text-gray-800 rounded-lg shadow transition"
//           >
//             <FaDownload />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useRef, useState } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import {
  FaUndo,
  FaRedo,
  FaTrash,
  FaDownload,
  FaPen,
  FaEraser,
  FaPalette,
} from "react-icons/fa";

const ReactSketch = () => {
  const canvasRef = useRef(null);

  // States for pen/eraser and color selection
  const [tool, setTool] = useState("pen"); // "pen" or "eraser"
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [showColors, setShowColors] = useState(false);

  const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#FFA500", "#800080"];

  // Cursor styles (pen/eraser)
  const cursorStyles = {
    pen: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
    eraser:
      "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><rect x=%224%22 y=%224%22 width=%2216%22 height=%2216%22 fill=%22black%22/></svg>') 0 24, auto",
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
          strokeColor={tool === "pen" ? strokeColor : "#FFFFFF"}
          strokeWidth={tool === "pen" ? 4 : 20}
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

          {/* Eraser */}
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-full ${
              tool === "eraser" ? "bg-gray-300 text-blue-600" : "text-gray-700"
            } hover:text-blue-500`}
          >
            <FaEraser size={20} />
          </button>

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColors(!showColors)}
              className="p-2 rounded-full text-gray-700 hover:text-blue-500"
            >
              <FaPalette size={20} />
            </button>

            {showColors && (
              <div className="absolute top-10 left-0 bg-white border rounded-lg shadow-md p-2 flex flex-col space-y-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`w-6 h-6 rounded-full border ${
                      strokeColor === c ? "ring-2 ring-blue-500" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      setStrokeColor(c);
                      setTool("pen");
                      setShowColors(false);
                    }}
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

export default ReactSketch;


//Finallyyy
// import React, { useRef, useState } from "react";
// import { ReactSketchCanvas } from "react-sketch-canvas";
// import {
//   FaPen,
//   FaEraser,
//   FaUndo,
//   FaRedo,
//   FaTrash,
//   FaDownload,
// } from "react-icons/fa";

// const ReactSketch = () => {
//   const canvasRef = useRef(null);

//   // States for tool and pen color
//   const [tool, setTool] = useState("pen"); // pen | eraser
//   const [penColor, setPenColor] = useState("#000000"); // default black
//   const [penSize, setPenSize] = useState(5);
//   const [showColors, setShowColors] = useState(false);

//   const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#FFA500", "#800080"];

//   // Export canvas as image
//   const handleExport = () => {
//     canvasRef.current
//       .exportImage("png")
//       .then((data) => {
//         const link = document.createElement("a");
//         link.href = data;
//         link.download = "whiteboard.png";
//         link.click();
//       })
//       .catch((e) => console.log(e));
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen bg-gray-100">
//       <div className="flex bg-white rounded-xl shadow-lg p-4 relative">
//         {/* Whiteboard Canvas */}
//         <ReactSketchCanvas
//         ref={canvasRef}
//         strokeColor={tool === "pen" ? penColor : "#FFFFFF"}
//         strokeWidth={tool === "pen" ? 4 : 20}
//         canvasColor="white"
//         style={{
//           borderRadius: "12px",
//           border: "2px solid #e5e7eb",
//         }}
//         width="800px"
//         height="500px"
//         className={
//             tool === "pen"
//               ? "cursor-[url('https://img.icons8.com/ios-filled/24/000000/edit.png'),_pointer]"
//               : "cursor-[url('https://img.icons8.com/ios-filled/24/000000/eraser.png'),_pointer]"
//           }
//       />


//         {/* Toolbar */}
//         <div className="flex flex-col items-center ml-4 space-y-4">
//           {/* Pen */}
//           <button
//             onClick={() => setTool("pen")}
//             className={`p-2 rounded-full ${
//               tool === "pen" ? "bg-gray-300 text-blue-600" : "text-gray-700"
//             } hover:text-blue-500`}
//           >
//             <FaPen size={20} />
//           </button>

//           {/* Eraser */}
//           <button
//             onClick={() => setTool("eraser")}
//             className={`p-2 rounded-full ${
//               tool === "eraser" ? "bg-gray-300 text-blue-600" : "text-gray-700"
//             } hover:text-blue-500`}
//           >
//             <FaEraser size={20} />
//           </button>

//           {/* Color Picker */}
//           <div className="relative mt-2">
//             {/* Button showing current color */}
//             <button
//               onClick={() => setShowColors(!showColors)}
//               className="w-6 h-6 rounded-full border border-gray-400"
//               style={{ backgroundColor: penColor || "#000000" }}
//             />

//             {/* Color options popover */}
//             {showColors && (
//               <div className="absolute right-12 top-0 bg-white border rounded shadow-md p-2 flex gap-2">
//                 {colors.map((color) => (
//                   <button
//                     key={color}
//                     onClick={() => {
//                       setPenColor(color);
//                       setTool("pen"); // switch back to pen when selecting color
//                       setShowColors(false);
//                     }}
//                     className={`w-6 h-6 rounded-full border-2 ${
//                       penColor === color ? "border-black" : "border-transparent"
//                     }`}
//                     style={{ backgroundColor: color }}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Undo */}
//           <button
//             onClick={() => canvasRef.current.undo()}
//             className="p-2 rounded-full text-gray-700 hover:text-blue-500"
//           >
//             <FaUndo size={20} />
//           </button>

//           {/* Redo */}
//           <button
//             onClick={() => canvasRef.current.redo()}
//             className="p-2 rounded-full text-gray-700 hover:text-blue-500"
//           >
//             <FaRedo size={20} />
//           </button>

//           {/* Clear */}
//           <button
//             onClick={() => canvasRef.current.clearCanvas()}
//             className="p-2 rounded-full text-gray-700 hover:text-red-500"
//           >
//             <FaTrash size={20} />
//           </button>

//           {/* Save */}
//           <button
//             onClick={handleExport}
//             className="p-2 rounded-full text-gray-700 hover:text-green-500"
//           >
//             <FaDownload size={20} />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ReactSketch;




// import React, { useRef, useState } from "react";
// import { ReactSketchCanvas } from "react-sketch-canvas";
// import {
//   FaUndo,
//   FaRedo,
//   FaEraser,
//   FaSave,
//   FaTrash,
//   FaPen,
// } from "react-icons/fa";

// // Your available colors
// const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#FFA500", "#800080"];

// export default function ReactSketch() {
//   const canvasRef = useRef(null);

//   const [penColor, setPenColor] = useState("#000000"); // default black
//   const [penSize, setPenSize] = useState(4);
//   const [tool, setTool] = useState("pen"); // "pen" | "eraser"
//   const [showColors, setShowColors] = useState(false);

//   // Save image
//   const handleSave = async () => {
//     const data = await canvasRef.current.exportImage("png");
//     const link = document.createElement("a");
//     link.href = data;
//     link.download = "whiteboard.png";
//     link.click();
//   };

//   return (
//     <div className="flex items-start gap-4 p-6 bg-gray-100 h-screen">
//       {/* Whiteboard */}
//       <div
//         className="bg-white rounded-xl shadow-lg border relative"
//         style={{ width: "900px", height: "600px" }}
//       >
//         <ReactSketchCanvas
//           ref={canvasRef}
//           strokeColor={tool === "pen" ? penColor : "white"}
//           strokeWidth={penSize}
//           eraserWidth={penSize + 2}
//           style={{ borderRadius: "12px", width: "100%", height: "100%" }}
//           className={
//             tool === "pen"
//               ? "cursor-[url('https://img.icons8.com/ios-filled/24/000000/edit.png'),_pointer]"
//               : "cursor-[url('https://img.icons8.com/ios-filled/24/000000/eraser.png'),_pointer]"
//           }
//         />
//       </div>

//       {/* Tools Panel */}
//       <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-md w-20 items-center">
//         {/* Pen Tool */}
//         <button
//           onClick={() => setTool("pen")}
//           className={`p-2 rounded-full ${
//             tool === "pen" ? "bg-blue-200 text-blue-600" : "text-gray-700 hover:text-blue-500"
//           }`}
//         >
//           <FaPen size={20} />
//         </button>

//         {/* Eraser Tool */}
//         <button
//           onClick={() => setTool("eraser")}
//           className={`p-2 rounded-full ${
//             tool === "eraser"
//               ? "bg-blue-200 text-blue-600"
//               : "text-gray-700 hover:text-blue-500"
//           }`}
//         >
//           <FaEraser size={20} />
//         </button>

//         {/* Undo */}
//         <button
//           onClick={() => canvasRef.current.undo()}
//           className="p-2 rounded-full text-gray-700 hover:text-blue-500"
//         >
//           <FaUndo size={20} />
//         </button>

//         {/* Redo */}
//         <button
//           onClick={() => canvasRef.current.redo()}
//           className="p-2 rounded-full text-gray-700 hover:text-blue-500"
//         >
//           <FaRedo size={20} />
//         </button>

//         {/* Clear */}
//         <button
//           onClick={() => canvasRef.current.clearCanvas()}
//           className="p-2 rounded-full text-gray-700 hover:text-blue-500"
//         >
//           <FaTrash size={20} />
//         </button>

//         {/* Save */}
//         <button
//           onClick={handleSave}
//           className="p-2 rounded-full text-gray-700 hover:text-blue-500"
//         >
//           <FaSave size={20} />
//         </button>

//         {/* Pen Size */}
//         <div className="flex flex-col items-center mt-2">
//           <input
//             type="range"
//             min="2"
//             max="20"
//             value={penSize}
//             onChange={(e) => setPenSize(Number(e.target.value))}
//             className="w-16 accent-blue-500"
//           />
//           <span className="text-xs text-gray-500">Size</span>
//         </div>

//         {/* Color Picker */}
//         <div className="relative mt-2">
//           <button
//             onClick={() => setShowColors(!showColors)}
//             className="w-6 h-6 rounded-full border border-gray-400"
//             style={{ backgroundColor: penColor }}
//           />
//           {showColors && (
//             <div className="absolute right-12 top-0 bg-white border rounded shadow-md p-2 flex gap-2">
//               {colors.map((color) => (
//                 <button
//                   key={color}
//                   onClick={() => {
//                     setPenColor(color);
//                     setShowColors(false);
//                   }}
//                   className={`w-6 h-6 rounded-full border-2 ${
//                     penColor === color ? "border-black" : "border-transparent"
//                   }`}
//                   style={{ backgroundColor: color }}
//                 />
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
