import React, { useRef, useState, useEffect } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Image,
  Circle,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import {
  FaPen,
  FaEraser,
  FaUndo,
  FaRedo,
  FaTrash,
  FaDownload,
  FaFileImport,
  FaShapes,
  FaSquare,
  FaCircle,
  FaSlash,
  FaMousePointer,
} from "react-icons/fa";

import {
  HiOutlineCube,
  HiOutlineGlobe,
  HiOutlineDesktopComputer,
} from "react-icons/hi";

// Component to render the imported background image
const BackgroundImage = ({ imageUrl }) => {
  const [image] = useImage(imageUrl);
  return <Image image={image} x={0} y={0} width={1100} height={600} />;
};

const SelectFeature = () => {
  const stageRef = useRef(null);
  const isDrawing = useRef(false);
  const transformerRef = useRef(null);

  // --- STATE MANAGEMENT ---
  const [tool, setTool] = useState("pen"); // 'pen', 'eraser', 'select', etc.
  const [shapes, setShapes] = useState([]);
  const [selectedId, selectShape] = useState(null); // State to track which shape is selected

  // History for Undo/Redo
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  // Tool properties
  const [penColor, setPenColor] = useState("#000000");
  const [penSize, setPenSize] = useState(2);
  const [eraserSize, setEraserSize] = useState(20);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [, setLineStyle] = useState(null);

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

  // --- SELECTION AND DRAWING LOGIC ---
  const checkDeselect = (e) => {
    // Deselect if click on empty area or a Konva Stage
    const clickedOnEmpty = e.target.getStage() === e.target;
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  const handleMouseDown = (e) => {
    // Handle selection first if in 'select' mode
    if (tool === "select") {
      const clickedOnStage = e.target.getStage() === e.target;
      const clickedOnShape = !clickedOnStage && e.target.attrs.id;

      if (clickedOnShape) {
        selectShape(e.target.attrs.id);
      } else {
        selectShape(null);
        
      }
      return;
    }

    // Proceed with drawing logic if not in 'select' mode
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const id = Date.now().toString() + Math.random(); // Create a unique ID for the new shape
    let newShape = {};

    switch (tool) {
      case "pen":
      case "eraser":
        newShape = {
          id,
          tool,
          points: [pos.x, pos.y],
          color:
            tool === "eraser" ? (darkMode ? "#1a202c" : "#ffffff") : penColor,
          size: tool === "eraser" ? eraserSize : penSize,
        };
        break;
      case "rectangle":
        newShape = {
          id,
          tool,
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          color: penColor,
          size: penSize,
        };
        break;
      case "circle":
        newShape = {
          id,
          tool,
          x: pos.x,
          y: pos.y,
          radius: 0,
          color: penColor,
          size: penSize,
        };
        break;
      case "line":
        newShape = {
          id,
          tool,
          points: [pos.x, pos.y, pos.x, pos.y],
          color: penColor,
          size: penSize,
        };
        break;
      default:
        return;
    }
    setShapes([...shapes, newShape]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool === "select") return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastShape = shapes[shapes.length - 1];
    if (!lastShape) return;

    if (tool === "eraser") {
      // Eraser logic
      const erasedShapes = shapes.filter((shape) => {
        if (shape.tool === "rectangle" || shape.tool === "circle") {
          // This logic is simple and may not be perfect for a real eraser
          const dx = point.x - shape.x;
          const dy = point.y - shape.y;
          return (
            Math.sqrt(dx * dx + dy * dy) > Math.max(shape.width, shape.height)
          );
        }
        return !shape.points?.some((p, idx) => {
          if (idx % 2 === 0) {
            const x = shape.points[idx];
            const y = shape.points[idx + 1];
            return Math.hypot(point.x - x, point.y - y) < eraserSize;
          }
          return false;
        });
      });
      setShapes(erasedShapes);
      return;
    }

    // Drawing logic
    switch (lastShape.tool) {
      case "pen":
      case "eraser":
        lastShape.points = lastShape.points.concat([point.x, point.y]);
        break;
      case "rectangle":
        lastShape.width = point.x - lastShape.x;
        lastShape.height = point.y - lastShape.y;
        break;
      case "circle": {
        const dx = point.x - lastShape.x;
        const dy = point.y - lastShape.y;
        lastShape.radius = Math.sqrt(dx * dx + dy * dy);
        break;
      }
      case "line":
        lastShape.points = [
          lastShape.points[0],
          lastShape.points[1],
          point.x,
          point.y,
        ];
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

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setShapes(history[newStep]);
    }
  };
  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      setShapes(history[newStep]);
    }
  };
  const handleClear = () => {
    setShapes([]);
    setBackgroundImage(null);
    setHistory([[]]);
    setHistoryStep(0);
  };
  const handleExport = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = uri;
    link.click();
  };
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle("dark");
  };

  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const selectedShape = stageRef.current.findOne("#" + selectedId);
      if (selectedShape) {
        transformerRef.current.nodes([selectedShape]);
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [selectedId]);

  const cursorStyles = {
    pen: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
    eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${
      eraserSize / 2
    } ${eraserSize / 2}, auto`,
    rectangle: "crosshair",
    line: "crosshair",
    circle: "crosshair",
    select: "default",
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex rounded-xl shadow-lg p-4 relative w-[1100px] h-[600px]">
        <div className="whiteboard-container flex w-full h-full gap-2">
          <div
            className="canvas-wrapper flex-1 h-full rounded-xl overflow-hidden"
            style={{ cursor: cursorStyles[tool] || "default" }}
          >
            <Stage
              width={1100}
              height={600}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onClick={checkDeselect} // Add click handler to deselect
              ref={stageRef}
              style={{ backgroundColor: "var(--canvas-bg)" }}
            >
              <Layer>
                {backgroundImage && (
                  <BackgroundImage imageUrl={backgroundImage} />
                )}
                {!backgroundImage && (
                  <Rect
                    x={0}
                    y={0}
                    width={1100}
                    height={600}
                    fill={darkMode ? "#1a202c" : "#ffffff"}
                  />
                )}

                {shapes.map((shape, i) => {

                  switch (shape.tool) {
                    case "pen":
                    case "eraser":
                      return (
                        <Line
                          key={i}
                          id={shape.id} // Set ID for selection
                          points={shape.points}
                          stroke={shape.color}
                          strokeWidth={shape.size}
                          tension={0.5}
                          lineCap="round"
                          globalCompositeOperation={
                            shape.tool === "eraser"
                              ? "destination-out"
                              : "source-over"
                          }
                          onClick={() =>
                            tool === "select" && selectShape(shape.id)
                          }
                          draggable={tool === "select"}
                          onDragEnd={(e) => {
                            const newShapes = shapes.slice();
                            newShapes[i] = {
                              ...newShapes[i],
                              x: e.target.x(),
                              y: e.target.y(),
                            };
                            setShapes(newShapes);
                          }}
                        />
                      );
                    case "rectangle":
                      return (
                        <Rect
                          key={i}
                          id={shape.id}
                          x={shape.x}
                          y={shape.y}
                          width={shape.width}
                          height={shape.height}
                          stroke={shape.color}
                          strokeWidth={shape.size}
                          draggable={tool === "select"}
                          onClick={() =>
                            tool === "select" && selectShape(shape.id)
                          }
                          onTransformEnd={(e) => {
                            const node = e.target;
                            const newShapes = shapes.slice();
                            newShapes[i] = {
                              ...newShapes[i],
                              x: node.x(),
                              y: node.y(),
                              width: node.width() * node.scaleX(),
                              height: node.height() * node.scaleY(),
                              rotation: node.rotation(),
                            };
                            setShapes(newShapes);
                          }}
                        />
                      );
                    case "circle":
                      return (
                        <Circle
                          key={i}
                          id={shape.id}
                          x={shape.x}
                          y={shape.y}
                          radius={shape.radius}
                          stroke={shape.color}
                          strokeWidth={shape.size}
                          draggable={tool === "select"}
                          onClick={() =>
                            tool === "select" && selectShape(shape.id)
                          }
                          onTransformEnd={(e) => {
                            const node = e.target;
                            const newShapes = shapes.slice();
                            newShapes[i] = {
                              ...newShapes[i],
                              x: node.x(),
                              y: node.y(),
                              radius: node.radius() * node.scaleX(),
                              rotation: node.rotation(),
                            };
                            setShapes(newShapes);
                          }}
                        />
                      );
                    default:
                      return null;
                  }
                })}
                <Transformer
                  ref={transformerRef}
                  rotateEnabled={true}
                  resizeEnabled={true}
                  visible={selectedId && tool === "select"}
                />
              </Layer>
            </Stage>
          </div>

          <div className="toolbar flex flex-col gap-2 h-full w-24 items-center p-2 rounded-xl">
            <button onClick={toggleDarkMode} className="p-2 rounded-full">
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={() => setTool("pen")}
              className={`p-2 rounded-full ${
                tool === "pen" ? "bg-blue-100 text-blue-600" : ""
              }`}
            >
              <FaPen size={20} />
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`p-2 rounded-full ${
                tool === "eraser" ? "bg-blue-100 text-blue-600" : ""
              }`}
            >
              <FaEraser size={20} />
            </button>
            <button
              onClick={() => setTool("select")}
              className={`p-2 rounded-full ${
                tool === "select" ? "bg-blue-100 text-blue-600" : ""
              }`}
            >
              <FaMousePointer size={20} />
            </button>

       <div className="relative flex flex-col items-center">
                     <button
                       onClick={() => setShowShapes(!showShapes)}
                       className={`p-2 rounded-full ${
                         [
                           "rectangle",
                           "line",
                           "circle",
                           "triangle",
                           "ellipse",
                           "polygon",
                         ].includes(tool)
                           ? "bg-blue-100 text-blue-600"
                           : ""
                       }`}
                     >
                       <FaShapes size={20} />
                     </button>
       
                     {showShapes && (
                       <div className="absolute -left-56 top-1/2 -translate-y-1/2 border rounded-2xl shadow-xl p-3 z-20 w-52"
                       style={{ backgroundColor: "var(--toolbar-bg)" }}>
                         {/* 2D Shapes Section */}
                         <p className="text-xs font-semibold mb-2 ">2D Shapes</p>
                         <div className="grid grid-cols-3 gap-2 mb-3">
                           <button
                             onClick={() => {
                               setTool("rectangle");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center"
                           >
                             <FaSquare />
                           </button>
                           <button
                             onClick={() => {
                               setTool("circle");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center"
                           >
                             <FaCircle />
                           </button>
                           <button
                             onClick={() => {
                               setTool("triangle");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center"
                           >
                             ▲
                           </button>
                           <button
                             onClick={() => {
                               setTool("ellipse");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center"
                           >
                             ⬭
                           </button>
                           <button
                             onClick={() => {
                               setTool("polygon");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center"
                           >
                             ⬠
                           </button>
                         </div>
       
                         {/* Lines Section */}
                         <p className="text-xs font-semibold mb-2">Lines</p>
                         <div className="grid grid-cols-3 gap-2 mb-3">
                           <button
                             onClick={() => {
                               setTool("line");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-green-500 flex justify-center items-center"
                           >
                             <FaSlash />
                           </button>
                           <button
                             onClick={() => {
                               setLineStyle("solid");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-green-500 text-xs"
                           >
                             Solid
                           </button>
                           <button
                             onClick={() => {
                               setLineStyle("dashed");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-green-500 text-xs"
                           >
                             Dashed
                           </button>
                         </div>
       
                         {/* 3D Shapes Section */}
                         <p className="text-xs font-semibold mb-2">
                           3D Shapes (Future)
                         </p>
                         <div className="grid grid-cols-3 gap-2">
                           {/* Cube icon from Heroicons */}
                           <button
                             onClick={() => {
                               setTool("cube");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-red-500 flex justify-center items-center"
                           >
                             <HiOutlineCube size={20} />
                           </button>
                           {/* Sphere icon is not available, using "globe" as a substitute */}
                           <button
                             onClick={() => {
                               setTool("sphere");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-red-500 flex justify-center items-center"
                           >
                             <HiOutlineGlobe size={20} />
                           </button>
                           {/* Cylinder icon is not available, using a related icon as a substitute */}
                           <button
                             onClick={() => {
                               setTool("cylinder");
                               setShowShapes(false);
                             }}
                             className="p-2 border rounded hover:bg-red-500 flex justify-center items-center"
                           >
                             <HiOutlineDesktopComputer size={20} />
                           </button>
                         </div>
       
                         {/* --- Pen Size Selector --- */}
                         {tool === "pen" && (
                           <div className="flex flex-col items-center mt-2  p-2 rounded-lg shadow-md">
                             <label className="text-xs mb-1 ">
                               Pen Size
                             </label>
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
                         {tool === "eraser" && (
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

            <div className="relative mt-2">
              <button
                onClick={() => setShowColors(!showColors)}
                className="w-6 h-6 rounded-full border"
                style={{ backgroundColor: penColor }}
              />
              {showColors && (
                <div
                  className="absolute left-1/2 mt-1 -translate-x-1/2 border rounded shadow-md p-2 w-max"
                  style={{ backgroundColor: "var(--toolbar-bg)" }}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setPenColor(color);
                          setShowColors(false);
                        }}
                        className={`w-6 h-6 rounded-full border-2 ${
                          penColor === color
                            ? "border-black"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={handleUndo} className="p-2 rounded-full">
              <FaUndo size={20} />
            </button>
            <button onClick={handleRedo} className="p-2 rounded-full">
              <FaRedo size={20} />
            </button>
            <button onClick={handleClear} className="p-2 rounded-full">
              <FaTrash size={20} />
            </button>
            <button onClick={handleExport} className="p-2 rounded-full">
              <FaDownload size={20} />
            </button>
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
              className="p-2 rounded-full cursor-pointer"
            >
              <FaFileImport size={20} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectFeature;

// import React, { useRef, useState, useEffect } from "react";
// import { Stage, Layer, Line, Rect, Image, Circle, Ellipse, Transformer } from "react-konva";
// import useImage from "use-image";
// import {
//   FaPen,
//   FaEraser,
//   FaUndo,
//   FaRedo,
//   FaTrash,
//   FaDownload,
//   FaFileImport,
//   FaShapes,
//   FaSquare,
//   FaCircle,
//   FaSlash,
//   FaMousePointer, // <-- New Icon for Select
// } from "react-icons/fa";
// import {
//   HiOutlineCube,
//   HiOutlineGlobe,
//   HiOutlineDesktopComputer,
// } from "react-icons/hi";

// // Component to render imported background
// const BackgroundImage = ({ imageUrl }) => {
//   const [image] = useImage(imageUrl);
//   return <Image image={image} x={0} y={0} width={1100} height={600} />;
// };

// const SelectFeature = () => {
//   const stageRef = useRef(null);
//   const isDrawing = useRef(false);
//   const transformerRef = useRef(null);

//   // --- State ---
//   const [tool, setTool] = useState("pen"); // 'pen', 'eraser', 'rectangle', 'line', 'circle', 'select'
//   const [shapes, setShapes] = useState([]);
//   const [selectedId, setSelectedId] = useState(null);

//   // Undo/Redo
//   const [history, setHistory] = useState([[]]);
//   const [historyStep, setHistoryStep] = useState(0);

//   // Properties
//   const [penColor, setPenColor] = useState("#000000");
//   const [penSize, setPenSize] = useState(2);
//   const [eraserSize, setEraserSize] = useState(20);
//   const [backgroundImage, setBackgroundImage] = useState(null);
//   const [darkMode, setDarkMode] = useState(false);
//   const [showColors, setShowColors] = useState(false);
//   const [showShapes, setShowShapes] = useState(false);
//   const [lineStyle, setLineStyle] = useState(null);

//   const colors = [
//     "#000000",
//     "#FF0000",
//     "#008000",
//     "#0000FF",
//     "#f3f4f6",
//     "#FFCDD2",
//     "#FFF59D",
//     "#BBDEFB",
//   ];

//   // --- Drawing Logic ---
//   const handleMouseDown = (e) => {
//     if (tool === "select") {
//       const clickedOn = e.target;
//       if (clickedOn.getType() === "Stage") {
//         setSelectedId(null);
//         return;
//       }
//       setSelectedId(clickedOn.id());
//       return;
//     }

//     isDrawing.current = true;
//     const pos = e.target.getStage().getPointerPosition();
//     let newShape = {};

//     switch (tool) {
//       case "pen":
//       case "eraser":
//         newShape = {
//           id: `shape-${shapes.length + 1}`,
//           tool,
//           points: [pos.x, pos.y],
//           color: tool === "eraser" ? (darkMode ? "#1a202c" : "#ffffff") : penColor,
//           size: tool === "eraser" ? eraserSize : penSize,
//         };
//         break;
//       case "rectangle":
//         newShape = {
//           id: `shape-${shapes.length + 1}`,
//           tool,
//           x: pos.x,
//           y: pos.y,
//           width: 0,
//           height: 0,
//           color: penColor,
//           size: penSize,
//         };
//         break;
//       case "circle":
//         newShape = {
//           id: `shape-${shapes.length + 1}`,
//           tool,
//           x: pos.x,
//           y: pos.y,
//           radius: 0,
//           color: penColor,
//           size: penSize,
//         };
//         break;
//       case "line":
//         newShape = {
//           id: `shape-${shapes.length + 1}`,
//           tool,
//           points: [pos.x, pos.y, pos.x, pos.y],
//           color: penColor,
//           size: penSize,
//         };
//         break;
//       default:
//         return;
//     }
//     setShapes([...shapes, newShape]);
//   };

//   const handleMouseMove = (e) => {
//     if (!isDrawing.current || tool === "select") return;
//     const stage = e.target.getStage();
//     const point = stage.getPointerPosition();
//     let lastShape = shapes[shapes.length - 1];
//     if (!lastShape) return;

//     switch (lastShape.tool) {
//       case "pen":
//       case "eraser":
//         lastShape.points = lastShape.points.concat([point.x, point.y]);
//         break;
//       case "rectangle":
//         lastShape.width = point.x - lastShape.x;
//         lastShape.height = point.y - lastShape.y;
//         break;
//       case "circle": {
//         const dx = point.x - lastShape.x;
//         const dy = point.y - lastShape.y;
//         lastShape.radius = Math.sqrt(dx * dx + dy * dy);
//         break;
//       }
//       case "line":
//         lastShape.points = [
//           lastShape.points[0],
//           lastShape.points[1],
//           point.x,
//           point.y,
//         ];
//         break;
//       default:
//         return;
//     }

//     shapes.splice(shapes.length - 1, 1, lastShape);
//     setShapes([...shapes]);
//   };

//   const handleMouseUp = () => {
//     if (!isDrawing.current) return;
//     isDrawing.current = false;
//     const newHistory = history.slice(0, historyStep + 1);
//     setHistory([...newHistory, shapes]);
//     setHistoryStep(historyStep + 1);
//   };

//   // --- Attach transformer when selecting shape ---
//   useEffect(() => {
//     if (tool !== "select") return;
//     const transformer = transformerRef.current;
//     const stage = stageRef.current;
//     const selectedNode = stage.findOne(`#${selectedId}`);
//     if (selectedNode) {
//       transformer.nodes([selectedNode]);
//       transformer.getLayer().batchDraw();
//     } else {
//       transformer.nodes([]);
//       transformer.getLayer().batchDraw();
//     }
//   }, [selectedId, tool]);

//   // --- Toolbar Functions ---
//   const handleUndo = () => {
//     if (historyStep > 0) {
//       const newStep = historyStep - 1;
//       setHistoryStep(newStep);
//       setShapes(history[newStep]);
//     }
//   };
//   const handleRedo = () => {
//     if (historyStep < history.length - 1) {
//       const newStep = historyStep + 1;
//       setHistoryStep(newStep);
//       setShapes(history[newStep]);
//     }
//   };
//   const handleClear = () => {
//     setShapes([]);
//     setBackgroundImage(null);
//     setHistory([[]]);
//     setHistoryStep(0);
//     setSelectedId(null);
//   };
//   const handleExport = () => {
//     const uri = stageRef.current.toDataURL();
//     const link = document.createElement("a");
//     link.download = "whiteboard.png";
//     link.href = uri;
//     link.click();
//   };
//   const toggleDarkMode = () => {
//     setDarkMode(!darkMode);
//     document.body.classList.toggle("dark");
//   };

//   // --- Cursor Styles ---
//   const cursorStyles = {
//     pen: "crosshair",
//     eraser: "crosshair",
//     rectangle: "crosshair",
//     line: "crosshair",
//     circle: "crosshair",
//     select: "default",
//   };

//   return (
//     <div className="flex justify-center items-center min-h-screen">
//       <div className="flex rounded-xl shadow-lg p-4 relative w-[1100px] h-[600px]">
//         <div className="whiteboard-container flex w-full h-full gap-2">
//           {/* Canvas */}
//           <div
//             className="canvas-wrapper flex-1 h-full rounded-xl overflow-hidden"
//             style={{ cursor: cursorStyles[tool] || "default" }}
//           >
//             <Stage
//               width={1100}
//               height={600}
//               onMouseDown={handleMouseDown}
//               onMouseMove={handleMouseMove}
//               onMouseUp={handleMouseUp}
//               ref={stageRef}
//             >
//               <Layer>
//                 {backgroundImage && <BackgroundImage imageUrl={backgroundImage} />}
//                 {!backgroundImage && (
//                   <Rect
//                     x={0}
//                     y={0}
//                     width={1100}
//                     height={600}
//                     fill={darkMode ? "#1a202c" : "#ffffff"}
//                   />
//                 )}

//                 {shapes.map((shape, i) => {
//                   switch (shape.tool) {
//                     case "pen":
//                       return (
//                         <Line
//                           key={i}
//                           id={shape.id}
//                           points={shape.points}
//                           stroke={shape.color}
//                           strokeWidth={shape.size}
//                           tension={0.5}
//                           lineCap="round"
//                           draggable={tool === "select"}
//                         />
//                       );
//                     case "rectangle":
//                       return (
//                         <Rect
//                           key={i}
//                           id={shape.id}
//                           x={shape.x}
//                           y={shape.y}
//                           width={shape.width}
//                           height={shape.height}
//                           stroke={shape.color}
//                           strokeWidth={shape.size}
//                           draggable={tool === "select"}
//                         />
//                       );
//                     case "circle":
//                       return (
//                         <Circle
//                           key={i}
//                           id={shape.id}
//                           x={shape.x}
//                           y={shape.y}
//                           radius={shape.radius}
//                           stroke={shape.color}
//                           strokeWidth={shape.size}
//                           draggable={tool === "select"}
//                         />
//                       );
//                     case "line":
//                       return (
//                         <Line
//                           key={i}
//                           id={shape.id}
//                           points={shape.points}
//                           stroke={shape.color}
//                           strokeWidth={shape.size}
//                           lineCap="round"
//                           dash={lineStyle === "dashed" ? [10, 5] : []}
//                           draggable={tool === "select"}
//                         />
//                       );
//                     default:
//                       return null;
//                   }
//                 })}

//                 {/* Transformer (for resize/drag) */}
//                 <Transformer ref={transformerRef} rotateEnabled={true} />
//               </Layer>
//             </Stage>
//           </div>

//           {/* Toolbar */}
//           <div className="toolbar flex flex-col gap-2 h-full w-24 items-center p-2 rounded-xl">
//             <button onClick={toggleDarkMode} className="p-2 rounded-full">
//               {darkMode ? "☀️" : "🌙"}
//             </button>

//             {/* Pen */}
//             <button
//               onClick={() => setTool("pen")}
//               className={`p-2 rounded-full ${tool === "pen" ? "bg-blue-100 text-blue-600" : ""}`}
//             >
//               <FaPen size={20} />
//             </button>

//             {/* Eraser */}
//             <button
//               onClick={() => setTool("eraser")}
//               className={`p-2 rounded-full ${tool === "eraser" ? "bg-blue-100 text-blue-600" : ""}`}
//             >
//               <FaEraser size={20} />
//             </button>

//             {/* Select */}
//             <button
//               onClick={() => setTool("select")}
//               className={`p-2 rounded-full ${tool === "select" ? "bg-blue-100 text-blue-600" : ""}`}
//             >
//               <FaMousePointer size={20} />
//             </button>

//             {/* Shapes Menu */}
//             <div className="relative flex flex-col items-center">
//               <button
//                 onClick={() => setShowShapes(!showShapes)}
//                 className={`p-2 rounded-full ${
//                   ["rectangle", "line", "circle"].includes(tool)
//                     ? "bg-blue-100 text-blue-600"
//                     : ""
//                 }`}
//               >
//                 <FaShapes size={20} />
//               </button>
//               {showShapes && (
//                 <div className="absolute -left-56 top-1/2 -translate-y-1/2 border rounded-2xl shadow-xl p-3 z-20 w-52 bg-white">
//                   <p className="text-xs font-semibold mb-2 ">2D Shapes</p>
//                   <div className="grid grid-cols-3 gap-2 mb-3">
//                     <button onClick={() => { setTool("rectangle"); setShowShapes(false); }}>
//                       <FaSquare />
//                     </button>
//                     <button onClick={() => { setTool("circle"); setShowShapes(false); }}>
//                       <FaCircle />
//                     </button>
//                     <button onClick={() => { setTool("line"); setShowShapes(false); }}>
//                       <FaSlash />
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Colors */}
//             <div className="relative mt-2">
//               <button
//                 onClick={() => setShowColors(!showColors)}
//                 className="w-6 h-6 rounded-full border"
//                 style={{ backgroundColor: penColor }}
//               />
//               {showColors && (
//                 <div className="absolute left-1/2 mt-1 -translate-x-1/2 border rounded shadow-md p-2 w-max bg-white">
//                   <div className="grid grid-cols-3 gap-2">
//                     {colors.map((color) => (
//                       <button
//                         key={color}
//                         onClick={() => {
//                           setPenColor(color);
//                           setShowColors(false);
//                         }}
//                         className="w-6 h-6 rounded-full border"
//                         style={{ backgroundColor: color }}
//                       />
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Undo/Redo/Clear/Export */}
//             <button onClick={handleUndo}><FaUndo size={20} /></button>
//             <button onClick={handleRedo}><FaRedo size={20} /></button>
//             <button onClick={handleClear}><FaTrash size={20} /></button>
//             <button onClick={handleExport}><FaDownload size={20} /></button>

//             {/* Import Image */}
//             <input
//               type="file"
//               accept="image/*"
//               id="import-image"
//               className="hidden"
//               onChange={(e) => {
//                 const file = e.target.files[0];
//                 if (!file) return;
//                 const reader = new FileReader();
//                 reader.onload = () => setBackgroundImage(reader.result);
//                 reader.readAsDataURL(file);
//               }}
//             />
//             <label htmlFor="import-image" className="p-2 rounded-full cursor-pointer">
//               <FaFileImport size={20} />
//             </label>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SelectFeature;
