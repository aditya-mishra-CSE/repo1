//This code works well (bas thoda shape resize krne pr undo redo ks issue aa rha baki sb sahi hai)

import { useRef, useState, useEffect } from "react";
import {
  Stage,
  Layer,
  Line,
  Rect,
  Image as KonvaImage,
  Circle,
  Transformer,
  Ellipse,
  Group,
  RegularPolygon,
  Arrow,
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
const BackgroundImage = ({ imageUrl, width, height }) => {
  const [image] = useImage(imageUrl);
  return (
    <KonvaImage
      image={image}
      x={0}
      y={0}
       width={width}
      height={height}
      listening={false}
    />
  );
};


const ImageShape = ({ shape, onSelect, onChange, tool }) => {
  const [img] = useImage(shape.src); // hook at top-level inside component

  return (
    <KonvaImage
      id={shape.id}
      image={img}
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      rotation={shape.rotation || 0}
      draggable={tool === "select"}
      onClick={() => tool === "select" && onSelect(shape.id)}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          ...shape,
          x: node.x(),
          y: node.y(),
          width: node.width() * node.scaleX(),
          height: node.height() * node.scaleY(),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
};

export default function Manage() {
  const stageRef = useRef(null);
  const isDrawing = useRef(false);
  const transformerRef = useRef(null);

  // --- STATE MANAGEMENT ---
  const [tool, setTool] = useState("pen"); // 'pen', 'eraser', 'select', etc.
  const [shapes, setShapes] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // which shape is selected

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

  const [stageSize, setStageSize] = useState({
  width: window.innerWidth * 0.8,   // 80% of screen width
  height: window.innerHeight * 0.8, // 80% of screen height
});

useEffect(() => {
  const handleResize = () => {
    setStageSize({
      width: window.innerWidth * 0.8,
      height: window.innerHeight * 0.8,
    });
  };
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);


  // --- SELECTION AND DRAWING LOGIC ---
  const checkDeselect = (e) => {
    // e.target is the node that was clicked
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null); // deselect
    }
  };
  const handleMouseDown = (e) => {
    // selection first if in 'select' mode
    if (tool === "select") {
      const clickedOnStage = e.target.getStage() === e.target;
      const clickedOnShape = !clickedOnStage && e.target.attrs.id;

      if (clickedOnShape) {
        setSelectedId(e.target.attrs.id);
      } else {
        setSelectedId(null);
      }
      return;
    }

    // drawing
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const id = Date.now().toString() + Math.random();
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
      case "triangle":
        newShape = {
          id,
          tool,
          x: pos.x, // top point x
          y: pos.y, // top point y
          width: 0, // will expand as user drags
          height: 0, // will expand as user drags
          color: penColor,
          size: penSize,
        };
        break;
      case "ellipse":
        newShape = {
          id,
          tool,
          x: pos.x,
          y: pos.y,
          radiusX: 0,
          radiusY: 0,
          color: penColor,
          size: penSize,
        };
        break;

      case "polygon": // default hexagon (6 sides)
        newShape = {
          id,
          tool,
          x: pos.x,
          y: pos.y,
          sides: 6,
          radius: 0,
          color: penColor,
          size: penSize,
        };
        break;

      case "arrow":
      case "dashed":
        newShape = {
          id,
          tool,
          points: [pos.x, pos.y, pos.x + 1, pos.y + 1], // start + dummy end point
          color: penColor,
          size: penSize,
        };
        break;

      case "cube":
        newShape = {
          id,
          tool,
          x: pos.x,
          y: pos.y,
          size: 0,
          color: penColor,
          stroke: penColor,
        };
        break;

      case "sphere":
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

      case "cylinder":
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
      default:
        return;
    }
    setShapes((prev) => [...prev, newShape]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current || tool === "select") return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastShape = shapes[shapes.length - 1];
    if (!lastShape) return;

    if (tool === "eraser") {
      const stage = e.target.getStage();
      const point = stage.getPointerPosition();
      if (!point) return;

      const newShapes = [...shapes];

      // iterate from top-most shape
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        let erase = false;

        if (shape.tool === "rectangle") {
          const minX = Math.min(shape.x, shape.x + shape.width);
          const maxX = Math.max(shape.x, shape.x + shape.width);
          const minY = Math.min(shape.y, shape.y + shape.height);
          const maxY = Math.max(shape.y, shape.y + shape.height);

          erase =
            point.x >= minX &&
            point.x <= maxX &&
            point.y >= minY &&
            point.y <= maxY;
        } else if (shape.tool === "circle") {
          const dx = point.x - shape.x;
          const dy = point.y - shape.y;
          erase = Math.sqrt(dx * dx + dy * dy) <= shape.radius;
        } else if (shape.tool === "pen" || shape.tool === "line") {
          if (shape.points && shape.points.length > 3) {
            for (let idx = 0; idx < shape.points.length - 2; idx += 2) {
              const x1 = shape.points[idx];
              const y1 = shape.points[idx + 1];
              const x2 = shape.points[idx + 2];
              const y2 = shape.points[idx + 3];

              // --- Inline point-to-segment distance ---
              const A = point.x - x1;
              const B = point.y - y1;
              const C = x2 - x1;
              const D = y2 - y1;

              const dot = A * C + B * D;
              const lenSq = C * C + D * D;
              let param = -1;
              if (lenSq !== 0) param = dot / lenSq;

              let xx, yy;
              if (param < 0) {
                xx = x1;
                yy = y1;
              } else if (param > 1) {
                xx = x2;
                yy = y2;
              } else {
                xx = x1 + param * C;
                yy = y1 + param * D;
              }

              const dx = point.x - xx;
              const dy = point.y - yy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              // --- End inline distance ---

              if (dist <= eraserSize) {
                erase = true;
                break;
              }
            }
          }
        } else if (shape.tool === "triangle") {
          // Triangle points: top, bottom-left, bottom-right
          const points = [
            shape.x,
            shape.y, // top
            shape.x - shape.width / 2,
            shape.y + shape.height, // bottom-left
            shape.x + shape.width / 2,
            shape.y + shape.height, // bottom-right
          ];

          const [x1, y1, x2, y2, x3, y3] = points;

          // Area method to check if point is inside triangle
          const areaOrig = Math.abs(
            (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)
          );
          const area1 = Math.abs(
            (x1 - point.x) * (y2 - point.y) - (x2 - point.x) * (y1 - point.y)
          );
          const area2 = Math.abs(
            (x2 - point.x) * (y3 - point.y) - (x3 - point.x) * (y2 - point.y)
          );
          const area3 = Math.abs(
            (x3 - point.x) * (y1 - point.y) - (x1 - point.x) * (y3 - point.y)
          );

          erase = area1 + area2 + area3 <= areaOrig + 0.1; // small tolerance
        } else if (shape.tool === "ellipse") {
          const dx = (point.x - shape.x) / shape.radiusX;
          const dy = (point.y - shape.y) / shape.radiusY;
          erase = dx * dx + dy * dy <= 1; // inside ellipse formula
        } else if (shape.tool === "arrow" || shape.tool === "dashed") {
          if (shape.points && shape.points.length >= 4) {
            const [x1, y1, x2, y2] = shape.points;

            // Distance from point to line segment
            const A = point.x - x1;
            const B = point.y - y1;
            const C = x2 - x1;
            const D = y2 - y1;

            const dot = A * C + B * D;
            const len_sq = C * C + D * D;
            let param = -1;
            if (len_sq !== 0) param = dot / len_sq;

            let xx, yy;
            if (param < 0) {
              xx = x1;
              yy = y1;
            } else if (param > 1) {
              xx = x2;
              yy = y2;
            } else {
              xx = x1 + param * C;
              yy = y1 + param * D;
            }

            const dx = point.x - xx;
            const dy = point.y - yy;
            erase = Math.sqrt(dx * dx + dy * dy) <= eraserSize;
          }
        }

        // Polygon erase check
        else if (shape.tool === "polygon") {
          if (shape.sides && shape.radius) {
            const dx = point.x - shape.x;
            const dy = point.y - shape.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= shape.radius + eraserSize) {
              erase = true;
            }
          }
        }

        // Cylinder erase check
        else if (shape.tool === "cylinder") {
          const dx =
            (point.x - (shape.x + shape.width / 2)) / (shape.width / 2);
          const dyTop = (point.y - shape.y) / 10;
          const dyBottom = (point.y - (shape.y + shape.height)) / 10;

          const insideTop = dx * dx + dyTop * dyTop <= 1;
          const insideBottom = dx * dx + dyBottom * dyBottom <= 1;

          const insideBody =
            point.x >= shape.x - eraserSize &&
            point.x <= shape.x + shape.width + eraserSize &&
            point.y >= shape.y - eraserSize &&
            point.y <= shape.y + shape.height + eraserSize;

          if (insideTop || insideBottom || insideBody) {
            erase = true;
          }
        } else if (shape.tool === "cube") {
          const size = shape.size;
          const offset = size / 2;

          // bounding box covering both front + back faces
          const minX = Math.min(
            shape.x,
            shape.x + size,
            shape.x + offset,
            shape.x + size + offset
          );
          const maxX = Math.max(
            shape.x,
            shape.x + size,
            shape.x + offset,
            shape.x + size + offset
          );
          const minY = Math.min(
            shape.y,
            shape.y + size,
            shape.y - offset,
            shape.y + size - offset
          );
          const maxY = Math.max(
            shape.y,
            shape.y + size,
            shape.y - offset,
            shape.y + size - offset
          );

          const tolerance = 10;

          erase =
            point.x >= minX - tolerance &&
            point.x <= maxX + tolerance &&
            point.y >= minY - tolerance &&
            point.y <= maxY + tolerance;
        } else if (shape.tool === "sphere") {
          // Same as circle
          const dx = point.x - shape.x;
          const dy = point.y - shape.y;
          erase = Math.sqrt(dx * dx + dy * dy) <= shape.radius;
        }

        if (erase) {
          newShapes.splice(i, 1); // remove only this shape
          break; // stop after erasing top-most
        }
      }

      setShapes(newShapes);
      return;
    }

    switch (lastShape.tool) {
      case "pen": // Clamp pen points inside canvas
      {
        const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
        const clampedY = Math.max(0, Math.min(point.y, stageSize.height));
        lastShape.points = lastShape.points.concat([clampedX, clampedY]);
        break;
      }

      case "rectangle": {
        // Clamp pointer to stage boundaries
        const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
        const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

        // Calculate width/height but prevent crossing stage
        lastShape.width = clampedX - lastShape.x;
        lastShape.height = clampedY - lastShape.y;

        // Optional: prevent negative width/height if dragging left/up
        if (lastShape.x + lastShape.width > stageSize.width)
          lastShape.width = stageSize.width - lastShape.x;
        if (lastShape.y + lastShape.height > stageSize.height)
          lastShape.height = stageSize.height - lastShape.y;
        if (lastShape.x + lastShape.width < 0) lastShape.width = -lastShape.x;
        if (lastShape.y + lastShape.height < 0) lastShape.height = -lastShape.y;
        break;
      }

      case "circle": {
        // Clamp pointer inside canvas
        const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
        const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

        const dx = clampedX - lastShape.x;
        const dy = clampedY - lastShape.y;

        // radius = distance from center to clamped pointer
        let radius = Math.sqrt(dx * dx + dy * dy);

        // Make sure radius does not exceed canvas bounds
        const maxRadiusX = Math.min(lastShape.x, stageSize.width - lastShape.x);
        const maxRadiusY = Math.min(lastShape.y, stageSize.height - lastShape.y);
        lastShape.radius = Math.min(radius, maxRadiusX, maxRadiusY);
        break;
      }

      case "triangle": {
        const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
        const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

        let width = clampedX - lastShape.x;
        let height = clampedY - lastShape.y;

        // Adjust width if left or right crosses stage
        const leftEdge = lastShape.x - width / 2;
        const rightEdge = lastShape.x + width / 2;
        if (leftEdge < 0) width = lastShape.x * 2;
        if (rightEdge > stageSize.width) width = (stageSize.width - lastShape.x) * 2;

        // Adjust height if top or bottom crosses stage
        if (lastShape.y + height > stageSize.height) height = stageSize.height - lastShape.y;
        if (lastShape.y + height < 0) height = -lastShape.y;

        lastShape.width = width;
        lastShape.height = height;
        break;
      }

      case "line":
        lastShape.points = [
          Math.max(0, Math.min(lastShape.points[0], stageSize.width)),
          Math.max(0, Math.min(lastShape.points[1], stageSize.height)),
          Math.max(0, Math.min(point.x, stageSize.width)),
          Math.max(0, Math.min(point.y, stageSize.height)),
        ];
        break;
      case "ellipse": {
        const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
        const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

        lastShape.radiusX = Math.min(
          Math.abs(clampedX - lastShape.x),
          lastShape.x,
          stageSize.width - lastShape.x
        );
        lastShape.radiusY = Math.min(
          Math.abs(clampedY - lastShape.y),
          lastShape.y,
          stageSize.height - lastShape.y
        );
        break;
      }

      case "polygon": {
        const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
        const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

        const dx = clampedX - lastShape.x;
        const dy = clampedY - lastShape.y;
        const maxRadiusX = Math.min(lastShape.x, stageSize.width - lastShape.x);
        const maxRadiusY = Math.min(lastShape.y, stageSize.height - lastShape.y);
        lastShape.radius = Math.min(
          Math.sqrt(dx * dx + dy * dy),
          maxRadiusX,
          maxRadiusY
        );
        break;
      }

      case "arrow":
      case "dashed":
        lastShape.points = [
          Math.max(0, Math.min(lastShape.points[0], stageSize.width)),
          Math.max(0, Math.min(lastShape.points[1], stageSize.height)),
          Math.max(0, Math.min(point.x, stageSize.width)),
          Math.max(0, Math.min(point.y, stageSize.height)),
        ];
        break;

      case "cube": {
        const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
        const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

        let size = Math.max(
          Math.abs(clampedX - lastShape.x),
          Math.abs(clampedY - lastShape.y)
        );

        // Prevent crossing stage boundaries
        if (lastShape.x + size > stageSize.width) size = stageSize.width - lastShape.x;
        if (lastShape.y + size > stageSize.height) size = stageSize.height - lastShape.y;

        lastShape.size = size;
        break;
      }

      case "sphere": {
        const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
        const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

        const dx = clampedX - lastShape.x;
        const dy = clampedY - lastShape.y;
        lastShape.radius = Math.min(
          Math.sqrt(dx * dx + dy * dy),
          lastShape.x,
          stageSize.width - lastShape.x,
          lastShape.y,
          stageSize.height - lastShape.y
        );
        break;
      }

      case "cylinder": {
        const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
        const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

        let width = clampedX - lastShape.x;
        let height = clampedY - lastShape.y;

        // Clamp width/height so shape stays inside stage
        if (lastShape.x + width > stageSize.width) width = stageSize.width - lastShape.x;
        if (lastShape.y + height > stageSize.height) height = stageSize.height - lastShape.y;
        if (lastShape.x + width < 0) width = -lastShape.x;
        if (lastShape.y + height < 0) height = -lastShape.y;

        lastShape.width = width;
        lastShape.height = height;
        break;
      }

      default:
        break;
    }

    const next = shapes.slice();
    next.splice(shapes.length - 1, 1, lastShape);
    setShapes(next);
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    const lastShape = shapes[shapes.length - 1];
    if (lastShape && lastShape.tool !== "pen" && lastShape.tool !== "eraser") {
      setSelectedId(lastShape.id); // ✅ auto-select only shapes
      // setTool("select");             // switch to select mode
    }

    const newHistory = history.slice(0, historyStep + 1);
    setHistory([...newHistory, shapes]);
    setHistoryStep(historyStep + 1);
  };

  const applyShapes = (newShapes) => {
    newShapes.forEach((shape) => {
      if (shape.tool === "image") preloadImage(shape.src);
    });
    setShapes(newShapes);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      applyShapes(history[newStep]);
      // 🔑 Clear selection + transformer
      setSelectedId(null);
      const tr = transformerRef.current;
      if (tr) {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
      }
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      applyShapes(history[newStep]);
      // 🔑 Clear selection + transformer
      setSelectedId(null);
      const tr = transformerRef.current;
      if (tr) {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
      }
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
      const node = stageRef.current.findOne("#" + selectedId);

      // Skip freehand nodes (pen/eraser)
      if (node && !node.hasName("freehand")) {
        transformerRef.current.nodes([node]);
      } else {
        transformerRef.current.nodes([]);
      }

      transformerRef.current.getLayer()?.batchDraw(); // redraw
    }
  }, [selectedId]);

  useEffect(() => {
    if (tool !== "select") {
      setSelectedId(null);
      const tr = transformerRef.current;
      if (tr) {
        tr.nodes([]);
        tr.getLayer()?.batchDraw();
      }
    }
  }, [tool]);

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
  const [imageCache, setImageCache] = useState({}); // { src: HTMLImageElement }

  const preloadImage = (src) => {
    if (!imageCache[src]) {
      const img = new window.Image();
      img.src = src;
      img.onload = () => setImageCache((prev) => ({ ...prev, [src]: img }));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="whiteboard-container">
        <div
          className="canvas-wrapper flex-1 h-full rounded-xl overflow-hidden"
          style={{ cursor: cursorStyles[tool] || "default" }}
        >
          <Stage
            width={stageSize.width}
  height={stageSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={checkDeselect}
            ref={stageRef}
            style={{ backgroundColor: "var(--canvas-bg)" }}
          >
            <Layer>
              {backgroundImage && (
                <BackgroundImage imageUrl={backgroundImage}  width={stageSize.width}
        height={stageSize.height}/>
              )}
              {!backgroundImage && (
                <Rect
                  x={0}
                  y={0}
                 width={stageSize.width}
        height={stageSize.height}
                  fill={darkMode ? "#1a202c" : "#ffffff"}
                  listening={false}
                />
              )}

              {shapes.map((shape, i) => {
                switch (shape.tool) {
                  case "pen": // freehand lines
                    return (
                      <Line
                        key={i}
                        id={shape.id}
                        points={shape.points}
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        name="freehand"
                        tension={0.5}
                        lineCap="round"
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        draggable={false} // ✅ prevent dragging
                      />
                    );

                  case "eraser":
                    return null; // don’t render anything visually

                  case "line": // straight line
                    return (
                      <Line
                        key={i}
                        id={shape.id}
                        points={shape.points} // [x1, y1, x2, y2]
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        lineCap="round"
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
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
                        fill="transparent"
                        draggable={tool === "select"}
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          const newShapes = shapes.slice();
                          newShapes[i] = {
                            ...newShapes[i],
                            x: node.x(),
                            y: node.y(),
                            width: shape.width * scaleX,
                            height: shape.height * scaleY,
                            rotation: node.rotation(),
                          };

                          setShapes(newShapes);

                          // reset scale so next transforms apply correctly
                          node.scaleX(1);
                          node.scaleY(1);
                        }}
                      />
                    );
                  case "triangle":
                    return (
                      <Line
                        key={shape.id}
                        id={shape.id}
                        x={shape.x} // use node position
                        y={shape.y}
                        points={[
                          0,
                          0, // top
                          -shape.width / 2,
                          shape.height, // bottom left
                          shape.width / 2,
                          shape.height, // bottom right
                        ]}
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        fill="transparent"
                        closed
                        draggable={tool === "select"}
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const newShapes = shapes.slice();

                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          newShapes[i] = {
                            ...newShapes[i],
                            x: node.x(),
                            y: node.y(),
                            width: shape.width * scaleX,
                            height: shape.height * scaleY,
                            rotation: node.rotation(),
                          };

                          setShapes(newShapes);

                          // reset scale
                          node.scaleX(1);
                          node.scaleY(1);
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
                        fill="transparent"
                        draggable={tool === "select"}
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();

                          const newShapes = shapes.slice();
                          newShapes[i] = {
                            ...newShapes[i],
                            x: node.x(),
                            y: node.y(),
                            radius: shape.radius * scaleX, // uniform scaling
                            rotation: node.rotation(),
                          };

                          setShapes(newShapes);

                          node.scaleX(1);
                          node.scaleY(1);
                        }}
                      />
                    );
                  case "ellipse":
                    return (
                      <Ellipse
                        key={i}
                        id={shape.id}
                        x={shape.x}
                        y={shape.y}
                        radiusX={Math.abs(shape.radiusX)}
                        radiusY={Math.abs(shape.radiusY)}
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        draggable={tool === "select"}
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          const newShapes = shapes.slice();
                          newShapes[i] = {
                            ...newShapes[i],
                            x: node.x(),
                            y: node.y(),
                            radiusX: Math.abs(shape.radiusX * scaleX),
                            radiusY: Math.abs(shape.radiusY * scaleY),
                            rotation: node.rotation(),
                          };

                          setShapes(newShapes);
                          node.scaleX(1);
                          node.scaleY(1);
                        }}
                      />
                    );

                  case "polygon":
                    return (
                      <RegularPolygon
                        key={i}
                        id={shape.id}
                        x={shape.x}
                        y={shape.y}
                        sides={shape.sides}
                        radius={shape.radius}
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        draggable={tool === "select"}
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();

                          const newShapes = shapes.slice();
                          newShapes[i] = {
                            ...newShapes[i],
                            x: node.x(),
                            y: node.y(),
                            radius: shape.radius * scaleX, // polygons scale uniformly
                            rotation: node.rotation(),
                          };

                          setShapes(newShapes);
                          node.scaleX(1);
                          node.scaleY(1);
                        }}
                      />
                    );

                  case "arrow":
                    return (
                      <Arrow
                        key={i}
                        id={shape.id}
                        points={shape.points}
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        fill={shape.color}
                        pointerLength={12}
                        pointerWidth={12}
                        lineCap="round"
                        lineJoin="round"
                        hitStrokeWidth={20}
                        draggable={tool === "select"}
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          const newPoints = shape.points.map((p, idx) =>
                            idx % 2 === 0 ? p * scaleX : p * scaleY
                          );

                          const newShapes = shapes.slice();
                          newShapes[i] = {
                            ...newShapes[i],
                            x: node.x(),
                            y: node.y(),
                            points: newPoints,
                            rotation: node.rotation(),
                          };

                          setShapes(newShapes);
                          node.scaleX(1);
                          node.scaleY(1);
                        }}
                      />
                    );

                  case "dashed":
                    return (
                      <Line
                        key={i}
                        id={shape.id}
                        points={shape.points}
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        dash={[10, 5]}
                        lineCap="round"
                        lineJoin="round"
                        hitStrokeWidth={20}
                        draggable={tool === "select"}
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          const newPoints = shape.points.map((p, idx) =>
                            idx % 2 === 0 ? p * scaleX : p * scaleY
                          );

                          const newShapes = shapes.slice();
                          newShapes[i] = {
                            ...newShapes[i],
                            x: node.x(),
                            y: node.y(),
                            points: newPoints,
                            rotation: node.rotation(),
                          };

                          setShapes(newShapes);
                          node.scaleX(1);
                          node.scaleY(1);
                        }}
                      />
                    );

                  //   case "cube": {
                  //     const size = shape.size;
                  //     const offset = size / 2; // depth offset for 3D effect

                  //     // Front face
                  //     const frontPoints = [
                  //       shape.x,
                  //       shape.y,
                  //       shape.x + size,
                  //       shape.y,
                  //       shape.x + size,
                  //       shape.y + size,
                  //       shape.x,
                  //       shape.y + size,
                  //     ];

                  //     // Back face (shifted by offset)
                  //     const backPoints = [
                  //       shape.x + offset,
                  //       shape.y - offset,
                  //       shape.x + size + offset,
                  //       shape.y - offset,
                  //       shape.x + size + offset,
                  //       shape.y + size - offset,
                  //       shape.x + offset,
                  //       shape.y + size - offset,
                  //     ];

                  //     return (
                  //       <Group key={i} draggable={tool === "select"}>
                  //         {/* Front face */}
                  //         <Line
                  //           id={shape.id}
                  //           points={frontPoints}
                  //           stroke={shape.color}
                  //           closed
                  //         />

                  //         {/* Back face */}
                  //         <Line points={backPoints} stroke={shape.color} closed />

                  //         {/* Connectors */}
                  //         <Line
                  //           points={[
                  //             frontPoints[0],
                  //             frontPoints[1],
                  //             backPoints[0],
                  //             backPoints[1],
                  //           ]}
                  //           stroke={shape.color}
                  //         />
                  //         <Line
                  //           points={[
                  //             frontPoints[2],
                  //             frontPoints[3],
                  //             backPoints[2],
                  //             backPoints[3],
                  //           ]}
                  //           stroke={shape.color}
                  //         />
                  //         <Line
                  //           points={[
                  //             frontPoints[4],
                  //             frontPoints[5],
                  //             backPoints[4],
                  //             backPoints[5],
                  //           ]}
                  //           stroke={shape.color}
                  //         />
                  //         <Line
                  //           points={[
                  //             frontPoints[6],
                  //             frontPoints[7],
                  //             backPoints[6],
                  //             backPoints[7],
                  //           ]}
                  //           stroke={shape.color}
                  //         />
                  //       </Group>
                  //     );
                  //   }

                  case "cube": {
                    const size = shape.size;
                    const offset = size / 2;

                    // children use local coordinates (relative to Group origin)
                    const front = [0, 0, size, 0, size, size, 0, size];
                    const back = [
                      offset,
                      -offset,
                      size + offset,
                      -offset,
                      size + offset,
                      size - offset,
                      offset,
                      size - offset,
                    ];

                    return (
                      <Group
                        key={shape.id} // stable key
                        id={shape.id} // Transformer attaches to the GROUP
                        name="cube"
                        x={shape.x}
                        y={shape.y}
                        draggable={tool === "select"}
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          // uniform resize: keep cube square
                          const scale = Math.max(scaleX, scaleY);

                          const updated = {
                            ...shape,
                            x: node.x(),
                            y: node.y(),
                            size: Math.max(2, shape.size * scale),
                          };

                          // reset internal Konva scale so state is the source of truth
                          node.scaleX(1);
                          node.scaleY(1);

                          const updatedList = shapes.map((s) =>
                            s.id === shape.id ? updated : s
                          );
                          setShapes(updatedList);

                          // reattach transformer to the same (re-rendered) Group
                          requestAnimationFrame(() => {
                            const stage = stageRef.current;
                            const tr = transformerRef.current;
                            if (!stage || !tr) return;
                            const n = stage.findOne(`#${shape.id}`);
                            if (n) {
                              tr.nodes([n]);
                              tr.getLayer()?.batchDraw();
                            }
                          });
                        }}
                      >
                        {/* Front face */}
                        <Line points={front} stroke={shape.color} closed />
                        {/* Back face */}
                        <Line points={back} stroke={shape.color} closed />
                        {/* Connectors */}
                        <Line
                          points={[front[0], front[1], back[0], back[1]]}
                          stroke={shape.color}
                        />
                        <Line
                          points={[front[2], front[3], back[2], back[3]]}
                          stroke={shape.color}
                        />
                        <Line
                          points={[front[4], front[5], back[4], back[5]]}
                          stroke={shape.color}
                        />
                        <Line
                          points={[front[6], front[7], back[6], back[7]]}
                          stroke={shape.color}
                        />
                      </Group>
                    );
                  }

                  case "sphere":
                    return (
                      <Circle
                        key={i}
                        id={shape.id}
                        x={shape.x}
                        y={shape.y}
                        radius={shape.radius}
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        fillLinearGradientStartPoint={{
                          x: -shape.radius,
                          y: -shape.radius,
                        }}
                        fillLinearGradientEndPoint={{
                          x: shape.radius,
                          y: shape.radius,
                        }}
                        fillLinearGradientColorStops={[
                          0,
                          "white",
                          1,
                          shape.color,
                        ]}
                        draggable={tool === "select"}
                      />
                    );
                  case "cylinder": {
                    return (
                      <Group
                        key={shape.id}
                        id={shape.id} // ✅ important: transformer attaches here
                        x={shape.x}
                        y={shape.y}
                        draggable={tool === "select"}
                        onClick={() =>
                          tool === "select" && setSelectedId(shape.id)
                        }
                        onTransformEnd={(e) => {
                          const node = e.target;
                          const scaleX = node.scaleX();
                          const scaleY = node.scaleY();

                          const updated = {
                            ...shape,
                            x: node.x(),
                            y: node.y(),
                            width: Math.max(5, shape.width * scaleX),
                            height: Math.max(5, shape.height * scaleY),
                          };

                          // reset internal transform (we keep state as source of truth)
                          node.scaleX(1);
                          node.scaleY(1);

                          const updatedShapes = shapes.map((s) =>
                            s.id === shape.id ? updated : s
                          );
                          setShapes(updatedShapes);

                          // re-attach transformer
                          requestAnimationFrame(() => {
                            const stage = stageRef.current;
                            const tr = transformerRef.current;
                            if (!stage || !tr) return;
                            const n = stage.findOne(`#${shape.id}`);
                            if (n) {
                              tr.nodes([n]);
                              tr.getLayer()?.batchDraw();
                            }
                          });
                        }}
                      >
                        {/* Rect (body) - local coords inside Group */}
                        <Rect
                          x={0}
                          y={0}
                          width={shape.width}
                          height={shape.height}
                          stroke={shape.color}
                          strokeWidth={shape.size}
                        />

                        {/* Top ellipse */}
                        <Ellipse
                          x={shape.width / 2}
                          y={0}
                          radiusX={Math.abs(shape.width / 2)}
                          radiusY={15}
                          stroke={shape.color}
                          strokeWidth={shape.size}
                        />

                        {/* Bottom ellipse */}
                        <Ellipse
                          x={shape.width / 2}
                          y={shape.height}
                          radiusX={Math.abs(shape.width / 2)}
                          radiusY={15}
                          stroke={shape.color}
                          strokeWidth={shape.size}
                        />
                      </Group>
                    );
                  }

                  case "image":
                    return (
                      <ImageShape
                        key={shape.id}
                        shape={shape}
                        tool={tool}
                        image={imageCache[shape.src]} // pass HTMLImageElement
                        isSelected={selectedId === shape.id}
                        onSelect={setSelectedId}
                        onChange={(newShape) => {
                          const newShapes = shapes.slice();
                          newShapes[i] = newShape;
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
                visible={Boolean(selectedId && tool === "select")}
                rotateEnabled={true}
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                  "middle-left",
                  "middle-right",
                  "top-center",
                  "bottom-center",
                ]}
              />
            </Layer>
          </Stage>
        </div>

        <div className="toolbar h-full w-18 items-center p-2 rounded-xl">
          <button onClick={toggleDarkMode} className="p-2 rounded-full">
            {darkMode ? "☀️" : "🌙"}
          </button>

          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded-full ${
              tool === "pen" ? "bg-blue-100 text-blue-stageSize.height" : ""
            }`}
          >
            <FaPen size={20} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-full ${
              tool === "eraser" ? "bg-blue-100 text-blue-stageSize.height" : ""
            }`}
          >
            <FaEraser size={20} />
          </button>
          <button
            onClick={() => setTool("select")}
            className={`p-2 rounded-full ${
              tool === "select" ? "bg-blue-100 text-blue-stageSize.height" : ""
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
                  "dashed",
                  "arrow",
                  "cube",
                  "sphere",
                  "cylinder",
                ].includes(tool)
                  ? "bg-blue-100 text-blue-stageSize.height"
                  : ""
              }`}
            >
              <FaShapes size={20} />
            </button>

            {showShapes && (
              <div
                className="absolute -left-56 top-1/2 -translate-y-1/2 border rounded-2xl shadow-xl p-3 z-20 w-52"
                style={{ backgroundColor: "var(--toolbar-bg)" }}
              >
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
                      setTool("arrow");
                      setShowShapes(false);
                    }}
                    className="p-2 border rounded hover:bg-green-500 text-xs"
                  >
                    Arrow
                  </button>
                  <button
                    onClick={() => {
                      setTool("dashed");
                      setShowShapes(false);
                    }}
                    className="p-2 border rounded hover:bg-green-500 text-xs"
                  >
                    Dashed
                  </button>
                </div>

                {/* 3D Shapes Section */}
                <p className="text-xs font-semibold mb-2">3D Shapes (Future)</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setTool("cube");
                      setShowShapes(false);
                    }}
                    className="p-2 border rounded hover:bg-red-500 flex justify-center items-center"
                  >
                    <HiOutlineCube size={20} />
                  </button>
                  <button
                    onClick={() => {
                      setTool("sphere");
                      setShowShapes(false);
                    }}
                    className="p-2 border rounded hover:bg-red-500 flex justify-center items-center"
                  >
                    <HiOutlineGlobe size={20} />
                  </button>
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
                    <label className="text-xs mb-1 ">Pen Size</label>
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
              reader.onload = () => {
                const src = reader.result;
                preloadImage(src);

                const id = Date.now().toString();
                const newImageShape = {
                  id,
                  tool: "image",
                  src,
                  x: 100,
                  y: 100,
                  width: 200,
                  height: 200,
                };

                setShapes((prev) => [...prev, newImageShape]);
                setSelectedId(id);
                setTool("select");

                // Update history for undo/redo
                const newHistory = history.slice(0, historyStep + 1);
                setHistory([...newHistory, [...shapes, newImageShape]]);
                setHistoryStep(historyStep + 1);
              };
              reader.readAsDataURL(file);
              e.target.value = "";
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
  );
}
