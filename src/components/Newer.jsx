
// import React, { useRef, useState } from "react";
// import { ReactSketchCanvas } from "react-sketch-canvas";
// import {
//     FaPen,
//     FaEraser,
//     FaUndo,
//     FaRedo,
//     FaTrash,
//     FaDownload,
//     FaFileImport
// } from "react-icons/fa";

// const Newer = () => {
//     const canvasRef = useRef(null);

//     // Tool & pen states
//     const [tool, setTool] = useState("pen");
//     const [penColor, setPenColor] = useState("#000000");
//     const [penSize, setPenSize] = useState(2);
//     const [eraserSize, setEraserSize] = useState(20);
//     const [backgroundImage, setBackgroundImage] = useState(null);
//     const [darkMode, setDarkMode] = useState(false);
//     const [showColors, setShowColors] = useState(false);

//     const colors = [
//         "#000000",
//         "#FF0000",
//         "#008000",
//         "#0000FF",
//         "#f3f4f6",
//         "#FFCDD2",
//         "#FFF59D",
//         "#BBDEFB"
//     ];

//     // Cursor styles
//     const cursorStyles = {
//         pen:
//             "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
//         eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${eraserSize / 2} ${eraserSize / 2}, auto`
//     };

//     const handleExport = () => {
//         canvasRef.current
//             .exportImage("png")
//             .then((data) => {
//                 const link = document.createElement("a");
//                 link.href = data;
//                 link.download = "whiteboard.png";
//                 link.click();
//             })
//             .catch((e) => console.log(e));
//     };

//     const toggleDarkMode = () => {
//         setDarkMode(!darkMode);
//         document.body.classList.toggle("dark");
//     };

//     return (
//         <div className="flex justify-center items-center min-h-screen">
//             <div className="flex  rounded-xl shadow-lg p-4 relative w-[1100px] h-[600px]">

//                 {/* Whiteboard container → flex row */}
//                 <div className="whiteboard-container flex w-full h-full gap-2">

//                     {/* Canvas */}
//                     <div className="canvas-wrapper flex-1 h-full">
//                         <ReactSketchCanvas
//                             ref={canvasRef}
//                             strokeColor={tool === "pen" ? penColor : "#FFFFFF"}
//                             strokeWidth={penSize}
//                             eraserWidth={eraserSize}
//                             backgroundImage={backgroundImage}
//                             canvasColor="var(--canvas-bg)"
//                             style={{
//                                 borderRadius: "12px",
//                                 cursor: cursorStyles[tool],
//                                 width: "100%",
//                                 height: "100%"
//                             }}
//                         />
//                     </div>

//                     {/* Toolbar */}
//                     <div className="toolbar flex flex-col gap-2 h-full w-24 items-center p-2  rounded-xl">
//                         {/* Dark Mode Toggle */}
//                         <button onClick={toggleDarkMode} className="button p-2 rounded-full">
//                             {darkMode ? "☀️" : "🌙"}
//                         </button>

//                         {/* Pen */}
//                         <button
//                             onClick={() => {
//                                 setTool("pen");
//                                 canvasRef.current.eraseMode(false);
//                             }}
//                             className={`p-2 rounded-full hover:text-blue-500 ${tool === "pen"
//                                     ? "bg-blue-100  text-blue-600 "
//                                     : ""
//                                 }`}
//                         >
//                             <FaPen size={20} />
//                         </button>

//                         {/* Pen Size */}
//                         {tool === "pen" && (
//                             <div className="flex flex-col items-center">
//                                 <label className="text-xs mb-1">Pen Size</label>
//                                 <input
//                                     type="range"
//                                     min="1"
//                                     max="20"
//                                     value={penSize}
//                                     onChange={(e) => setPenSize(Number(e.target.value))}
//                                     className="w-20"
//                                 />
//                                 <span className="text-xs">{penSize}px</span>
//                             </div>
//                         )}

//                         {/* Eraser */}
//                         <button
//                             onClick={() => {
//                                 setTool("eraser");
//                                 canvasRef.current.eraseMode(true);
//                             }}
//                             className={`p-2 rounded-full hover:text-blue-500 ${tool === "eraser"
//                                     ? "bg-blue-100  text-blue-600 "
//                                     : ""
//                                 }`}
//                         >
//                             <FaEraser size={20} />
//                         </button>

//                         {/* Eraser Size */}
//                         {tool === "eraser" && (
//                             <div className="flex flex-col items-center">
//                                 <label className="text-xs mb-1">Eraser Size</label>
//                                 <input
//                                     type="range"
//                                     min="5"
//                                     max="50"
//                                     value={eraserSize}
//                                     onChange={(e) => setEraserSize(Number(e.target.value))}
//                                     className="w-20"
//                                 />
//                                 <span className="text-xs ">{eraserSize}px</span>
//                             </div>
//                         )}

//                         {/* Color Picker */}
//                         <div className="relative mt-2">
//                             <button
//                                 onClick={() => setShowColors(!showColors)}
//                                 className="w-6 h-6 rounded-full border"
//                                 style={{ backgroundColor: penColor }}
//                             />
//                             {showColors && (
//                                 <div className="absolute left-1/2 mt-1 -translate-x-1/2 border rounded shadow-md p-2 w-max "
//                                 style={{ backgroundColor: "var(--toolbar-bg)" }} >
//                                     <div className="grid grid-cols-3 gap-2">
//                                         {colors.map((color) => (
//                                             <button
//                                                 key={color}
//                                                 onClick={() => {
//                                                     setPenColor(color);
//                                                     setTool("pen");
//                                                     setShowColors(false);
//                                                 }}
//                                                 className={`w-6 h-6 rounded-full border-2 ${penColor === color ? "border-black " : "border-transparent"
//                                                     }`}
//                                                 style={{ backgroundColor: color }}
//                                             />
//                                         ))}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Undo */}
//                         <button
//                             onClick={() => canvasRef.current.undo()}
//                             className="p-2 rounded-full  hover:text-blue-500"
//                         >
//                             <FaUndo size={20} />
//                         </button>

//                         {/* Redo */}
//                         <button
//                             onClick={() => canvasRef.current.redo()}
//                             className=" p-2 rounded-full hover:text-blue-500"
//                         >
//                             <FaRedo size={20} />
//                         </button>

//                         {/* Clear */}
//                         <button
//                             onClick={() => {
//                                 canvasRef.current.clearCanvas();
//                                 setBackgroundImage(null);
//                             }}
//                             className=" p-2 rounded-full hover:text-red-500"
//                         >
//                             <FaTrash size={20} />
//                         </button>

//                         {/* Export */}
//                         <button
//                             onClick={handleExport}
//                             className=" p-2 rounded-full hover:text-green-500"
//                         >
//                             <FaDownload size={20} />
//                         </button>

//                         {/* Import */}
//                         <input
//                             type="file"
//                             accept="image/*"
//                             id="import-image"
//                             className="hidden"
//                             onChange={(e) => {
//                                 const file = e.target.files[0];
//                                 if (!file) return;
//                                 const reader = new FileReader();
//                                 reader.onload = () => setBackgroundImage(reader.result);
//                                 reader.readAsDataURL(file);
//                             }}
//                         />
//                         <label
//                             htmlFor="import-image"
//                             className=" p-2 hover:text-purple-500 rounded-full cursor-pointer"
//                         >
//                             <FaFileImport size={20} />
//                         </label>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Newer;


// import React, { useRef, useState, useEffect } from 'react';
// import { Stage, Layer, Line, Rect, Image } from 'react-konva';
// import useImage from 'use-image';
// import {
//     FaPen,
//     FaEraser,
//     FaUndo,
//     FaRedo,
//     FaTrash,
//     FaDownload,
//     FaFileImport,
//     FaShapes, // New Icon for shapes
// } from 'react-icons/fa';

// // Component to render the imported background image
// const BackgroundImage = ({ imageUrl }) => {
//     const [image] = useImage(imageUrl);
//     return <Image image={image} x={0} y={0} width={1100} height={600} />;
// };

// const Newer = () => {
//     const stageRef = useRef(null);
//     const isDrawing = useRef(false);

//     // --- STATE MANAGEMENT ---
//     const [tool, setTool] = useState('pen'); // 'pen', 'eraser', 'rectangle', 'line'
//     const [shapes, setShapes] = useState([]);

//     // History for Undo/Redo
//     const [history, setHistory] = useState([[]]);
//     const [historyStep, setHistoryStep] = useState(0);

//     // Tool properties from original code
//     const [penColor, setPenColor] = useState('#000000');
//     const [penSize, setPenSize] = useState(2);
//     const [eraserSize, setEraserSize] = useState(20);
//     const [backgroundImage, setBackgroundImage] = useState(null);
//     const [darkMode, setDarkMode] = useState(false);
//     const [showColors, setShowColors] = useState(false);
//     const [showShapes, setShowShapes] = useState(false);

//     const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#f3f4f6", "#FFCDD2", "#FFF59D", "#BBDEFB"];

//     // --- DRAWING LOGIC ---
//     const handleMouseDown = (e) => {
//         isDrawing.current = true;
//         const pos = e.target.getStage().getPointerPosition();
//         let newShape = {};

//         switch (tool) {
//             case 'pen':
//             case 'eraser':
//                 newShape = {
//                     tool,
//                     points: [pos.x, pos.y],
//                     color: tool === 'eraser' ? (darkMode ? '#1a202c' : '#ffffff') : penColor,
//                     size: tool === 'eraser' ? eraserSize : penSize,
//                 };
//                 break;
//             case 'rectangle':
//                 newShape = { tool, x: pos.x, y: pos.y, width: 0, height: 0, color: penColor, size: penSize };
//                 break;
//             case 'line':
//                 newShape = { tool, points: [pos.x, pos.y, pos.x, pos.y], color: penColor, size: penSize };
//                 break;
//             default:
//                 return;
//         }
//         setShapes([...shapes, newShape]);
//     };

//     const handleMouseMove = (e) => {
//         if (!isDrawing.current) return;

//         const stage = e.target.getStage();
//         const point = stage.getPointerPosition();
//         let lastShape = shapes[shapes.length - 1];

//         if (!lastShape) return;

//         switch (lastShape.tool) {
//             case 'pen':
//             case 'eraser':
//                 lastShape.points = lastShape.points.concat([point.x, point.y]);
//                 break;
//             case 'rectangle':
//                 lastShape.width = point.x - lastShape.x;
//                 lastShape.height = point.y - lastShape.y;
//                 break;
//             case 'line':
//                 lastShape.points = [lastShape.points[0], lastShape.points[1], point.x, point.y];
//                 break;
//             default:
//                 return;
//         }

//         shapes.splice(shapes.length - 1, 1, lastShape);
//         setShapes([...shapes]);
//     };

//     const handleMouseUp = () => {
//         if (!isDrawing.current) return;
//         isDrawing.current = false;

//         // Add new state to history
//         const newHistory = history.slice(0, historyStep + 1);
//         setHistory([...newHistory, shapes]);
//         setHistoryStep(historyStep + 1);
//     };

//     // --- TOOLBAR FUNCTIONS ---
//     const handleUndo = () => {
//         if (historyStep > 0) {
//             const newStep = historyStep - 1;
//             setHistoryStep(newStep);
//             setShapes(history[newStep]);
//         }
//     };

//     const handleRedo = () => {
//         if (historyStep < history.length - 1) {
//             const newStep = historyStep + 1;
//             setHistoryStep(newStep);
//             setShapes(history[newStep]);
//         }
//     };

//     const handleClear = () => {
//         setShapes([]);
//         setBackgroundImage(null);
//         setHistory([[]]);
//         setHistoryStep(0);
//     };

//     const handleExport = () => {
//         const uri = stageRef.current.toDataURL();
//         const link = document.createElement('a');
//         link.download = 'whiteboard.png';
//         link.href = uri;
//         link.click();
//     };

//     const toggleDarkMode = () => {
//         setDarkMode(!darkMode);
//         document.body.classList.toggle("dark");
//     };

//     // Adjust eraser color on dark mode toggle
//     useEffect(() => {
//         const newShapes = shapes.map(shape => {
//             if (shape.tool === 'eraser') {
//                 return { ...shape, color: darkMode ? '#1a202c' : '#ffffff' };
//             }
//             return shape;
//         });
//         setShapes(newShapes);
//     }, [darkMode]);

//     // --- CURSOR STYLES ---
//     const cursorStyles = {
//         pen: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
//         eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${eraserSize / 2} ${eraserSize / 2}, auto`,
//         rectangle: 'crosshair',
//         line: 'crosshair',
//     };

//     // Note on 3D: Drawing true 3D shapes requires a 3D library like React Three Fiber. 
//     // This example fakes a 3D cube with 2D lines for simplicity.

//     return (
//         <div className="flex justify-center items-center min-h-screen">
//             <div className="flex rounded-xl shadow-lg p-4 relative w-[1100px] h-[600px]">
//                 <div className="whiteboard-container flex w-full h-full gap-2">
//                     {/* Canvas Wrapper */}
//                     <div className="canvas-wrapper flex-1 h-full rounded-xl overflow-hidden" style={{ cursor: cursorStyles[tool] || 'default' }}>
//                         <Stage
//                             width={1100}
//                             height={600}
//                             onMouseDown={handleMouseDown}
//                             onMouseMove={handleMouseMove}
//                             onMouseUp={handleMouseUp}
//                             ref={stageRef}
//                             style={{ backgroundColor: 'var(--canvas-bg)' }}
//                         >
//                             <Layer>
//                                 {backgroundImage && <BackgroundImage imageUrl={backgroundImage} />}
//                                 {shapes.map((shape, i) => {
//                                     if (shape.tool === 'pen' || shape.tool === 'eraser') {
//                                         return <Line key={i} points={shape.points} stroke={shape.color} strokeWidth={shape.size} tension={0.5} lineCap="round" />;
//                                     }
//                                     if (shape.tool === 'rectangle') {
//                                         return <Rect key={i} x={shape.x} y={shape.y} width={shape.width} height={shape.height} stroke={shape.color} strokeWidth={shape.size} />;
//                                     }
//                                     if (shape.tool === 'line') {
//                                         return <Line key={i} points={shape.points} stroke={shape.color} strokeWidth={shape.size} lineCap="round" />;
//                                     }
//                                     return null;
//                                 })}
//                             </Layer>
//                         </Stage>
//                     </div>

//                     {/* Toolbar (Functionality is preserved, only minor changes) */}
//                     <div className="toolbar flex flex-col gap-2 h-full w-24 items-center p-2 rounded-xl">
//                         <button onClick={toggleDarkMode} className="button p-2 rounded-full">{darkMode ? "☀️" : "🌙"}</button>

//                         {/* Pen */}
//                         <button onClick={() => setTool("pen")} className={`p-2 rounded-full ${tool === "pen" ? "bg-blue-100 text-blue-600" : ""}`}><FaPen size={20} /></button>
//                         {tool === "pen" && (
//                             <div className="flex flex-col items-center"><label className="text-xs mb-1">Pen Size</label><input type="range" min="1" max="20" value={penSize} onChange={(e) => setPenSize(Number(e.target.value))} className="w-20" /><span className="text-xs">{penSize}px</span></div>
//                         )}

//                         {/* Eraser */}
//                         <button onClick={() => setTool("eraser")} className={`p-2 rounded-full ${tool === "eraser" ? "bg-blue-100 text-blue-600" : ""}`}><FaEraser size={20} /></button>
//                         {tool === "eraser" && (
//                              <div className="flex flex-col items-center"><label className="text-xs mb-1">Eraser Size</label><input type="range" min="5" max="50" value={eraserSize} onChange={(e) => setEraserSize(Number(e.target.value))} className="w-20" /><span className="text-xs">{eraserSize}px</span></div>
//                         )}

//                          {/* --- NEW SHAPES BUTTON --- */}
//                          <div className="relative">
//                             <button onClick={() => setShowShapes(!showShapes)} className={`p-2 rounded-full ${['rectangle', 'line'].includes(tool) ? "bg-blue-100 text-blue-600" : ""}`}>
//                                 <FaShapes size={20} />
//                             </button>
//                             {showShapes && (
//                                 <div className="absolute left-full ml-2 top-0 border rounded shadow-md p-2 w-max" style={{ backgroundColor: "var(--toolbar-bg)" }}>
//                                     <button onClick={() => { setTool('rectangle'); setShowShapes(false); }} className="block w-full text-left p-1">2D (Rect)</button>
//                                     <button onClick={() => { setTool('line'); setShowShapes(false); }} className="block w-full text-left p-1">Line</button>
//                                     <button disabled className="block w-full text-left p-1 opacity-50">3D (soon)</button>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Color Picker (No changes) */}
//                         <div className="relative mt-2">
//                             <button onClick={() => setShowColors(!showColors)} className="w-6 h-6 rounded-full border" style={{ backgroundColor: penColor }} />
//                             {showColors && (
//                                 <div className="absolute left-1/2 mt-1 -translate-x-1/2 border rounded shadow-md p-2 w-max" style={{ backgroundColor: "var(--toolbar-bg)" }}>
//                                     <div className="grid grid-cols-3 gap-2">
//                                         {colors.map((color) => (<button key={color} onClick={() => { setPenColor(color); setTool("pen"); setShowColors(false); }} className={`w-6 h-6 rounded-full border-2 ${penColor === color ? "border-black" : "border-transparent"}`} style={{ backgroundColor: color }} />))}
//                                     </div>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Control Buttons */}
//                         <button onClick={handleUndo} className="p-2 rounded-full"><FaUndo size={20} /></button>
//                         <button onClick={handleRedo} className="p-2 rounded-full"><FaRedo size={20} /></button>
//                         <button onClick={handleClear} className="p-2 rounded-full"><FaTrash size={20} /></button>
//                         <button onClick={handleExport} className="p-2 rounded-full"><FaDownload size={20} /></button>

//                         {/* Import Button (No changes) */}
//                         <input type="file" accept="image/*" id="import-image" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setBackgroundImage(reader.result); reader.readAsDataURL(file); }} />
//                         <label htmlFor="import-image" className="p-2 rounded-full cursor-pointer"><FaFileImport size={20} /></label>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Newer;


import React, { useRef, useState, } from 'react';
import { Stage, Layer, Line, Rect, Image, Circle } from 'react-konva'; // Added Circle
import useImage from 'use-image';
import {
    FaPen, FaEraser, FaUndo, FaRedo, FaTrash, FaDownload, FaFileImport,
    FaShapes, FaSquare, FaCircle, FaSlash, FaCube // New Icons for shapes
} from 'react-icons/fa';

// Component to render the imported background image
const BackgroundImage = ({ imageUrl }) => {
    const [image] = useImage(imageUrl);
    // Note: Dimensions are hardcoded. You might want to make this dynamic.
    return <Image image={image} x={0} y={0} width={1100} height={600} />;
};

const Newer = () => {
    const stageRef = useRef(null);
    const isDrawing = useRef(false);

    // --- STATE MANAGEMENT ---
    // Added 'circle' to the tool options
    const [tool, setTool] = useState('pen'); // 'pen', 'eraser', 'rectangle', 'line', 'circle'
    const [shapes, setShapes] = useState([]);

    // History for Undo/Redo
    const [history, setHistory] = useState([[]]);
    const [historyStep, setHistoryStep] = useState(0);

    // Tool properties
    const [penColor, setPenColor] = useState('#000000');
    const [penSize, setPenSize] = useState(2);
    const [eraserSize, setEraserSize] = useState(20);
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [showColors, setShowColors] = useState(false);
    const [showShapes, setShowShapes] = useState(false); // This toggles the new shape menu
    const [lineStyle, setLineStyle] = useState(null);

    const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#f3f4f6", "#FFCDD2", "#FFF59D", "#BBDEFB"];

    // --- DRAWING LOGIC (with 'circle' added) ---
    const handleMouseDown = (e) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        let newShape = {};

        switch (tool) {
            case 'pen':
            case 'eraser':
                newShape = { tool, points: [pos.x, pos.y], color: tool === 'eraser' ? (darkMode ? '#1a202c' : '#ffffff') : penColor, size: tool === 'eraser' ? eraserSize : penSize };
                break;
            case 'rectangle':
                newShape = { tool, x: pos.x, y: pos.y, width: 0, height: 0, color: penColor, size: penSize };
                break;
            case 'circle':
                newShape = { tool, x: pos.x, y: pos.y, radius: 0, color: penColor, size: penSize };
                break;
            case 'line':
                newShape = { tool, points: [pos.x, pos.y, pos.x, pos.y], color: penColor, size: penSize };
                break;
            default:
                return;
        }
        setShapes([...shapes, newShape]);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) return;
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        let lastShape = shapes[shapes.length - 1];
        if (!lastShape) return;

        if (tool === 'eraser') {
            const erasedShapes = shapes.filter(shape => {
                if (shape.tool === 'rectangle') {
                    return !(
                        point.x >= shape.x &&
                        point.x <= shape.x + shape.width &&
                        point.y >= shape.y &&
                        point.y <= shape.y + shape.height
                    );
                } else if (shape.tool === 'circle') {
                    const dx = point.x - shape.x;
                    const dy = point.y - shape.y;
                    return Math.sqrt(dx * dx + dy * dy) > shape.radius;
                } else if (shape.tool === 'line' || shape.tool === 'pen') {
                    // Simple distance check for points
                    return !shape.points.some((p, idx) => {
                        if (idx % 2 === 0) {
                            const x = shape.points[idx];
                            const y = shape.points[idx + 1];
                            return Math.hypot(point.x - x, point.y - y) < eraserSize;
                        }
                    });
                }
                return true;
            });
            setShapes(erasedShapes);
            return; // Skip drawing a new line
        }

        // --- Existing drawing logic ---
        switch (lastShape.tool) {
            case 'pen':
            case 'eraser':
                lastShape.points = lastShape.points.concat([point.x, point.y]);
                break;
            case 'rectangle':
                lastShape.width = point.x - lastShape.x;
                lastShape.height = point.y - lastShape.y;
                break;
            case 'circle':
                { const dx = point.x - lastShape.x;
                const dy = point.y - lastShape.y;
                lastShape.radius = Math.sqrt(dx * dx + dy * dy);
                break; }
            case 'line':
                lastShape.points = [lastShape.points[0], lastShape.points[1], point.x, point.y];
                break;
            default:
                return;
        }

        shapes.splice(shapes.length - 1, 1, lastShape);
        setShapes([...shapes]);
    };


    const handleMouseUp = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        const newHistory = history.slice(0, historyStep + 1);
        setHistory([...newHistory, shapes]);
        setHistoryStep(historyStep + 1);
    };

    // --- TOOLBAR FUNCTIONS (no changes here) ---
    const handleUndo = () => { if (historyStep > 0) { const newStep = historyStep - 1; setHistoryStep(newStep); setShapes(history[newStep]); } };
    const handleRedo = () => { if (historyStep < history.length - 1) { const newStep = historyStep + 1; setHistoryStep(newStep); setShapes(history[newStep]); } };
    const handleClear = () => { setShapes([]); setBackgroundImage(null); setHistory([[]]); setHistoryStep(0); };
    const handleExport = () => { const uri = stageRef.current.toDataURL(); const link = document.createElement('a'); link.download = 'whiteboard.png'; link.href = uri; link.click(); };
    const toggleDarkMode = () => { setDarkMode(!darkMode); document.body.classList.toggle("dark"); };
    

    // --- CURSOR STYLES ---
    const cursorStyles = { pen: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto", eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${eraserSize / 2} ${eraserSize / 2}, auto`, rectangle: 'crosshair', line: 'crosshair', circle: 'crosshair' };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="flex rounded-xl shadow-lg p-4 relative w-[1100px] h-[600px]">
                <div className="whiteboard-container flex w-full h-full gap-2">
                    {/* Canvas Wrapper */}
                    <div className="canvas-wrapper flex-1 h-full rounded-xl overflow-hidden" style={{ cursor: cursorStyles[tool] || 'default' }}>
                        <Stage width={1100} height={600} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} ref={stageRef} style={{ backgroundColor: 'var(--canvas-bg)' }}>
                            <Layer>
                                {backgroundImage && <BackgroundImage imageUrl={backgroundImage} />}
                                {!backgroundImage && <Rect x={0} y={0} width={1100} height={600} fill={darkMode ? '#1a202c' : '#ffffff'} />}

                                {shapes.map((shape, i) => {
                                    switch (shape.tool) {
                                        case 'pen':
                                            return <Line key={i} points={shape.points} stroke={shape.color} strokeWidth={shape.size} tension={0.5} lineCap="round" />;
                                        case 'eraser':
                                            return <Line key={i} points={shape.points} strokeWidth={shape.size} lineCap="round" tension={0.5} globalCompositeOperation="destination-out" />;
                                        case 'rectangle':
                                            return <Rect key={i} x={shape.x} y={shape.y} width={shape.width} height={shape.height} stroke={shape.color} strokeWidth={shape.size} />;
                                        case 'circle':
                                            return <Circle key={i} x={shape.x} y={shape.y} radius={shape.radius} stroke={shape.color} strokeWidth={shape.size} />;
                                        case 'triangle':
                                            return <Line key={i} points={shape.points} closed stroke={shape.color} strokeWidth={shape.size} />;
                                        case 'ellipse':
                                            return <Ellipse key={i} x={shape.x} y={shape.y} radiusX={shape.radiusX} radiusY={shape.radiusY} stroke={shape.color} strokeWidth={shape.size} />;
                                        case 'polygon':
                                            return <Line key={i} points={shape.points} closed stroke={shape.color} strokeWidth={shape.size} />;
                                        case 'line':
                                            return <Line
                                                key={i}
                                                points={shape.points}
                                                stroke={shape.color}
                                                strokeWidth={shape.size}
                                                lineCap="round"
                                                dash={shape.lineStyle === 'dashed' ? [10, 5] : []}
                                                pointerLength={shape.lineStyle === 'arrow' ? 10 : 0}
                                            />;
                                        default: return null;
                                    }
                                })}
                            </Layer>

                        </Stage>
                    </div>

                    {/* --- UPDATED TOOLBAR --- */}
                    <div className="toolbar flex flex-col gap-2 h-full w-24 items-center p-2 rounded-xl">
                        <button onClick={toggleDarkMode} className="p-2 rounded-full">{darkMode ? "☀️" : "🌙"}</button>
                        {/* PEN BUTTON WITH LEFT SIZE SELECTOR */}
                        <div className="relative">
                            <button onClick={() => setTool("pen")} className={`p-2 rounded-full ${tool === "pen" ? "bg-blue-100 text-blue-600" : ""}`}><FaPen size={20} /></button>
                            {/* {tool === "pen" && (
                                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 flex flex-col items-center bg-[var(--toolbar-bg)] p-2 rounded shadow-lg">
                                    <label className="text-xs mb-1">Size</label>
                                    <input type="range" min="1" max="20" value={penSize} onChange={(e) => setPenSize(Number(e.target.value))} className="w-20" />
                                    <span className="text-xs">{penSize}px</span>
                                </div>
                            )} */}
                        </div>

                        {/* ERASER BUTTON WITH LEFT SIZE SELECTOR */}
                        <div className="relative">
                            <button onClick={() => setTool("eraser")} className={`p-2 rounded-full ${tool === "eraser" ? "bg-blue-100 text-blue-600" : ""}`}><FaEraser size={20} /></button>
                            {/* {tool === "eraser" && (
                                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 flex flex-col items-center bg-[var(--toolbar-bg)] p-2 rounded shadow-lg">
                                    <label className="text-xs mb-1">Size</label>
                                    <input type="range" min="5" max="50" value={eraserSize} onChange={(e) => setEraserSize(Number(e.target.value))} className="w-20" />
                                    <span className="text-xs">{eraserSize}px</span>
                                </div>
                            )} */}
                        </div>


                        {/* --- IMPROVED SHAPES MENU --- */}
                        {/* --- SHAPES MENU (opens to the LEFT) --- */}
                     
                        <div className="relative flex flex-col items-center">
                            <button
                                onClick={() => setShowShapes(!showShapes)}
                                className={`p-2 rounded-full ${['rectangle', 'line', 'circle', 'triangle', 'ellipse', 'polygon'].includes(tool) ? 'bg-blue-100 text-blue-600' : ''}`}
                            >
                                <FaShapes size={20} />
                            </button>

                            {showShapes && (
                                <div className="absolute -left-56 top-1/2 -translate-y-1/2 border rounded-2xl shadow-xl p-3 z-20 w-52 ">
                                    {/* 2D Shapes Section */}
                                    <p className="text-xs font-semibold mb-2 ">2D Shapes</p>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <button onClick={() => { setTool('rectangle'); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center"><FaSquare /></button>
                                        <button onClick={() => { setTool('circle'); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center"><FaCircle /></button>
                                        <button onClick={() => { setTool('triangle'); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center">▲</button>
                                        <button onClick={() => { setTool('ellipse'); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center">⬭</button>
                                        <button onClick={() => { setTool('polygon'); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center">⬠</button>
                                    </div>

                                    {/* Lines Section */}
                                    <p className="text-xs font-semibold mb-2">Lines</p>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <button onClick={() => { setTool('line'); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center"><FaSlash /></button>
                                        <button onClick={() => { setLineStyle('solid'); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-100 text-xs">Solid</button>
                                        <button onClick={() => { setLineStyle('dashed'); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-100 text-xs">Dashed</button>
                                    </div>

                                    {/* 3D Shapes Section */}
                                    <p className="text-xs font-semibold mb-2 text-gray-400">3D Shapes (Future)</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button disabled className="p-2 border rounded opacity-50 cursor-not-allowed">Cube</button>
                                        <button disabled className="p-2 border rounded opacity-50 cursor-not-allowed">Sphere</button>
                                        <button disabled className="p-2 border rounded opacity-50 cursor-not-allowed">Cylinder</button>
                                    </div>


                                    {/* --- Pen Size Selector --- */}
                                    {tool === 'pen' && (
                                        <div className="flex flex-col items-center mt-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md">
                                            <label className="text-xs mb-1 text-gray-700 dark:text-gray-200">Pen Size</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={penSize}
                                                onChange={(e) => setPenSize(Number(e.target.value))}
                                                className="w-full"
                                            />
                                            <span className="text-xs mt-1">{penSize}px</span>
                                        </div>
                                    )}

                                    {/* --- Eraser Size Selector --- */}
                                    {tool === 'eraser' && (
                                        <div className="flex flex-col items-center mt-2 p-2 rounded-lg shadow-md">
                                            <label className="text-xs mb-1 ">Eraser Size</label>
                                            <input
                                                type="range"
                                                min="5"
                                                max="50"
                                                value={eraserSize}
                                                onChange={(e) => setEraserSize(Number(e.target.value))}
                                                className="w-full"
                                            />
                                            <span className="text-xs mt-1 ">{eraserSize}px</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>


                        {/* Color Picker, Controls, and Import */}
                        <div className="relative mt-2">
                            <button onClick={() => setShowColors(!showColors)} className="w-6 h-6 rounded-full border" style={{ backgroundColor: penColor }} />
                            {showColors && (<div className="absolute left-1/2 mt-1 -translate-x-1/2 border rounded shadow-md p-2 w-max" style={{ backgroundColor: "var(--toolbar-bg)" }}><div className="grid grid-cols-3 gap-2">{colors.map((color) => (<button key={color} onClick={() => { setPenColor(color); setShowColors(false); }} className={`w-6 h-6 rounded-full border-2 ${penColor === color ? "border-black" : "border-transparent"}`} style={{ backgroundColor: color }} />))}</div></div>)}
                        </div>
                        <button onClick={handleUndo} className="p-2 rounded-full"><FaUndo size={20} /></button>
                        <button onClick={handleRedo} className="p-2 rounded-full"><FaRedo size={20} /></button>
                        <button onClick={handleClear} className="p-2 rounded-full"><FaTrash size={20} /></button>
                        <button onClick={handleExport} className="p-2 rounded-full"><FaDownload size={20} /></button>
                        <input type="file" accept="image/*" id="import-image" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setBackgroundImage(reader.result); reader.readAsDataURL(file); }} />
                        <label htmlFor="import-image" className="p-2 rounded-full cursor-pointer"><FaFileImport size={20} /></label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Newer;