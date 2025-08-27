import { useRef, useState, useEffect } from "react";
import {
    Stage,
    Layer,
    Line,
    Rect,
    Shape,
    Arc,
    Image as KonvaImage,
    Circle,
    Transformer,
    Ellipse,
    Group,
    Star,
    Arrow,
    RegularPolygon,
} from "react-konva";
import useImage from "use-image";
import {
    FaPen,
    FaEraser,
    FaUndo,
    FaRedo,
    FaTrash,
    FaTrashAlt,
    FaDownload,
    FaFileImport,
    FaShapes,
    FaSlash,
    FaMousePointer,
    FaTimes,
} from "react-icons/fa";
import { Cylinder, Cone, Pyramid } from "lucide-react";
import { HiOutlineCube, HiOutlineGlobe } from "react-icons/hi";

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

const ImageShape = ({
    shape,
    index,
    onSelect,
    onChange,
    tool,
    handleDragEnd,
    shapes,
    pushToHistory,
}) => {
    const [img] = useImage(shape.src); // Konva hook

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
            // ✅ Use your central dragEnd handler
            onDragEnd={(e) => handleDragEnd(e, index)}
            // ✅ Resize/rotate logic
            onTransformEnd={(e) => {
                const node = e.target;
                const newWidth = Math.max(10, node.width() * node.scaleX());
                const newHeight = Math.max(10, node.height() * node.scaleY());

                const updated = {
                    ...shape,
                    x: node.x(),
                    y: node.y(),
                    width: newWidth,
                    height: newHeight,
                    rotation: node.rotation(),
                };

                // Reset Konva internal scaling
                node.scaleX(1);
                node.scaleY(1);

                onChange(updated);

                // 🔑 Save in history
                const updatedShapes = shapes.map((s) =>
                    s.id === shape.id ? updated : s
                );
                pushToHistory(updatedShapes);
            }}
        />
    );
};

export default function Sketchy() {
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
    const [activePanel, setActivePanel] = useState(null);

    const handleColorToggle = (panel) => {
        setActivePanel((prev) => (prev === panel ? null : panel));
    };

    //   const handleToolToggle = (selectedTool) => {
    //   if (tool === selectedTool) {
    //     // Same tool clicked → deselect
    //     setTool(null);
    //     setActivePanel(null);
    //   } else {
    //     // Different tool clicked → select
    //     setTool(selectedTool);
    //     setActivePanel(selectedTool); // open corresponding panel
    //   }
    // };

    const handleToolToggle = (newTool) => {
        setTool((prev) => (prev === newTool ? null : newTool));
        setActivePanel((prev) => (prev === newTool ? null : newTool));
    };

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
        width: window.innerWidth * 0.9, // 80% of screen width
        height: window.innerHeight * 0.9, // 80% of screen height
    });

    useEffect(() => {
        const handleResize = () => {
            setStageSize({
                width: window.innerWidth * 0.9,
                height: window.innerHeight * 0.9,
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

    // ✅ Universal drag-end handler for all shapes
      const handleDragEnd = (e, index) => {
        const node = e.target;
        const newShapes = shapes.slice();
        const shape = newShapes[index];

        // Lines & arrows → reset x,y to 0 and keep points unchanged
        if (["line", "arrow", "dashed"].includes(shape.tool)) {
          const dx = node.x() - (shape.x || 0);
          const dy = node.y() - (shape.y || 0);

          newShapes[index] = {
            ...shape,
            x: 0,
            y: 0,
            points: shape.points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy)),
          };
        }
        // For all other shapes → just update position
        else if (
          [
            "rectangle",
            "circle",
            "triangle",
            "ellipse",
            "pentagon",
            "square",
            "hexagon",
            "trapezium",
            "star",
            "rhombus",
            "cube",
            "sphere",
            "cylinder",
            "cone",
            "hemisphere",
            "pyramid",
            "image",
          ].includes(shape.tool)
        ) {
          newShapes[index] = {
            ...shape,
            x: node.x(),
            y: node.y(),
          };
        }

        // Reset node so stored x,y matches Konva node’s visual position
        node.position({
          x: newShapes[index].x,
          y: newShapes[index].y,
        });
        setShapes(newShapes);
        pushToHistory(newShapes); // 🔑 Save after drag
      };

    // const handleDragEnd = (e, index) => {
    //     const node = e.target;
    //     const newShapes = shapes.slice();
    //     const shape = newShapes[index];

    //     // Update position of all shapes, including lines, arrows, dashed
    //     newShapes[index] = {
    //         ...shape,
    //         x: node.x(),
    //         y: node.y(),
    //     };

    //     //Make sure the Konva node matches stored coordinates
    //     if (["line", "arrow", "dashed"].includes(shape.tool)) {
    //         node.position({
    //             x: newShapes[index].x,
    //             y: newShapes[index].y,
    //         });
    //     }
    //     setShapes(newShapes);
    //     pushToHistory(newShapes); // save state for undo/redo
    // };

    const getBoundedDragFunc = (shape) => (pos) => {
        const stage = stageRef.current;
        const stageWidth = stage.width();
        const stageHeight = stage.height();

        let minX = 0,
            minY = 0,
            maxX = stageWidth,
            maxY = stageHeight;

        // 🔑 define x and y here so we can safely reassign
        let x = pos.x;
        let y = pos.y;

        switch (shape.tool) {
            // Top-left / top-vertex anchored
            case "rectangle":
                // case "pyramid":
                // case "cylinder":

                maxX = stageWidth - (shape.width || 0);
                maxY = stageHeight - (shape.height || 0);
                break;

            case "triangle": {
                // Triangle: top vertex anchored
                const halfWidth = Math.abs(shape.width || 0) / 2;
                const height = shape.height || 0;

                minX = halfWidth;
                maxX = stageWidth - halfWidth;
                minY = 0;
                maxY = stageHeight - height;
                break;
            }
            case "cylinder": {
                const rx = Math.abs(shape.width / 2); // horizontal radius
                const ry = Math.max(8, Math.min(30, rx / 3)); // vertical radius of ellipse

                // Use top ellipse for top bound, bottom ellipse for bottom bound
                minX = 0; // left-most of cylinder
                minY = ry; // top ellipse should not go above stage
                maxX = stageWidth - shape.width; // width of cylinder
                maxY = stageHeight - (shape.height + ry); // bottom: bottom ellipse should not cross stage

                break;
            }
            case "pyramid": {
                const w = shape.width / 2;   // half base width
                const h = shape.height;      // pyramid height
                const dirX = shape.dirX || 1;
                const dirY = shape.dirY || 1;

                // Horizontal extents (center x)
                // Pyramid base corners: x ± w*dirX
                const minX = w;
                const maxX = stageWidth - w;

                // Vertical extents (center y)
                // Apex at y, base at y + h*dirY
                // → must keep both apex and base inside
                let minY, maxY;
                if (dirY > 0) {
                    // Drawing downward → apex at y, base below
                    minY = 0;                // apex top limit
                    maxY = stageHeight - h;  // base bottom limit
                } else {
                    // Drawing upward → base at y, apex above
                    minY = h;                // apex top limit
                    maxY = stageHeight;      // base bottom limit
                }

                x = Math.max(minX, Math.min(x, maxX));
                y = Math.max(minY, Math.min(y, maxY));
                break;
            }


            case "trapezium": {
                // Trapezium: top-center anchored
                const topHalf = (shape.width || 0) / 2;
                const bottomHalf = (shape.bottomWidth || 0) / 2;
                const height = shape.height || 0;

                // Minimum x so leftmost point stays inside
                minX = Math.max(topHalf, bottomHalf);
                // Maximum x so rightmost point stays inside
                maxX = stageRef.current.width() - Math.max(topHalf, bottomHalf);

                minY = 0;                 // top stays inside
                maxY = stageRef.current.height() - height; // bottom stays inside
                break;
            }
            case "rhombus": {
                const halfWidth = (shape.width || 0) / 2;
                const halfHeight = (shape.height || 0) / 2;

                // Clamp center so the rhombus stays fully inside stage
                minX = halfWidth;
                maxX = stageRef.current.width() - halfWidth;
                minY = halfHeight;
                maxY = stageRef.current.height() - halfHeight;
                break;
            }


            case "line":
            case "arrow":
            case "dashed": {
                if (!shape.points || shape.points.length < 4) break;

                // Find bounding box of shape points
                const xs = [], ys = [];
                for (let i = 0; i < shape.points.length; i += 2) {
                    xs.push(shape.points[i]);
                    ys.push(shape.points[i + 1]);
                }

                const minPx = Math.min(...xs);
                const maxPx = Math.max(...xs);
                const minPy = Math.min(...ys);
                const maxPy = Math.max(...ys);

                // Clamp x and y so that the entire shape stays inside the stage
                const stageWidth = stageRef.current.width();
                const stageHeight = stageRef.current.height();

                minX = -minPx;                  // allow leftmost point to stay ≥ 0
                maxX = stageWidth - maxPx;      // allow rightmost point to stay ≤ stage width
                minY = -minPy;                  // topmost point ≥ 0
                maxY = stageHeight - maxPy;     // bottommost point ≤ stage height

                break;
            }


            // ---------------- ELLIPSE (center + radii) ----------------
            case "ellipse": {
                const rX = shape.radiusX || 0;
                const rY = shape.radiusY || 0;

                // clamp center to stay fully inside stage
                minX = rX;
                minY = rY;
                maxX = stageWidth - rX;
                maxY = stageHeight - rY;

                break;
            }
            case "square": {
                // Square: top-left corner anchored (like rectangle)
                maxX = stageWidth - (shape.size || 0);
                maxY = stageHeight - (shape.size || 0);
                minX = 0;
                minY = 0;
                break;
            }

            // case "pentagon": {
            //     const r = shape.radius || 0;
            //     const sides = 5;
            //     const angle = Math.PI / sides;

            //     const verticalOffset = r * Math.cos(angle);
            //     const horizontalOffset = r;

            //     minX = horizontalOffset;
            //     maxX = stageWidth - horizontalOffset;
            //     minY = verticalOffset;
            //     maxY = stageHeight - verticalOffset;
            //     break;
            // }
            // case "pentagon": {
            //     const r = shape.radius || 0;
            //     const sides = 5;
            //     const angle = Math.PI / sides; // 36 degrees

            //     // Distance from center to top/bottom vertex along Y
            //     const verticalOffset = r * Math.cos(angle);
            //     // Distance from center to left/right vertex along X
            //     const horizontalOffset = r;

            //     minX = horizontalOffset;
            //     maxX = stageWidth - horizontalOffset;
            //     minY = verticalOffset;
            //     maxY = stageHeight - verticalOffset;

            //     break;
            // }

            case "cone": {
                const r = shape.radius || 0;   // base ellipse radiusX
                const ry = r / 3;              // base ellipse radiusY
                const h = shape.height || 0;   // cone height

                // Horizontal extents (center.x must keep base ellipse inside)
                minX = r;
                maxX = stageWidth - r;

                // Vertical extents (center.y must keep apex above 0 and base ellipse inside stage)
                minY = h;
                maxY = stageHeight - ry;

                break;
            }


            case "cube": {
                const s = shape.size || 0; // front face size
                const k = 0.5;             // back face offset factor
                const off = s * k;         // back face offset

                // Horizontal extents (center)
                minX = s / 2;             // left-most center (front face)
                maxX = stageWidth - (s / 2 + off); // right-most center (front + back offset)

                // Vertical extents (center)
                minY = s / 2 + off;       // top-most center (back face top)
                maxY = stageHeight - s / 2; // bottom-most center (front face bottom)

                break;
            }
            case "hemisphere": {
                const r = shape.radius || 0;    // hemisphere radius
                const ry = r / 2;               // vertical squash for ellipse (3D curve)

                // Horizontal extents → must keep the circular base inside stage
                minX = r;
                maxX = stageWidth - r;

                // Vertical extents
                // Top (center.y - r) must stay ≥ 0
                // Bottom (flat base at center.y) + ellipse bulge (ry) must stay ≤ stageHeight
                minY = r;
                maxY = stageHeight - ry;

                break;
            }


            // Center anchored
            case "circle":
            case "sphere":
            // case "hemisphere":
            // case "cube":
            case "pentagon":
            case "hexagon":
            case "star": {
                const r = shape.radius || shape.size || 0;
                minX = r;
                minY = r;
                maxX = stageWidth - r;
                maxY = stageHeight - r;
                break;
            }



            default:
                break;
        }

        // Clamp position to stage bounds
        x = Math.max(minX, Math.min(x, maxX));
        y = Math.max(minY, Math.min(y, maxY));

        return { x, y };
    };





    const isShapeTool = (tool) =>
        [
            "rectangle",
            "circle",
            "triangle",
            "square",
            "hexagon",
            "pentagon",
            "ellipse",
            "rhombus",
            "trapezium",
            "line",
            "arrow",
            "dashed",
            "star",
            "cube",
            "sphere",
            "cone",
            "hemisphere",
            "cylinder",
            "pyramid",
        ].includes(tool);


    const handleMouseDown = (e) => {
        const clickedOnStage = e.target.getStage() === e.target;

        // ✅ Always close any open toolbar panels when clicking on empty stage
        if (clickedOnStage) {
            setActivePanel(null);
        }
        // selection first if in 'select' mode
        if (tool === "select") {
            const clickedOnShape = !clickedOnStage && e.target.attrs.id;

            if (clickedOnShape) {
                setSelectedId(e.target.attrs.id);
            } else {
                setSelectedId(null);
            }
            return;
        }

        // ✅ Prevent drawing if no valid tool is active
        if (!(tool === "pen" || tool === "eraser" || isShapeTool(tool))) {
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
            //   case "line":
            //     newShape = {
            //       id,
            //       tool,
            //       points: [pos.x, pos.y, pos.x, pos.y],
            //       color: penColor,
            //       size: penSize,
            //     };
            //     break;
            case "line":
                newShape = {
                    id,
                    tool,
                    x: pos.x, // starting point of line
                    y: pos.y,
                    points: [0, 0, 1, 1], // relative to x, y (tiny initial length to be drawable)
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
            case "square":
                newShape = {
                    id,
                    tool: "square",
                    startX: pos.x, // for drawing
                    startY: pos.y,
                    x: pos.x, // top-left corner
                    y: pos.y,
                    size: 0, // ✅ single uniform size
                    color: penColor,
                    sizeStroke: penSize, // avoid name clash
                };
                break;

            case "pentagon":
                newShape = {
                    id,
                    tool: "pentagon",
                    startX: pos.x, // store starting click point
                    startY: pos.y,
                    x: pos.x, // initial center
                    y: pos.y,
                    sides: 5,
                    radius: 0,
                    color: penColor,
                    size: penSize,
                };
                break;

            case "rhombus":
                newShape = {
                    id,
                    tool: "rhombus",
                    startX: pos.x,
                    startY: pos.y,
                    x: pos.x,
                    y: pos.y,
                    width: 0,   // horizontal size
                    height: 0,  // vertical size
                    color: penColor,
                    size: penSize,
                };
                break;


            // Creating a new trapezium
            case "trapezium":
                newShape = {
                    id,
                    tool: "trapezium",
                    startX: pos.x,
                    startY: pos.y,
                    x: pos.x,
                    y: pos.y,
                    width: 0,        // top width
                    bottomWidth: 0,  // bottom width
                    height: 0,
                    color: penColor,
                    size: penSize,
                };
                break;

            case "hexagon":
                newShape = {
                    id,
                    tool: "hexagon",
                    startX: pos.x,
                    startY: pos.y,
                    x: pos.x,
                    y: pos.y,
                    sides: 6,
                    radius: 0,
                    color: penColor,
                    size: penSize,
                };
                break;
            case "star":
                newShape = {
                    id,
                    tool: "star",
                    startX: pos.x,
                    startY: pos.y,
                    x: pos.x,
                    y: pos.y,
                    radius: 0,
                    numPoints: 5,
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
                    tool: "cube",
                    startX: pos.x, // needed for free-draw
                    startY: pos.y, // needed for free-draw
                    x: pos.x, // treat as CENTER
                    y: pos.y, // treat as CENTER
                    size: 0, // edge length
                    color: penColor,
                    stroke: penColor,
                };
                break;

            case "sphere":
                newShape = {
                    id,
                    tool: "sphere",
                    startX: pos.x,
                    startY: pos.y,
                    x: pos.x, // center
                    y: pos.y,
                    radius: 0,
                    color: penColor,
                    stroke: penColor,
                };
                break;
            case "cone":
                newShape = {
                    id,
                    tool: "cone",
                    startX: pos.x,
                    startY: pos.y,
                    x: pos.x,
                    y: pos.y,
                    radius: 0,
                    height: 0,
                    color: penColor,
                    stroke: penColor,
                };
                break;
            case "pyramid":
                newShape = {
                    id,
                    tool: "pyramid",
                    startX: pos.x,
                    startY: pos.y,
                    x: pos.x,
                    y: pos.y,
                    width: 0,
                    height: 0,
                    color: penColor,
                    size: penSize,
                };
                break;

            case "hemisphere":
                newShape = {
                    id,
                    tool: "hemisphere",
                    startX: pos.x,
                    startY: pos.y,
                    x: pos.x, // center
                    y: pos.y,
                    radius: 0,
                    color: penColor,
                    size: penSize,
                };
                break;

            case "cylinder":
                newShape = {
                    id,
                    tool: "cylinder",
                    startX: pos.x, // initial pointer position
                    startY: pos.y,
                    x: pos.x, // center of cylinder
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
        //   if (!point) return;
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

                // if (shape.tool === "rectangle") {
                //     const minX = Math.min(shape.x, shape.x + shape.width);
                //     const maxX = Math.max(shape.x, shape.x + shape.width);
                //     const minY = Math.min(shape.y, shape.y + shape.height);
                //     const maxY = Math.max(shape.y, shape.y + shape.height);

                //     erase =
                //         point.x >= minX &&
                //         point.x <= maxX &&
                //         point.y >= minY &&
                //         point.y <= maxY;
                // } 
                if (shape.tool === "rectangle") {
                    const left = Math.min(shape.x, shape.x + shape.width);
                    const right = Math.max(shape.x, shape.x + shape.width);
                    const top = Math.min(shape.y, shape.y + shape.height);
                    const bottom = Math.max(shape.y, shape.y + shape.height);

                    // Check if pointer is near the boundary (within eraserSize)
                    const nearLeft = Math.abs(point.x - left) <= eraserSize;
                    const nearRight = Math.abs(point.x - right) <= eraserSize;
                    const nearTop = Math.abs(point.y - top) <= eraserSize;
                    const nearBottom = Math.abs(point.y - bottom) <= eraserSize;

                    // Erase if pointer is close to any edge
                    erase = (point.y >= top && point.y <= bottom && (nearLeft || nearRight)) ||
                        (point.x >= left && point.x <= right && (nearTop || nearBottom));
                }

                // else if (shape.tool === "circle") {
                //     const dx = point.x - shape.x;
                //     const dy = point.y - shape.y;
                //     erase = Math.sqrt(dx * dx + dy * dy) <= shape.radius;
                // }
                else if (shape.tool === "circle") {
                    const dx = point.x - shape.x;
                    const dy = point.y - shape.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    // Check if pointer is near the circle boundary
                    erase = distance >= shape.radius - eraserSize && distance <= shape.radius + eraserSize;
                }

                // else if (shape.tool === "pen") {
                //     if (shape.points && shape.points.length > 3) {
                //         let newPoints = [];
                //         let currentStroke = [];
                //         // const radius = eraserSize;
                //         const radius = eraserSize;

                //         for (let idx = 0; idx < shape.points.length - 2; idx += 2) {
                //             const x1 = shape.points[idx];
                //             const y1 = shape.points[idx + 1];
                //             const x2 = shape.points[idx + 2];
                //             const y2 = shape.points[idx + 3];

                //             // Distance from eraser center to segment
                //             const A = point.x - x1;
                //             const B = point.y - y1;
                //             const C = x2 - x1;
                //             const D = y2 - y1;

                //             const dot = A * C + B * D;
                //             const lenSq = C * C + D * D;
                //             let param = -1;
                //             if (lenSq !== 0) param = dot / lenSq;

                //             let xx, yy;
                //             if (param < 0) {
                //                 xx = x1;
                //                 yy = y1;
                //             } else if (param > 1) {
                //                 xx = x2;
                //                 yy = y2;
                //             } else {
                //                 xx = x1 + param * C;
                //                 yy = y1 + param * D;
                //             }

                //             const dx = point.x - xx;
                //             const dy = point.y - yy;
                //             const dist = Math.sqrt(dx * dx + dy * dy);

                //             const hit = dist <= radius;

                //             if (hit) {
                //                 // flush current stroke (segment outside eraser)
                //                 if (currentStroke.length > 0) {
                //                     newPoints.push([...currentStroke]);
                //                     currentStroke = [];
                //                 }
                //             } else {
                //                 // keep this segment
                //                 if (currentStroke.length === 0) {
                //                     currentStroke.push(x1, y1);
                //                 }
                //                 currentStroke.push(x2, y2);
                //             }
                //         }

                //         // push last remaining stroke
                //         if (currentStroke.length > 0) {
                //             newPoints.push([...currentStroke]);
                //         }

                //         // Replace the old shape with multiple smaller shapes
                //         if (newPoints.length > 0) {
                //             newShapes.splice(i, 1, ...newPoints.map(p => ({
                //                 ...shape,
                //                 id: Date.now().toString() + Math.random(),
                //                 points: p,
                //             })));
                //         } else {
                //             // fully erased
                //             newShapes.splice(i, 1);
                //         }
                //     }
                // } 
                else if (shape.tool === "pen") {
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
                }
                // else if (shape.tool === "triangle") {
                //     // Triangle points: top, bottom-left, bottom-right
                //     const points = [
                //         shape.x,
                //         shape.y, // top
                //         shape.x - shape.width / 2,
                //         shape.y + shape.height, // bottom-left
                //         shape.x + shape.width / 2,
                //         shape.y + shape.height, // bottom-right
                //     ];

                //     const [x1, y1, x2, y2, x3, y3] = points;

                //     // Area method to check if point is inside triangle
                //     const areaOrig = Math.abs(
                //         (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)
                //     );
                //     const area1 = Math.abs(
                //         (x1 - point.x) * (y2 - point.y) - (x2 - point.x) * (y1 - point.y)
                //     );
                //     const area2 = Math.abs(
                //         (x2 - point.x) * (y3 - point.y) - (x3 - point.x) * (y2 - point.y)
                //     );
                //     const area3 = Math.abs(
                //         (x3 - point.x) * (y1 - point.y) - (x1 - point.x) * (y3 - point.y)
                //     );

                //     erase = area1 + area2 + area3 <= areaOrig + 0.1; // small tolerance
                // }
                else if (shape.tool === "triangle") {
                    // Triangle points: top, bottom-left, bottom-right
                    const points = [
                        shape.x, shape.y, // top
                        shape.x - shape.width / 2, shape.y + shape.height, // bottom-left
                        shape.x + shape.width / 2, shape.y + shape.height, // bottom-right
                    ];

                    // Helper to calculate distance from point to segment
                    const distanceToSegment = (px, py, x1, y1, x2, y2) => {
                        const A = px - x1;
                        const B = py - y1;
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

                        const dx = px - xx;
                        const dy = py - yy;
                        return Math.sqrt(dx * dx + dy * dy);
                    };

                    const [x1, y1, x2, y2, x3, y3] = points;

                    // Check distance to each side
                    const dist1 = distanceToSegment(point.x, point.y, x1, y1, x2, y2);
                    const dist2 = distanceToSegment(point.x, point.y, x2, y2, x3, y3);
                    const dist3 = distanceToSegment(point.x, point.y, x3, y3, x1, y1);

                    erase = dist1 <= eraserSize || dist2 <= eraserSize || dist3 <= eraserSize;
                }

                // else if (shape.tool === "ellipse") {
                //     const dx = (point.x - shape.x) / shape.radiusX;
                //     const dy = (point.y - shape.y) / shape.radiusY;
                //     erase = dx * dx + dy * dy <= 1; // inside ellipse formula
                // }
                else if (shape.tool === "ellipse") {
                    const dx = point.x - shape.x;
                    const dy = point.y - shape.y;

                    // Normalize distance by radii
                    const nx = dx / shape.radiusX;
                    const ny = dy / shape.radiusY;

                    const distanceSquared = nx * nx + ny * ny;

                    // Check if pointer is near the boundary
                    const tolerance = eraserSize / Math.max(shape.radiusX, shape.radiusY);
                    erase = distanceSquared >= 1 - tolerance && distanceSquared <= 1 + tolerance;
                }


                // else if (
                //     shape.tool === "arrow" ||
                //     shape.tool === "dashed" ||
                //     shape.tool === "line"
                // ) {
                //     if (shape.points && shape.points.length >= 4) {
                //         const points = shape.points.map((p, i) =>
                //             i % 2 === 0 ? p + (shape.x || 0) : p + (shape.y || 0)
                //         );

                //         erase = false;

                //         // Check all segments
                //         for (let i = 0; i < points.length - 2; i += 2) {
                //             const x1 = points[i];
                //             const y1 = points[i + 1];
                //             const x2 = points[i + 2];
                //             const y2 = points[i + 3];

                //             const A = point.x - x1;
                //             const B = point.y - y1;
                //             const C = x2 - x1;
                //             const D = y2 - y1;

                //             const dot = A * C + B * D;
                //             const len_sq = C * C + D * D;
                //             let param = -1;
                //             if (len_sq !== 0) param = dot / len_sq;

                //             let xx, yy;
                //             if (param < 0) {
                //                 xx = x1;
                //                 yy = y1;
                //             } else if (param > 1) {
                //                 xx = x2;
                //                 yy = y2;
                //             } else {
                //                 xx = x1 + param * C;
                //                 yy = y1 + param * D;
                //             }

                //             const dx = point.x - xx;
                //             const dy = point.y - yy;

                //             if (Math.sqrt(dx * dx + dy * dy) <= eraserSize) {
                //                 erase = true;
                //                 break; // stop checking other segments
                //             }
                //         }
                //     }
                // }
              

                else if (["line", "arrow", "dashed"].includes(shape.tool)) {
                    if (shape.points && shape.points.length >= 4) {
                        erase = false;
                        const pts = shape.points;

                        for (let i = 0; i < pts.length - 2; i += 2) {
                            const x1 = pts[i];
                            const y1 = pts[i + 1];
                            const x2 = pts[i + 2];
                            const y2 = pts[i + 3];

                            // distance from eraser point to segment
                            const A = point.x - x1;
                            const B = point.y - y1;
                            const C = x2 - x1;
                            const D = y2 - y1;
                            const dot = A * C + B * D;
                            const len_sq = C * C + D * D;
                            let param = len_sq !== 0 ? dot / len_sq : -1;

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

                            if (Math.sqrt(dx * dx + dy * dy) <= eraserSize) {
                                erase = true;
                                break;
                            }
                        }
                    }
                }



                // else if (shape.tool === "square") {
                //     const left = shape.x;
                //     const right = shape.x + shape.size;
                //     const top = shape.y;
                //     const bottom = shape.y + shape.size;

                //     // Closest point on the square to the eraser center
                //     const closestX = Math.max(left, Math.min(point.x, right));
                //     const closestY = Math.max(top, Math.min(point.y, bottom));

                //     const dx = point.x - closestX;
                //     const dy = point.y - closestY;
                //     const distance = Math.sqrt(dx * dx + dy * dy);

                //     if (distance <= eraserSize) {
                //         erase = true;
                //     }
                // } 

                else if (shape.tool === "square") {
                    const left = shape.x;
                    const right = shape.x + shape.size;
                    const top = shape.y;
                    const bottom = shape.y + shape.size;

                    // Check if pointer is near any edge (boundary)
                    const nearLeft = Math.abs(point.x - left) <= eraserSize;
                    const nearRight = Math.abs(point.x - right) <= eraserSize;
                    const nearTop = Math.abs(point.y - top) <= eraserSize;
                    const nearBottom = Math.abs(point.y - bottom) <= eraserSize;

                    // Erase if pointer is close to any edge
                    erase = (point.y >= top && point.y <= bottom && (nearLeft || nearRight)) ||
                        (point.x >= left && point.x <= right && (nearTop || nearBottom));
                }

                // else if (shape.tool === "pentagon") {
                //     if (shape.radius) {
                //         const dx = point.x - shape.x;
                //         const dy = point.y - shape.y;
                //         if (Math.sqrt(dx * dx + dy * dy) <= shape.radius + eraserSize)
                //             erase = true;
                //     }
                // } 
                else if (shape.tool === "pentagon") {
                    const numSides = 5;
                    const angleStep = (2 * Math.PI) / numSides;
                    const points = [];

                    // Build pentagon vertices
                    for (let i = 0; i < numSides; i++) {
                        const angle = -Math.PI / 2 + i * angleStep; // start from top
                        const x = shape.x + shape.radius * Math.cos(angle);
                        const y = shape.y + shape.radius * Math.sin(angle);
                        points.push([x, y]);
                    }

                    // Helper to calculate distance from point to a segment
                    const distanceToSegment = (px, py, x1, y1, x2, y2) => {
                        const A = px - x1;
                        const B = py - y1;
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

                        const dx = px - xx;
                        const dy = py - yy;
                        return Math.sqrt(dx * dx + dy * dy);
                    };

                    // Check distance to each edge
                    erase = false;
                    for (let i = 0; i < numSides; i++) {
                        const [x1, y1] = points[i];
                        const [x2, y2] = points[(i + 1) % numSides];
                        if (distanceToSegment(point.x, point.y, x1, y1, x2, y2) <= eraserSize) {
                            erase = true;
                            break;
                        }
                    }
                }

                // else if (shape.tool === "rhombus") {
                //     // Build rhombus vertices exactly as in render
                //     const points = [
                //         shape.x, shape.y - (shape.height * shape.yDir) / 2, // top
                //         shape.x + (shape.width * shape.xDir) / 2, shape.y,  // right
                //         shape.x, shape.y + (shape.height * shape.yDir) / 2, // bottom
                //         shape.x - (shape.width * shape.xDir) / 2, shape.y,  // left
                //     ];

                //     const isPointInsidePolygon = (px, py, pts) => {
                //         let inside = false;
                //         for (let i = 0, j = pts.length - 2; i < pts.length; i += 2) {
                //             const xi = pts[i], yi = pts[i + 1];
                //             const xj = pts[j], yj = pts[j + 1];
                //             const intersect =
                //                 yi > py !== yj > py &&
                //                 px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
                //             if (intersect) inside = !inside;
                //             j = i;
                //         }
                //         return inside;
                //     };

                //     if (isPointInsidePolygon(point.x, point.y, points)) {
                //         erase = true;
                //     }
                // }

                else if (shape.tool === "rhombus") {
    // Build rhombus vertices exactly as in render
    const points = [
        [shape.x, shape.y - (shape.height * shape.yDir) / 2], // top
        [shape.x + (shape.width * shape.xDir) / 2, shape.y],  // right
        [shape.x, shape.y + (shape.height * shape.yDir) / 2], // bottom
        [shape.x - (shape.width * shape.xDir) / 2, shape.y],  // left
    ];

    // Helper: distance from point to segment
    const distanceToSegment = (px, py, x1, y1, x2, y2) => {
        const A = px - x1;
        const B = py - y1;
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

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Check distance to each edge
    erase = false;
    for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length]; // wrap around
        if (distanceToSegment(point.x, point.y, x1, y1, x2, y2) <= eraserSize) {
            erase = true;
            break;
        }
    }
}

                // else if (shape.tool === "hexagon") {
                //     if (shape.radius) {
                //         const dx = point.x - shape.x;
                //         const dy = point.y - shape.y;
                //         const dist = Math.sqrt(dx * dx + dy * dy);
                //         if (dist <= shape.radius + eraserSize) erase = true;
                //     }
                // }
                else if (shape.tool === "hexagon") {
    const numSides = 6;
    const radius = shape.radius;
    const points = [];

    // Compute hexagon vertices
    for (let i = 0; i < numSides; i++) {
        const angle = (Math.PI / 2) + (i * (2 * Math.PI / numSides)); // start from top
        const x = shape.x + radius * Math.cos(angle);
        const y = shape.y + radius * Math.sin(angle);
        points.push([x, y]);
    }

    // Helper: distance from point to segment
    const distanceToSegment = (px, py, x1, y1, x2, y2) => {
        const A = px - x1;
        const B = py - y1;
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

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Check distance to each edge
    erase = false;
    for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length]; // wrap around
        if (distanceToSegment(point.x, point.y, x1, y1, x2, y2) <= eraserSize) {
            erase = true;
            break;
        }
    }
}

                // else if (shape.tool === "trapezium") {
                //     // Build trapezium vertices exactly as in render
                //     const halfTop = shape.width / 2;
                //     const halfBottom = shape.bottomWidth / 2;

                //     const points = [
                //         shape.x - halfTop, shape.y,               // top-left
                //         shape.x + halfTop, shape.y,               // top-right
                //         shape.x + halfBottom, shape.y + shape.height, // bottom-right
                //         shape.x - halfBottom, shape.y + shape.height, // bottom-left
                //     ];

                //     const isPointInsidePolygon = (px, py, pts) => {
                //         let inside = false;
                //         for (let i = 0, j = pts.length - 2; i < pts.length; i += 2) {
                //             const xi = pts[i], yi = pts[i + 1];
                //             const xj = pts[j], yj = pts[j + 1];
                //             const intersect =
                //                 (yi > py) !== (yj > py) &&
                //                 px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
                //             if (intersect) inside = !inside;
                //             j = i;
                //         }
                //         return inside;
                //     };

                //     if (isPointInsidePolygon(point.x, point.y, points)) {
                //         erase = true;
                //     }
                // }
                else if (shape.tool === "trapezium") {
    const halfTop = shape.width / 2;
    const halfBottom = shape.bottomWidth / 2;

    // Build trapezium vertices (clockwise)
    const points = [
        [shape.x - halfTop, shape.y],               // top-left
        [shape.x + halfTop, shape.y],               // top-right
        [shape.x + halfBottom, shape.y + shape.height], // bottom-right
        [shape.x - halfBottom, shape.y + shape.height], // bottom-left
    ];

    // Helper: distance from point to segment
    const distanceToSegment = (px, py, x1, y1, x2, y2) => {
        const A = px - x1;
        const B = py - y1;
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

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Check distance to each edge
    erase = false;
    for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length]; // wrap around
        if (distanceToSegment(point.x, point.y, x1, y1, x2, y2) <= eraserSize) {
            erase = true;
            break;
        }
    }
}


                // else if (shape.tool == "star") {
                //     const dx = point.x - shape.x;
                //     const dy = point.y - shape.y;
                //     const dist = Math.sqrt(dx * dx + dy * dy);

                //     if (dist <= shape.radius + eraserSize) erase = true;
                // }

                else if (shape.tool === "star") {
    const numPoints = shape.points || 5; // number of star tips
    const outerRadius = shape.radius;
    const innerRadius = outerRadius / 2; // adjust if your star uses different inner radius
    const points = [];

    // Build star vertices
    for (let i = 0; i < numPoints * 2; i++) {
        const angle = (-Math.PI / 2) + (i * Math.PI) / numPoints; // start from top
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const x = shape.x + r * Math.cos(angle);
        const y = shape.y + r * Math.sin(angle);
        points.push([x, y]);
    }

    // Helper: distance from point to segment
    const distanceToSegment = (px, py, x1, y1, x2, y2) => {
        const A = px - x1;
        const B = py - y1;
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

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Check distance to each edge
    erase = false;
    for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];
        if (distanceToSegment(point.x, point.y, x1, y1, x2, y2) <= eraserSize) {
            erase = true;
            break;
        }
    }
}


                // Cylinder erase check
                // else if (shape.tool === "cylinder") {
                //     const dx =
                //         (point.x - (shape.x + shape.width / 2)) / (shape.width / 2);
                //     const dyTop = (point.y - shape.y) / 10;
                //     const dyBottom = (point.y - (shape.y + shape.height)) / 10;

                //     const insideTop = dx * dx + dyTop * dyTop <= 1;
                //     const insideBottom = dx * dx + dyBottom * dyBottom <= 1;

                //     const insideBody =
                //         point.x >= shape.x - eraserSize &&
                //         point.x <= shape.x + shape.width + eraserSize &&
                //         point.y >= shape.y - eraserSize &&
                //         point.y <= shape.y + shape.height + eraserSize;

                //     if (insideTop || insideBottom || insideBody) {
                //         erase = true;
                //     }
                // } 
// else if (shape.tool === "cylinder") {
//     const centerX = shape.x + shape.width / 2;
//     const topY = shape.y;
//     const bottomY = shape.y + shape.height;
//     const radiusX = shape.width / 2;
//     const radiusY = 10; // vertical radius of ellipses

//     const dx = point.x - centerX;

//     // Top ellipse distance in pixels
//     const dyTop = point.y - topY;
//     const distTopX = dx;
//     const distTopY = dyTop;
//     const topEllipseDist = Math.abs((distTopX * distTopX) / (radiusX * radiusX) + (distTopY * distTopY) / (radiusY * radiusY) - 1);

//     // Bottom ellipse distance in pixels
//     const dyBottom = point.y - bottomY;
//     const distBottomX = dx;
//     const distBottomY = dyBottom;
//     const bottomEllipseDist = Math.abs((distBottomX * distBottomX) / (radiusX * radiusX) + (distBottomY * distBottomY) / (radiusY * radiusY) - 1);

//     // Vertical sides
//     const nearLeft = Math.abs(point.x - shape.x) <= eraserSize && point.y >= topY && point.y <= bottomY;
//     const nearRight = Math.abs(point.x - (shape.x + shape.width)) <= eraserSize && point.y >= topY && point.y <= bottomY;

//     // Check edges: erase if within eraserSize pixels from top/bottom ellipse or sides
//     if (
//         topEllipseDist <= eraserSize / Math.max(radiusX, radiusY) ||
//         bottomEllipseDist <= eraserSize / Math.max(radiusX, radiusY) ||
//         nearLeft ||
//         nearRight
//     ) {
//         erase = true;
//     }
// }

else if (shape.tool === "cylinder") {
    const cx = shape.x + shape.width / 2;   // ellipse center X
    const rx = shape.width / 2;             // ellipse radius X
    const ry = 10;                          // ellipse radius Y (as you render)
    const topY = shape.y;
    const bottomY = shape.y + shape.height;

    // --- helpers ---
    const distanceToSegment = (px, py, x1, y1, x2, y2) => {
        const A = px - x1, B = py - y1;
        const C = x2 - x1, D = y2 - y1;
        const len = C*C + D*D;
        let t = len ? (A*C + B*D) / len : 0;
        t = Math.max(0, Math.min(1, t));
        const xx = x1 + t * C, yy = y1 + t * D;
        const dx = px - xx, dy = py - yy;
        return Math.sqrt(dx*dx + dy*dy);
    };

    const sampleEllipse = (cx, cy, rx, ry, segments = 48) => {
        const pts = [];
        for (let i = 0; i < segments; i++) {
            const t = (i / segments) * Math.PI * 2;
            pts.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
        }
        return pts;
    };

    const nearPolyline = (pts) => {
        for (let i = 0; i < pts.length; i++) {
            const [x1, y1] = pts[i];
            const [x2, y2] = pts[(i + 1) % pts.length];
            if (distanceToSegment(point.x, point.y, x1, y1, x2, y2) <= eraserSize) {
                return true;
            }
        }
        return false;
    };

    // --- check top & bottom ellipse boundaries (inner OR outer side) ---
    const topPts = sampleEllipse(cx, topY, rx, ry);
    const bottomPts = sampleEllipse(cx, bottomY, rx, ry);
    const nearTopEdge = nearPolyline(topPts);
    const nearBottomEdge = nearPolyline(bottomPts);

    // --- check vertical side edges ---
    const nearLeft =
        Math.abs(point.x - shape.x) <= eraserSize &&
        point.y >= topY && point.y <= bottomY;

    const nearRight =
        Math.abs(point.x - (shape.x + shape.width)) <= eraserSize &&
        point.y >= topY && point.y <= bottomY;

    // Erase only on boundary touches
    erase = nearTopEdge || nearBottomEdge || nearLeft || nearRight;
}

               
                // else if (shape.tool === "cube") {
                //     const s = shape.size;
                //     const half = s / 2;
                //     const off = s / 2;

                //     // overall bounds for both faces
                //     const minX = shape.x - half; // front min x
                //     const maxX = shape.x + half + off; // back extends to the right
                //     const minY = shape.y - half - off; // back extends upward
                //     const maxY = shape.y + half; // front bottom

                //     const t = 10; // tolerance
                //     erase =
                //         point.x >= minX - t &&
                //         point.x <= maxX + t &&
                //         point.y >= minY - t &&
                //         point.y <= maxY + t;
                // } 

                else if (shape.tool === "cube") {
    const s = shape.size;
    const half = s / 2;
    const off = s / 2;

    // Front face (centered on shape.x, shape.y)
    const front = [
        [shape.x - half, shape.y - half], // top-left
        [shape.x + half, shape.y - half], // top-right
        [shape.x + half, shape.y + half], // bottom-right
        [shape.x - half, shape.y + half], // bottom-left
    ];

    // Back face (offset by "off" right & up)
    const back = front.map(([x, y]) => [x + off, y - off]);

    // All cube edges (front, back, and connecting lines)
    const edges = [
        // front square
        [front[0], front[1]],
        [front[1], front[2]],
        [front[2], front[3]],
        [front[3], front[0]],

        // back square
        [back[0], back[1]],
        [back[1], back[2]],
        [back[2], back[3]],
        [back[3], back[0]],

        // connecting lines
        [front[0], back[0]],
        [front[1], back[1]],
        [front[2], back[2]],
        [front[3], back[3]],
    ];

    // helper: distance from point to segment
    const distanceToSegment = (px, py, x1, y1, x2, y2) => {
        const A = px - x1, B = py - y1;
        const C = x2 - x1, D = y2 - y1;
        const len = C*C + D*D;
        let t = len ? (A*C + B*D) / len : 0;
        t = Math.max(0, Math.min(1, t));
        const xx = x1 + t * C, yy = y1 + t * D;
        const dx = px - xx, dy = py - yy;
        return Math.sqrt(dx*dx + dy*dy);
    };

    const tol = eraserSize; // tolerance in pixels
    erase = edges.some(([p1, p2]) =>
        distanceToSegment(point.x, point.y, p1[0], p1[1], p2[0], p2[1]) <= tol
    );
}


                // else if (shape.tool === "sphere") {
                //     const r = shape.radius;
                //     const dx = point.x - shape.x;
                //     const dy = point.y - shape.y;
                //     const dist = Math.sqrt(dx * dx + dy * dy);

                //     const t = 10; // tolerance
                //     erase = dist <= r + t;
                // } 
else if (shape.tool === "sphere") {
    const r = shape.radius;
    const dx = point.x - shape.x;
    const dy = point.y - shape.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const tol = eraserSize; // tolerance for eraser

    // Outer circle boundary
    const onOuterCircle = Math.abs(dist - r) <= tol;

    // Horizontal ellipse (equator)
    const dxEq = dx / r;
    const dyEq = dy / (r / 2);
    const onEquator = Math.abs(dxEq * dxEq + dyEq * dyEq - 1) <= tol / r;

    // Vertical ellipse (meridian)
    const dxMer = dx / (r / 2);
    const dyMer = dy / r;
    const onMeridian = Math.abs(dxMer * dxMer + dyMer * dyMer - 1) <= tol / r;

    // Erase if any boundary is touched
    erase = onOuterCircle || onEquator || onMeridian;
}

                
                // else if (shape.tool === "cone") {
                //     const dx = point.x - shape.x;
                //     const dy = point.y - shape.y;

                //     // Simple bounding box + ellipse check
                //     if (
                //         dx >= -shape.radius &&
                //         dx <= shape.radius &&
                //         dy >= -shape.height &&
                //         dy <= 0
                //     )
                //         erase = true;

                //     const rx = shape.radius,
                //         ry = shape.radius / 3;
                //     if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) erase = true;
                // } 

                else if (shape.tool === "cone") {
    const cx = shape.x;           // apex X
    const cy = shape.y;           // apex Y
    const radius = shape.radius;  // base radius
    const height = shape.height;  // cone height
    const tol = eraserSize;       // eraser tolerance

    // Apex and base points
    const apex = [cx, cy - height];
    const leftBase = [cx - radius, cy];
    const rightBase = [cx + radius, cy];

    // Helper: distance from point to line segment
    const distanceToLine = (px, py, x1, y1, x2, y2) => {
        const A = px - x1;
        const B = py - y1;
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

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Check left and right slanted lines
    const nearLeft = distanceToLine(point.x, point.y, apex[0], apex[1], leftBase[0], leftBase[1]) <= tol;
    const nearRight = distanceToLine(point.x, point.y, apex[0], apex[1], rightBase[0], rightBase[1]) <= tol;

    // Check base ellipse boundary
    const dx = point.x - cx;
    const dy = point.y - cy;
    const rx = radius;
    const ry = radius / 3;
    const ellipseVal = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
    const nearEllipse = Math.abs(ellipseVal - 1) <= tol / Math.max(rx, ry);

    // Erase only if any visible edge is touched
    erase = nearLeft || nearRight || nearEllipse;
}



                // else if (shape.tool === "pyramid") {
                //     const ax = shape.x; // top apex x
                //     const ay = shape.y; // top apex y
                //     const bx = shape.x - shape.width / 2; // left base x
                //     const by = shape.y + shape.height; // left base y
                //     const cx = shape.x + shape.width / 2; // right base x
                //     const cy = shape.y + shape.height; // right base y

                //     // Function to compute triangle area
                //     const area = (x1, y1, x2, y2, x3, y3) =>
                //         Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);

                //     const areaTotal = area(ax, ay, bx, by, cx, cy);
                //     const area1 = area(point.x, point.y, bx, by, cx, cy);
                //     const area2 = area(ax, ay, point.x, point.y, cx, cy);
                //     const area3 = area(ax, ay, bx, by, point.x, point.y);

                //     // Add small tolerance = eraserSize
                //     erase = Math.abs(areaTotal - (area1 + area2 + area3)) <= eraserSize;
                // } 

else if (shape.tool === "pyramid") {
    const w = shape.width / 2;
    const h = shape.height;
    const dirX = shape.dirX || 1;
    const dirY = shape.dirY || 1;
    const offsetX = shape.x; // group position
    const offsetY = shape.y;

    // Helper: distance from point to line segment
    const distanceToLine = (px, py, x1, y1, x2, y2) => {
        const A = px - x1;
        const B = py - y1;
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

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const tol = eraserSize;

    // Outer triangle points (offset by group)
    const outerPoints = [
        [0 + offsetX, 0 + offsetY],               // apex
        [-w * dirX + offsetX, h * dirY + offsetY], // left base
        [w * dirX + offsetX, h * dirY + offsetY],  // right base
    ];

    // Inner triangle points (offset by group)
    const innerPoints = [
        [0 + offsetX, (h / 2) * dirY + offsetY],  // inner apex
        [-w * dirX + offsetX, h * dirY + offsetY], // left base
        [w * dirX + offsetX, h * dirY + offsetY],  // right base
    ];

    // Dashed vertical line (offset by group)
    const dashedLine = [
        [0 + offsetX, 0 + offsetY],
        [0 + offsetX, (h / 2) * dirY + offsetY]
    ];

    // --- Check edges ---
    const checkEdges = (points) => {
        for (let i = 0; i < points.length; i++) {
            const [x1, y1] = points[i];
            const [x2, y2] = points[(i + 1) % points.length];
            if (distanceToLine(point.x, point.y, x1, y1, x2, y2) <= tol) return true;
        }
        return false;
    };

    const eraseOuter = checkEdges(outerPoints);
    const eraseInner = checkEdges(innerPoints);

    const eraseDashed =
        distanceToLine(point.x, point.y, dashedLine[0][0], dashedLine[0][1], dashedLine[1][0], dashedLine[1][1]) <= tol;

    erase = eraseOuter || eraseInner || eraseDashed;
}



                // else if (shape.tool === "hemisphere") {
                //     const dx = point.x - shape.x;
                //     const dy = point.y - shape.y;

                //     // erase if inside half-circle + add eraserSize buffer
                //     erase =
                //         dx * dx + dy * dy <=
                //         (shape.radius + eraserSize) * (shape.radius + eraserSize) &&
                //         dy <= 0;
                // }
                else if (shape.tool === "hemisphere") {
    const tol = eraserSize;   // tolerance in pixels
    const cx = shape.x;
    const cy = shape.y;
    const r = shape.radius;

    const dx = point.x - cx;
    const dy = point.y - cy;

    // --- Arc boundary (top half of circle) ---
    const dist = Math.sqrt(dx * dx + dy * dy);
    const onArc = dy <= 0 && Math.abs(dist - r) <= tol;

    // --- Flat base boundary ---
    // const onBase =
    //     Math.abs(point.y - cy) <= tol &&
    //     point.x >= cx - r - tol &&
    //     point.x <= cx + r + tol;

    // --- Optional: dashed ellipse for 3D top ---
    const rx = shape.radius;
    const ry = shape.radius / 2; // vertical radius of the ellipse
    const dxEllipse = (point.x - cx) / rx;
    const dyEllipse = (point.y - cy) / ry;
    const valEllipse = dxEllipse * dxEllipse + dyEllipse * dyEllipse;
    const onEllipseBoundary = Math.abs(valEllipse - 1) <= tol / Math.max(rx, ry);

    //only erase when either ellipse or the shape boundray not for the base line
    erase = onArc || onEllipseBoundary;

    // Erase if any boundary is touched
    // erase = onArc || onBase || onEllipseBoundary;
}


                if (erase) {
                    newShapes.splice(i, 1); // remove only this shape
                    setShapes(newShapes);

                    // ✅ Push erased shape as separate history step
                    pushToHistory(newShapes, true);

                    break; // stop after erasing top-most
                }



                // if (erase) {
                //     newShapes.splice(i, 1); // remove only this shape

                //     setShapes(newShapes);

                //     // ✅ Only push if a shape was actually removed
                //     if (newShapes.length !== shapes.length) {
                //         pushToHistory(newShapes, true);
                //     }

                //     break; // stop after erasing top-most
                //}


            }

            // setShapes(newShapes);
            return;
        }

        switch (lastShape.tool) {
            // ---------------- PEN ----------------
            case "pen": {
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));
                lastShape.points = lastShape.points.concat([clampedX, clampedY]);
                break;
            }

            // ---------------- RECTANGLE ----------------
            case "rectangle": {
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                lastShape.width = clampedX - lastShape.x;
                lastShape.height = clampedY - lastShape.y;

                if (lastShape.x + lastShape.width > stageSize.width)
                    lastShape.width = stageSize.width - lastShape.x;
                if (lastShape.y + lastShape.height > stageSize.height)
                    lastShape.height = stageSize.height - lastShape.y;
                if (lastShape.x + lastShape.width < 0) lastShape.width = -lastShape.x;
                if (lastShape.y + lastShape.height < 0) lastShape.height = -lastShape.y;
                break;
            }

            // ---------------- CIRCLE (center + radius) ----------------
            case "circle": {
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.x;
                const dy = clampedY - lastShape.y;

                let radius = Math.sqrt(dx * dx + dy * dy);

                const maxRadiusX = Math.min(lastShape.x, stageSize.width - lastShape.x);
                const maxRadiusY = Math.min(
                    lastShape.y,
                    stageSize.height - lastShape.y
                );
                lastShape.radius = Math.min(radius, maxRadiusX, maxRadiusY);
                break;
            }

            // ---------------- TRIANGLE (isoceles by width/height) ----------------
            case "triangle": {
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                let width = clampedX - lastShape.x; // horizontal expansion
                let height = clampedY - lastShape.y; // vertical expansion

                // Compute edges
                let leftEdge = lastShape.x - Math.abs(width) / 2;
                let rightEdge = lastShape.x + Math.abs(width) / 2;
                let bottomEdge = lastShape.y + height;

                // Clamp edges inside stage
                if (leftEdge < 0) width = lastShape.x * 2;
                if (rightEdge > stageSize.width) width = (stageSize.width - lastShape.x) * 2;
                if (bottomEdge > stageSize.height) height = stageSize.height - lastShape.y;
                if (lastShape.y + height < 0) height = -lastShape.y;

                lastShape.width = width;
                lastShape.height = height;
                break;
            }


            // ---------------- STRAIGHT LINE (two points) ----------------
            case "line": {
                if (!lastShape) break;

                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                lastShape.points = [
                    0,
                    0,
                    clampedX - lastShape.x, // relative X
                    clampedY - lastShape.y, // relative Y
                ];
                break;
            }

            // ---------------- ELLIPSE (center + radii) ----------------
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

            // ---------------- SQUARE (top-left + size) ----------------
            case "square": {
                if (!lastShape) break;

                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dxRaw = clampedX - lastShape.startX;
                const dyRaw = clampedY - lastShape.startY;
                let size = Math.max(Math.abs(dxRaw), Math.abs(dyRaw));

                // Clamp size so square never leaves stage
                const maxRight = stageSize.width - lastShape.startX;
                const maxLeft = lastShape.startX;
                const maxDown = stageSize.height - lastShape.startY;
                const maxUp = lastShape.startY;
                const maxSizeX = dxRaw >= 0 ? maxRight : maxLeft;
                const maxSizeY = dyRaw >= 0 ? maxDown : maxUp;
                size = Math.min(size, maxSizeX, maxSizeY);

                lastShape.size = size;
                lastShape.x = dxRaw < 0 ? lastShape.startX - size : lastShape.startX;
                lastShape.y = dyRaw < 0 ? lastShape.startY - size : lastShape.startY;
                break;
            }

            // ---------------- PENTAGON (center + radius) ----------------
            case "pentagon": {
                if (!lastShape) break;

                // Clamp pointer inside stage
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.startX;
                const dy = clampedY - lastShape.startY;

                // Initial radius from start point
                let r = Math.sqrt(dx * dx + dy * dy);

                // Maximum radius so polygon stays inside stage
                const maxLeft = lastShape.startX;
                const maxRight = stageSize.width - lastShape.startX;
                const maxTop = lastShape.startY;
                const maxBottom = stageSize.height - lastShape.startY;

                const maxRadius = Math.min(maxLeft, maxRight, maxTop, maxBottom);

                // Use smallest of radius and maxRadius
                r = Math.min(r, maxRadius);

                // Keep apex fixed
                lastShape.x = lastShape.startX;
                lastShape.y = lastShape.startY;
                lastShape.radius = r;

                break;
            }
            // case "pentagon": {
            //     if (!lastShape) break;

            //     // Clamp pointer inside stage
            //     const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
            //     const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

            //     const dx = clampedX - lastShape.startX;
            //     const dy = clampedY - lastShape.startY;

            //     // Initial radius from start point
            //     let r = Math.sqrt(dx * dx + dy * dy);

            //     // Pentagon geometry
            //     const sides = 5;
            //     const angle = Math.PI / sides; // 36°
            //     const topOffset = Math.cos(angle);   // relative top vertex distance
            //     const bottomOffset = 1;              // relative bottom vertex distance (radius itself)

            //     // Maximum radius so pentagon stays inside stage
            //     const maxLeft = lastShape.startX;
            //     const maxRight = stageSize.width - lastShape.startX;
            //     const maxTop = lastShape.startY / topOffset;
            //     const maxBottom = (stageSize.height - lastShape.startY) / bottomOffset;

            //     const maxRadius = Math.min(maxLeft, maxRight, maxTop, maxBottom);

            //     // Clamp radius
            //     r = Math.min(r, maxRadius);

            //     lastShape.x = lastShape.startX;
            //     lastShape.y = lastShape.startY;
            //     lastShape.radius = r;

            //     break;
            // }


            // ---------------- HEXAGON (center + radius) ----------------
            case "hexagon": {
                if (!lastShape) break;

                // Clamp pointer inside stage
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.startX;
                const dy = clampedY - lastShape.startY;

                // Initial radius from start point
                let r = Math.sqrt(dx * dx + dy * dy);

                // Maximum radius so hexagon stays inside stage
                const maxLeft = lastShape.startX;
                const maxRight = stageSize.width - lastShape.startX;
                const maxTop = lastShape.startY;
                const maxBottom = stageSize.height - lastShape.startY;

                const maxRadius = Math.min(maxLeft, maxRight, maxTop, maxBottom);

                // Use smallest of radius and maxRadius
                r = Math.min(r, maxRadius);

                // Keep center fixed
                lastShape.x = lastShape.startX;
                lastShape.y = lastShape.startY;
                lastShape.radius = r;

                break;
            }

            // ---------------- STAR (center + radius) ----------------
            // case "star": {
            //     if (!lastShape) break;

            //     // Clamp pointer inside stage
            //     const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
            //     const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

            //     const dx = clampedX - lastShape.startX;
            //     const dy = clampedY - lastShape.startY;

            //     // Determine radius based on largest movement (like triangle/pyramid)
            //     const radius = Math.min(
            //         Math.abs(dx),
            //         Math.abs(dy),
            //         lastShape.startX, // left boundary
            //         stageSize.width - lastShape.startX, // right boundary
            //         lastShape.startY, // top boundary
            //         stageSize.height - lastShape.startY // bottom boundary
            //     );

            //     lastShape.x = lastShape.startX; // center stays at startX
            //     lastShape.y = lastShape.startY; // center stays at startY
            //     lastShape.radius = radius;

            //     break;
            // }
            case "star": {
                if (!lastShape) break;

                // Clamp pointer inside stage
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.startX;
                const dy = clampedY - lastShape.startY;

                // Use max distance instead of min → expands in x, y, or diagonal
                let radius = Math.max(Math.abs(dx), Math.abs(dy));

                // Clamp so star doesn’t cross stage boundaries
                const maxLeft = lastShape.startX;
                const maxRight = stageSize.width - lastShape.startX;
                const maxUp = lastShape.startY;
                const maxDown = stageSize.height - lastShape.startY;
                const maxRadius = Math.min(maxLeft, maxRight, maxUp, maxDown);

                radius = Math.min(radius, maxRadius);

                // Keep center fixed at start point
                lastShape.x = lastShape.startX;
                lastShape.y = lastShape.startY;
                lastShape.radius = radius;

                break;
            }


            // ---------------- TRAPEZIUM (center + "radius" scaler) ----------------
            // Updating trapezium while drawing
            case "trapezium": {
                if (!lastShape) break;

                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.startX;
                const dy = clampedY - lastShape.startY;

                // Widths
                let topWidth = Math.abs(dx);
                let bottomWidth = topWidth * 1.5; // bottom wider for trapezium

                // Vertical: handle upward or downward drawing
                let y, height;
                if (dy >= 0) {
                    y = lastShape.startY;
                    height = dy;
                } else {
                    y = lastShape.startY + dy;
                    height = -dy;
                }

                // Clamp horizontal so trapezium stays in stage
                const halfTop = topWidth / 2;
                const halfBottom = bottomWidth / 2;

                // Compute tentative left/right positions
                let leftTop = lastShape.startX - halfTop;
                let rightTop = lastShape.startX + halfTop;
                let leftBottom = lastShape.startX - halfBottom;
                let rightBottom = lastShape.startX + halfBottom;

                // Shift center if any side goes out of stage
                let shiftX = 0;
                if (leftTop < 0 || leftBottom < 0) {
                    shiftX = Math.max(-leftTop, -leftBottom);
                } else if (rightTop > stageSize.width || rightBottom > stageSize.width) {
                    shiftX = Math.min(stageSize.width - rightTop, stageSize.width - rightBottom);
                }

                const cx = lastShape.startX + shiftX;

                lastShape.x = cx;
                lastShape.y = y;
                lastShape.width = topWidth;
                lastShape.bottomWidth = bottomWidth;
                lastShape.height = height;

                break;
            }




            // ---------------- RHOMBUS (center + "radius" scaler) ----------------
            //below is nojumping bbut crossimg boundaries
            // case "rhombus": {
            //   if (!lastShape) break;

            //   // Clamp pointer inside stage
            //   const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
            //   const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

            //   // Calculate width/height based on drag
            //   let width = clampedX - lastShape.startX;
            //   let height = clampedY - lastShape.startY;

            //   // Determine direction for drawing
            //   const xDir = width >= 0 ? 1 : -1;
            //   const yDir = height >= 0 ? 1 : -1;

            //   width = Math.abs(width);
            //   height = Math.abs(height);

            //   // Clamp width/height so rhombus stays inside stage
            //   if (xDir === 1) width = Math.min(width, stageSize.width - lastShape.startX);
            //   else width = Math.min(width, lastShape.startX);

            //   if (yDir === 1) height = Math.min(height, stageSize.height - lastShape.startY);
            //   else height = Math.min(height, lastShape.startY);

            //   lastShape.x = lastShape.startX; // Keep startX fixed
            //   lastShape.y = lastShape.startY; // Keep startY fixed
            //   lastShape.width = width;
            //   lastShape.height = height;
            //   lastShape.xDir = xDir;
            //   lastShape.yDir = yDir;

            //   break;
            // }

            //below is jumping and not crossig boundaries
            case "rhombus": {
                if (!lastShape) break;

                // Clamp pointer inside stage
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                // Calculate width/height based on drag
                let width = clampedX - lastShape.startX;
                let height = clampedY - lastShape.startY;

                // Determine draw direction
                const xDir = width >= 0 ? 1 : -1;
                const yDir = height >= 0 ? 1 : -1;

                width = Math.abs(width);
                height = Math.abs(height);

                // Clamp width/height so rhombus stays inside stage
                width = Math.min(width, xDir === 1 ? stageSize.width - lastShape.startX : lastShape.startX);
                height = Math.min(height, yDir === 1 ? stageSize.height - lastShape.startY : lastShape.startY);

                // Smooth center calculation to prevent jumping
                const centerX = lastShape.startX + (width / 2) * xDir;
                const centerY = lastShape.startY + (height / 2) * yDir;

                lastShape.x = centerX;
                lastShape.y = centerY;
                lastShape.width = width;
                lastShape.height = height;
                lastShape.xDir = xDir;
                lastShape.yDir = yDir;

                break;
            }



            // ---------------- ARROW / DASHED (two points) ----------------
            case "arrow":
            case "dashed":
                lastShape.points = [
                    Math.max(0, Math.min(lastShape.points[0], stageSize.width)),
                    Math.max(0, Math.min(lastShape.points[1], stageSize.height)),
                    Math.max(0, Math.min(point.x, stageSize.width)),
                    Math.max(0, Math.min(point.y, stageSize.height)),
                ];
                break;

            // ---------------- CUBE (center + size) ----------------
            case "cube": {
                if (!lastShape) break;

                // pointer clamped to stage
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.startX;
                const dy = clampedY - lastShape.startY;

                // raw side length (square constraint)
                let size = Math.max(Math.abs(dx), Math.abs(dy));

                // cube is centered between start and current
                const cx = lastShape.startX + dx / 2;
                const cy = lastShape.startY + dy / 2;

                // perspective factor used in your renderer: off = size * k (you use 0.5)
                const k = 0.5;

                // Asymmetric extents from center due to perspective:
                // left & bottom use 0.5*size; right & top use (0.5 + k)*size
                const limitLeft = 2 * cx; // size <= 2*cx
                const limitBottom = 2 * (stageSize.height - cy); // size <= 2*(H - cy)
                const limitRight = (stageSize.width - cx) / (0.5 + k); // size <= (W - cx)/(0.5+k)
                const limitTop = cy / (0.5 + k); // size <= cy/(0.5+k)

                size = Math.min(size, limitLeft, limitRight, limitTop, limitBottom);
                size = Math.max(5, size);

                lastShape.size = size;
                lastShape.x = cx; // center
                lastShape.y = cy; // center
                break;
            }

            // ---------------- PYRAMID (apex at startY, width/height) ----------------
            case "pyramid": {
                if (!lastShape) break;

                // Clamp pointer inside stage
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.startX;
                const dy = clampedY - lastShape.startY;

                const dirX = dx >= 0 ? 1 : -1;
                const dirY = dy >= 0 ? 1 : -1;

                // width and height
                let width = Math.abs(dx) * 2;
                let height = Math.abs(dy);

                // Clamp width so base stays in stage
                const halfMaxLeft = lastShape.startX;
                const halfMaxRight = stageSize.width - lastShape.startX;
                width = Math.min(width, Math.min(halfMaxLeft, halfMaxRight) * 2);

                // Clamp height so apex/base stays in stage
                const maxUp = lastShape.startY; // if drawing upward
                const maxDown = stageSize.height - lastShape.startY; // if drawing downward
                height = Math.min(height, dirY > 0 ? maxDown : maxUp);

                lastShape.width = width;
                lastShape.height = height;
                lastShape.dirX = dirX;
                lastShape.dirY = dirY;

                // Keep apex fixed at startX, startY
                lastShape.x = lastShape.startX;
                lastShape.y = lastShape.startY;

                break;
            }

            // ---------------- HEMISPHERE (center + radius) ----------------
            case "hemisphere": {
                if (!lastShape) break;

                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.startX;
                const dy = clampedY - lastShape.startY;

                const cx = lastShape.startX + dx / 2;
                const cy = lastShape.startY + dy / 2;
                let radius = Math.sqrt(dx * dx + dy * dy) / 2;

                const maxR = Math.min(
                    cx,
                    stageSize.width - cx,
                    cy,
                    stageSize.height - cy
                );

                lastShape.x = cx;
                lastShape.y = cy;
                lastShape.radius = Math.min(radius, maxR);
                break;
            }

            // ---------------- CONE (center + radius/height) ----------------
            // case "cone": {
            //     if (!lastShape) break;

            //     const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
            //     const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

            //     const dx = clampedX - lastShape.startX;
            //     const dy = clampedY - lastShape.startY;

            //     const cx = lastShape.startX + dx / 2;
            //     const cy = lastShape.startY + dy / 2;

            //     let radius = Math.abs(dx);
            //     let height = Math.abs(dy);

            //     const maxRX = Math.min(cx, stageSize.width - cx);
            //     const maxHY = Math.min(cy, stageSize.height - cy);

            //     lastShape.x = cx;
            //     lastShape.y = cy;
            //     lastShape.radius = Math.min(radius, maxRX);
            //     lastShape.height = Math.min(height, maxHY * 2); // keep top/bottom inside
            //     break;
            // }
            // case "cone": {
            //     if (!lastShape) break;

            //     const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
            //     const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

            //     const dx = clampedX - lastShape.startX;
            //     const dy = clampedY - lastShape.startY;

            //     let cx = lastShape.startX + dx / 2;
            //     let cy = lastShape.startY + dy / 2;   // use let, not const

            //     let radius = Math.abs(dx / 2);   // base half-width
            //     let height = Math.abs(dy);       // vertical span

            //     // --- Boundary checks ---
            //     // Base ellipse must be inside
            //     if (cy > stageSize.height) {
            //         cy = stageSize.height;
            //     }

            //     // Apex must be inside
            //     if (cy - height < 0) {
            //         height = cy; // reduce height so apex touches top
            //     }

            //     // Left/right base points inside stage
            //     const maxRX = Math.min(cx, stageSize.width - cx);
            //     radius = Math.min(radius, maxRX);

            //     lastShape.x = cx;
            //     lastShape.y = cy;
            //     lastShape.radius = radius;
            //     lastShape.height = height;
            //     break;
            // }

            case "cone": {
                if (!lastShape) break;

                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.startX;
                const dy = clampedY - lastShape.startY;

                let cx = lastShape.startX + dx / 2;
                let cy = lastShape.startY + dy / 2;   // midpoint
                let radius = Math.abs(dx / 2);        // base radius (half width)
                let height = Math.abs(dy);            // cone height
                let ry = radius / 3;                  // ellipse vertical radius

                // ✅ Left/right boundary clamp
                const maxRX = Math.min(cx, stageSize.width - cx);
                radius = Math.min(radius, maxRX);
                ry = radius / 3;

                // ✅ Apex must stay inside top
                if (cy - height < 0) {
                    height = cy; // move apex to top edge
                }

                // ✅ Base ellipse must stay inside bottom
                if (cy + ry > stageSize.height) {
                    cy = stageSize.height - ry;
                    // adjust height so apex follows correctly
                    if (cy - height < 0) {
                        height = cy;
                    }
                }

                lastShape.x = cx;
                lastShape.y = cy;
                lastShape.radius = radius;
                lastShape.height = height;
                break;
            }


            // ---------------- SPHERE (center + radius) ----------------
            case "sphere": {
                if (!lastShape) break;

                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                const dx = clampedX - lastShape.startX;
                const dy = clampedY - lastShape.startY;

                const cx = lastShape.startX + dx / 2;
                const cy = lastShape.startY + dy / 2;

                let radius = Math.max(Math.abs(dx), Math.abs(dy)) / 2;
                const maxR = Math.min(
                    cx,
                    stageSize.width - cx,
                    cy,
                    stageSize.height - cy
                );

                lastShape.x = cx;
                lastShape.y = cy;
                lastShape.radius = Math.min(radius, maxR);
                break;
            }

            // ---------------- CYLINDER (top-left + width/height) ----------------
            case "cylinder": {
                const clampedX = Math.max(0, Math.min(point.x, stageSize.width));
                const clampedY = Math.max(0, Math.min(point.y, stageSize.height));

                let width = clampedX - lastShape.x;
                let height = clampedY - lastShape.y;

                if (lastShape.x + width > stageSize.width)
                    width = stageSize.width - lastShape.x;
                if (lastShape.y + height > stageSize.height)
                    height = stageSize.height - lastShape.y;
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

    // const handleMouseUp = () => {
    //     if (!isDrawing.current) return;
    //     isDrawing.current = false;

    //     // const lastShape = shapes[shapes.length - 1];
    //     // if (lastShape && lastShape.tool !== "pen" && lastShape.tool !== "eraser") {
    //     //   setSelectedId(lastShape.id); // ✅ auto-select only shapes
    //     //   // setTool("select");             // switch to select mode
    //     // }

    //     const newHistory = history.slice(0, historyStep + 1);
    //     setHistory([...newHistory, shapes]);
    //     setHistoryStep(historyStep + 1);

    // };


    const handleMouseUp = () => {
        if (!isDrawing.current) return;
        isDrawing.current = false;

        setHistory((prevHistory) => {
            const step = prevHistory.length - 1; // current step
            const newHistory = prevHistory.slice(0, step + 1); // remove future steps if any
            newHistory.push([...shapes]); // push a copy of current shapes

            // ✅ Update historyStep AFTER creating newHistory
            setHistoryStep(newHistory.length - 1);

            return newHistory;
        });
    };

    const applyShapes = (newShapes) => {
        newShapes.forEach((shape) => {
            if (shape.tool === "image") preloadImage(shape.src);
        });
        setShapes(newShapes);
    };

    //initial
    // Keep history tracking centralized
    // const pushToHistory = (updatedShapes) => {
    //     const newHistory = history.slice(0, historyStep + 1); // remove "future" states if we undo then draw
    //     newHistory.push(updatedShapes);
    //     setHistory(newHistory);
    //     setHistoryStep(newHistory.length - 1);
    // };

    //This also works (i think it is looking better)
    const pushToHistory = (updatedShapes, isErase = false) => {

        if (isErase) {
            // Push the new state when a shape is erased (per-shape undo)
            const newHistory = history.slice(0, historyStep + 1);
            newHistory.push([...updatedShapes]);
            setHistory(newHistory);
            setHistoryStep(newHistory.length - 1);
        } else {
            // Push whole batch for drawing
            const newHistory = history.slice(0, historyStep + 1);
            newHistory.push(updatedShapes);
            setHistory(newHistory);
            setHistoryStep(newHistory.length - 1);
        }
    };

    //this also works as expected (recommended by gpt)
    // const pushToHistory = (updatedShapes, isErase = false) => {
    //     setHistory((prevHistory) => {
    //         // Use current historyStep from state directly
    //         const sliceStep = isErase ? historyStep : historyStep + 1;
    //         const newHistory = prevHistory.slice(0, sliceStep);
    //         newHistory.push([...updatedShapes]);

    //         // Update historyStep after creating the new history
    //         setHistoryStep(newHistory.length - 1);

    //         return newHistory;
    //     });
    // };



    useEffect(() => {
        pushToHistory([], false); // initial empty state
    }, []);

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
    const handleDelete = () => {
        if (selectedId) {
            setShapes(shapes.filter((shape) => shape.id !== selectedId));
            setSelectedId(null); // clear selection after delete
        }
    };

    const handleClear = () => {
        // Clear shapes and background
        setShapes([]);
        setBackgroundImage(null);

        // Reset history
        setHistory([[]]);
        setHistoryStep(0);

        // Clear transformer
        setSelectedId(null);
        if (transformerRef.current) {
            transformerRef.current.nodes([]);
            transformerRef.current.getLayer()?.batchDraw();
        }
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

    //   useEffect(() => {
    //     if (selectedId && transformerRef.current) {
    //       const node = stageRef.current.findOne("#" + selectedId);

    //       // Skip freehand nodes (pen/eraser)
    //       if (node && !node.hasName("freehand")) {
    //         transformerRef.current.nodes([node]);
    //       } else {
    //         transformerRef.current.nodes([]);
    //       }

    //       transformerRef.current.getLayer()?.batchDraw(); // redraw
    //     }
    //   }, [selectedId]);

    //   useEffect(() => {
    //     if (tool !== "select") {
    //       setSelectedId(null);
    //       const tr = transformerRef.current;
    //       if (tr) {
    //         tr.nodes([]);
    //         tr.getLayer()?.batchDraw();
    //       }
    //     }
    //   }, [tool]);

    // ----------------------
    // Attach transformer only when a shape is manually selected
    // ----------------------

    // useEffect(() => {
    //   if (!selectedId) return; // exit early if nothing selected

    //   const tr = transformerRef.current;
    //   if (!tr) return;

    //   // Only attach transformer if tool is "select"
    //   if (tool === "select") {
    //     const node = stageRef.current.findOne("#" + selectedId);

    //     // Skip freehand nodes (pen/eraser)
    //     if (node && !node.hasName("freehand")) {
    //       tr.nodes([node]); // attach transformer
    //     } else {
    //       tr.nodes([]); // clear transformer if not a valid node
    //     }

    //     tr.getLayer()?.batchDraw(); // redraw
    //   } else {
    //     // tool is not "select", ensure transformer is cleared
    //     tr.nodes([]);
    //     tr.getLayer()?.batchDraw();
    //   }
    // }, [selectedId, tool]);

    useEffect(() => {
        if (!selectedId) return;

        const tr = transformerRef.current;
        if (!tr) return;

        if (tool === "select") {
            const node = stageRef.current.findOne("#" + selectedId);

            if (node && !node.hasName("freehand")) {
                // ✅ Only attach if not already attached
                const attachedNodes = tr.nodes();
                if (attachedNodes.length === 0 || attachedNodes[0] !== node) {
                    tr.nodes([node]);
                    tr.getLayer()?.batchDraw();
                }
            } else {
                tr.nodes([]);
                tr.getLayer()?.batchDraw();
            }
        } else {
            tr.nodes([]);
            tr.getLayer()?.batchDraw();
        }
    }, [selectedId, tool]);

    // ----------------------
    // Clear transformer when switching tools
    // ----------------------
    useEffect(() => {
        if (tool !== "select") {
            setSelectedId(null); // deselect manually
            const tr = transformerRef.current;
            if (tr) {
                tr.nodes([]); // clear transformer
                tr.getLayer()?.batchDraw();
            }
        }
    }, [tool]);

    const cursorStyles = {
        pen: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
        eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${eraserSize / 2
            } ${eraserSize / 2}, auto`,
        rectangle: "crosshair",
        line: "crosshair",
        circle: "crosshair",
        triangle: "crosshair",
        ellipse: "crosshair",
        pentagon: "crosshair",
        square: "crosshair",
        hexagon: "crosshair",
        trapezium: "crosshair",
        star: "crosshair",
        rhombus: "crosshair",
        dashed: "crosshair",
        arrow: "crosshair",
        cube: "crosshair",
        sphere: "crosshair",
        cylinder: "crosshair",
        cone: "crosshair",
        hemisphere: "crosshair",
        pyramid: "crosshair",
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
            <div
                className="whiteboard-container"
                style={{
                    height: stageSize.height, // 👈 dynamic height
                }}
            >
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
                        onTouchStart={handleMouseDown}   // 👈 same as mouse down
                        onTouchMove={handleMouseMove}   // 👈 same as mouse move
                        onTouchEnd={handleMouseUp}      // 👈 same as mouse up
                        ref={stageRef}
                        style={{ backgroundColor: "var(--canvas-bg)", touchAction: "none" }}
                    >
                        <Layer>
                            {backgroundImage && (
                                <BackgroundImage
                                    imageUrl={backgroundImage}
                                    width={stageSize.width}
                                    height={stageSize.height}
                                />
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
                                                lineCap="round"     // Round line ends
                                                lineJoin="round"    // Smooth joints
                                                globalCompositeOperation="source-over"
                                                onClick={() =>
                                                    tool === "select" && setSelectedId(shape.id)
                                                }
                                                draggable={false} // ✅ prevent dragging
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                            />
                                        );

                                    case "eraser":
                                        return null; // don’t render anything visually



                                    case "line":
                                        return (
                                            <Line
                                                key={i}
                                                id={shape.id}
                                                x={shape.x}
                                                y={shape.y}
                                                points={shape.points}
                                                stroke={shape.color}
                                                strokeWidth={shape.size}
                                                hitStrokeWidth={20}
                                                lineCap="round"
                                                draggable={tool === "select"}
                                                onClick={() =>
                                                    tool === "select" && setSelectedId(shape.id)
                                                }
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
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
                                                        points: newPoints,
                                                        x: node.x(),
                                                        y: node.y(),
                                                        rotation: node.rotation(),
                                                    };

                                                    setShapes(newShapes);
                                                    pushToHistory(newShapes);

                                                    node.scaleX(1);
                                                    node.scaleY(1);
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
                                                    pushToHistory(newShapes); // 🔑 add this line so undo works after resize/rotate

                                                    // reset scale so next transforms apply correctly
                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            />
                                        );
                                    case "triangle":
                                        return (
                                            <Line
                                                key={shape.id}
                                                id={shape.id}
                                                x={shape.x} // top vertex
                                                y={shape.y}
                                                points={[
                                                    0, 0, // top
                                                    -shape.width / 2, shape.height, // bottom-left
                                                    shape.width / 2, shape.height, // bottom-right
                                                ]}
                                                stroke={shape.color}
                                                strokeWidth={shape.size}
                                                fill="transparent"
                                                closed
                                                draggable={tool === "select"}
                                                onClick={() => tool === "select" && setSelectedId(shape.id)}
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
                                                    pushToHistory(newShapes);

                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
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

                                                    // ✅ Compute diagonal scale factor
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();
                                                    const scale =
                                                        Math.sqrt(scaleX * scaleX + scaleY * scaleY) /
                                                        Math.sqrt(2);

                                                    const newShapes = shapes.slice();
                                                    newShapes[i] = {
                                                        ...newShapes[i],
                                                        x: node.x(),
                                                        y: node.y(),
                                                        radius: Math.max(5, shape.radius * scale), // keep uniform circle
                                                        rotation: node.rotation(),
                                                    };

                                                    setShapes(newShapes);
                                                    pushToHistory(newShapes);

                                                    // Reset scaling so Konva doesn't accumulate transforms
                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
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
                                                    pushToHistory(newShapes); // 🔑 add this line so undo works after resize/rotate

                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            />
                                        );

                                    case "square":
                                        return (
                                            <Rect
                                                key={i}
                                                id={shape.id}
                                                x={shape.x}
                                                y={shape.y}
                                                width={shape.size}
                                                height={shape.size}
                                                stroke={shape.color}
                                                strokeWidth={shape.sizeStroke}
                                                fill="transparent"
                                                draggable={tool === "select"}
                                                onClick={() =>
                                                    tool === "select" && setSelectedId(shape.id)
                                                }
                                                onTransformEnd={(e) => {
                                                    const node = e.target;

                                                    // true new size (width after transform)
                                                    const newSize = node.width() * node.scaleX();

                                                    const newShapes = [...shapes];
                                                    newShapes[i] = {
                                                        ...newShapes[i],
                                                        x: node.x(),
                                                        y: node.y(),
                                                        size: Math.max(5, newSize), // ✅ enforce square with actual scaled size
                                                        rotation: node.rotation(),
                                                    };

                                                    setShapes(newShapes);
                                                    pushToHistory(newShapes);

                                                    // reset scaling so it doesn’t accumulate
                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            />
                                        );

                                    case "pentagon":
                                        return (
                                            <RegularPolygon
                                                key={i}
                                                id={shape.id}
                                                x={shape.x}
                                                y={shape.y}
                                                sides={5}
                                                radius={shape.radius}
                                                stroke={shape.color}
                                                strokeWidth={shape.size}
                                                draggable={tool === "select"}
                                                onClick={() =>
                                                    tool === "select" && setSelectedId(shape.id)
                                                }
                                                onTransformEnd={(e) => {
                                                    const node = e.target;

                                                    // ✅ Take the *diagonal scale factor*
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();
                                                    const scale =
                                                        Math.sqrt(scaleX * scaleX + scaleY * scaleY) /
                                                        Math.sqrt(2);

                                                    const newShapes = shapes.slice();
                                                    newShapes[i] = {
                                                        ...newShapes[i],
                                                        x: node.x(),
                                                        y: node.y(),
                                                        radius: Math.max(5, shape.radius * scale), // uniform resize
                                                        rotation: node.rotation(),
                                                    };

                                                    setShapes(newShapes);
                                                    pushToHistory(newShapes);

                                                    // reset scaling so Konva transformer doesn't accumulate scale
                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            />
                                        );

                                    case "rhombus":
                                        return (
                                            <Line
                                                key={i}
                                                id={shape.id}
                                                x={shape.x}
                                                y={shape.y}
                                                points={[
                                                    0,
                                                    (-shape.height * shape.yDir) / 2, // top
                                                    (shape.width * shape.xDir) / 2,
                                                    0, // right
                                                    0,
                                                    (shape.height * shape.yDir) / 2, // bottom
                                                    (-shape.width * shape.xDir) / 2,
                                                    0, // left
                                                    0,
                                                    (-shape.height * shape.yDir) / 2, // close top
                                                ]}
                                                stroke={shape.color}
                                                strokeWidth={shape.size}
                                                closed
                                                draggable={tool === "select"}
                                                onClick={() => tool === "select" && setSelectedId(shape.id)}
                                                onTransformEnd={(e) => {
                                                    const node = e.target;

                                                    // Uniform scale for smooth resizing
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();
                                                    const uniformScale = (scaleX + scaleY) / 2;

                                                    const updated = {
                                                        ...shape,
                                                        x: node.x(),
                                                        y: node.y(),
                                                        width: Math.max(5, shape.width * uniformScale),
                                                        height: Math.max(5, shape.height * uniformScale),
                                                        rotation: node.rotation(),
                                                    };

                                                    node.scaleX(1);
                                                    node.scaleY(1);

                                                    const newShapes = [...shapes];
                                                    newShapes[i] = updated;
                                                    setShapes(newShapes);
                                                    pushToHistory(newShapes);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            />
                                        );

                                    // Rendering trapezium
                                    case "trapezium":
                                        return (
                                            <Group
                                                key={shape.id}
                                                id={shape.id}
                                                x={shape.x}
                                                y={shape.y}
                                                draggable={tool === "select"}
                                                onClick={() => tool === "select" && setSelectedId(shape.id)}
                                                onTransformEnd={(e) => {
                                                    const node = e.target;
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();

                                                    // Uniform scale for smooth resizing
                                                    const uniformScale = (scaleX + scaleY) / 2;

                                                    const updatedShapes = [...shapes];
                                                    updatedShapes[i] = {
                                                        ...updatedShapes[i],
                                                        x: node.x(),
                                                        y: node.y(),
                                                        width: Math.max(5, shape.width * uniformScale),
                                                        bottomWidth: Math.max(5, shape.bottomWidth * uniformScale),
                                                        height: Math.max(5, shape.height * uniformScale),
                                                    };

                                                    node.scaleX(1);
                                                    node.scaleY(1);

                                                    setShapes(updatedShapes);
                                                    pushToHistory(updatedShapes);
                                                    // ✅ reattach transformer for smooth UX
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
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            >
                                                {/* Invisible rectangle to capture clicks */}
                                                <Rect
                                                    x={-shape.width / 2}
                                                    y={0}
                                                    width={shape.width}
                                                    height={shape.height}
                                                    fill="transparent"
                                                    listening={true}
                                                />

                                                {/* Trapezium */}
                                                <Line
                                                    points={[
                                                        -shape.width / 2, 0,                  // top-left
                                                        shape.width / 2, 0,                   // top-right
                                                        shape.bottomWidth / 2, shape.height,  // bottom-right
                                                        -shape.bottomWidth / 2, shape.height  // bottom-left
                                                    ]}
                                                    stroke={shape.color}
                                                    strokeWidth={shape.size}
                                                    fill="transparent"
                                                    closed
                                                />
                                            </Group>
                                        );

                                    case "star":
                                        return (
                                            <Star
                                                key={i}
                                                id={shape.id}
                                                x={shape.x}
                                                y={shape.y}
                                                numPoints={shape.numPoints}
                                                innerRadius={shape.radius / 2}
                                                outerRadius={shape.radius}
                                                stroke={shape.color}
                                                strokeWidth={shape.size}
                                                draggable={tool === "select"}
                                                onClick={() =>
                                                    tool === "select" && setSelectedId(shape.id)
                                                }
                                                onTransformEnd={(e) => {
                                                    const node = e.target;

                                                    // take both scales into account
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();

                                                    // ✅ average scale → so both X and Y resizing affect size
                                                    const scale = (scaleX + scaleY) / 2;

                                                    const updated = {
                                                        ...shape,
                                                        x: node.x(),
                                                        y: node.y(),
                                                        radius: Math.max(5, shape.radius * scale), // expand + shrink uniformly
                                                        rotation: node.rotation(),
                                                    };

                                                    setShapes((prev) => {
                                                        const next = prev.map((s) =>
                                                            s.id === shape.id ? updated : s
                                                        );
                                                        pushToHistory(next);
                                                        return next;
                                                    });

                                                    // reset scale so transforms don't accumulate
                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            />
                                        );
                                    case "hexagon":
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

                                                    // ✅ Take the *diagonal scale factor*
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();
                                                    const scale =
                                                        Math.sqrt(scaleX * scaleX + scaleY * scaleY) /
                                                        Math.sqrt(2);

                                                    const newShapes = shapes.slice();
                                                    newShapes[i] = {
                                                        ...newShapes[i],
                                                        x: node.x(),
                                                        y: node.y(),
                                                        radius: Math.max(5, shape.radius * scale), // uniform resize
                                                        rotation: node.rotation(),
                                                    };

                                                    setShapes(newShapes);
                                                    pushToHistory(newShapes);

                                                    // reset scaling so Konva transformer doesn't accumulate scale
                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
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
                                                    pushToHistory(newShapes); // 🔑 add this line so undo works after resize/rotate

                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
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
                                                    pushToHistory(newShapes); // 🔑 add this line so undo works after resize/rotate

                                                    node.scaleX(1);
                                                    node.scaleY(1);
                                                }}
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            />
                                        );

                                    case "cube": {
                                        const s = shape.size;
                                        const half = s / 2;
                                        const off = s / 2; // depth offset; tweak if you want less perspective

                                        // FRONT face centered on (0,0)
                                        const front = [
                                            -half,
                                            -half,
                                            half,
                                            -half,
                                            half,
                                            half,
                                            -half,
                                            half,
                                        ];

                                        // BACK face shifted by ( +off, -off )
                                        const back = [
                                            -half + off,
                                            -half - off,
                                            half + off,
                                            -half - off,
                                            half + off,
                                            half - off,
                                            -half + off,
                                            half - off,
                                        ];
                                        // Define dashed line properties
                                        const dashProps = {
                                            dash: [5, 5], // Example: 5px dash, 5px gap
                                            stroke: shape.color,
                                        };
                                        return (
                                            <Group
                                                key={shape.id}
                                                id={shape.id} // Transformer attaches to the GROUP
                                                name="cube"
                                                x={shape.x} // CENTER of the cube
                                                y={shape.y}
                                                draggable={tool === "select"}
                                                onClick={() =>
                                                    tool === "select" && setSelectedId(shape.id)
                                                }
                                                onTransformEnd={(e) => {
                                                    const node = e.target;

                                                    // ✅ uniform scale (like hexagon)
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();
                                                    const scale =
                                                        Math.sqrt(scaleX * scaleX + scaleY * scaleY) /
                                                        Math.sqrt(2);

                                                    const newShapes = shapes.slice();
                                                    newShapes[i] = {
                                                        ...newShapes[i],
                                                        x: node.x(),
                                                        y: node.y(),
                                                        size: Math.max(5, shape.size * scale),
                                                        rotation: node.rotation(),
                                                    };

                                                    setShapes(newShapes);
                                                    pushToHistory(newShapes);

                                                    // reset scaling
                                                    node.scaleX(1);
                                                    node.scaleY(1);

                                                    // ✅ reattach transformer for smooth UX
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
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            >
                                                {/* Invisible hit area */}
                                                <Rect
                                                    x={-shape.size / 2}
                                                    y={-shape.size / 2 - shape.size / 2} // adjust for back offset
                                                    width={shape.size + shape.size / 2}
                                                    height={shape.size + shape.size / 2}
                                                    fill="transparent"
                                                />


                                                {/* Front */}
                                                <Line points={front} stroke={shape.color} closed />
                                                {/* Back */}
                                                <Line
                                                    points={[back[0], back[1], back[2], back[3]]}
                                                    stroke={shape.color}

                                                />
                                                <Line
                                                    points={[back[2], back[3], back[4], back[5]]}
                                                    stroke={shape.color}

                                                />
                                                <Line
                                                    points={[back[4], back[5], back[6], back[7]]}
                                                    stroke={shape.color}
                                                    {...dashProps}
                                                />
                                                <Line
                                                    points={[back[6], back[7], back[0], back[1]]}
                                                    stroke={shape.color}
                                                    {...dashProps}
                                                />
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
                                                    {...dashProps}
                                                />
                                            </Group>
                                        );
                                    }
                                    case "hemisphere":
                                        return (
                                            <Group
                                                key={shape.id}
                                                id={shape.id}
                                                x={shape.x}
                                                y={shape.y}
                                                draggable={tool === "select"}
                                                onClick={() =>
                                                    tool === "select" && setSelectedId(shape.id)
                                                }
                                                onTransformEnd={(e) => {
                                                    const node = e.target;

                                                    // ✅ diagonal scale for uniform resize
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();
                                                    const scale =
                                                        Math.sqrt(scaleX * scaleX + scaleY * scaleY) /
                                                        Math.sqrt(2);

                                                    const updated = {
                                                        ...shape,
                                                        radius: Math.max(2, shape.radius * scale),
                                                        x: node.x(),
                                                        y: node.y(),
                                                        rotation: node.rotation(),
                                                    };

                                                    // reset scale so future transforms are fresh
                                                    node.scaleX(1);
                                                    node.scaleY(1);

                                                    setShapes((prevShapes) => {
                                                        const newShapes = prevShapes.map((s) =>
                                                            s.id === shape.id ? updated : s
                                                        );
                                                        pushToHistory(newShapes);
                                                        return newShapes;
                                                    });

                                                    // ✅ reattach transformer for smooth UX
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
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            >
                                                {/* Invisible hit shape for pointer events only */}
                                                <Shape
                                                    sceneFunc={(ctx, shapeObj) => {
                                                        // Draw a half-circle path for pointer detection
                                                        ctx.beginPath();
                                                        ctx.arc(0, 0, shape.radius, Math.PI, 0, false); // half-circle
                                                        ctx.closePath();
                                                        ctx.fillStrokeShape(shapeObj);
                                                    }}
                                                    fill="transparent"
                                                    stroke="transparent"
                                                    listening={true}
                                                    perfectDrawEnabled={false} // prevents affecting Transformer bounds
                                                    
                                                />
                                                {/* Outer half-circle boundary */}
                                                <Line
                                                    points={Array.from({ length: 50 }, (_, i) => {
                                                        const angle = (Math.PI * i) / 49; // 0 -> π (half-circle)
                                                        return [
                                                            Math.cos(angle) * shape.radius,
                                                            -Math.sin(angle) * shape.radius,
                                                        ];
                                                    }).flat()}
                                                    stroke={shape.color}
                                                    strokeWidth={shape.size}
                                                    closed={false} // keep it as just boundary
                                                    //  listening={false}
                                                />

                                                {/* Dashed ellipse (top 3D curvature) */}
                                                <Ellipse
                                                    radiusX={shape.radius}
                                                    radiusY={shape.radius / 2}
                                                    stroke={shape.color}
                                                    strokeWidth={shape.size}
                                                    dash={[10, 5]}
                                                    fill="transparent"
                                                />
                                            </Group>
                                        );

                                    case "pyramid":
                                        return (
                                            <Group
                                                key={shape.id}
                                                id={shape.id}
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
                                                    const uniformScale = (scaleX + scaleY) / 2;

                                                    const updated = {
                                                        ...shape,
                                                        width: Math.max(5, shape.width * uniformScale),
                                                        height: Math.max(5, shape.height * uniformScale),
                                                        x: node.x(),
                                                        y: node.y(),
                                                    };

                                                    node.scaleX(1);
                                                    node.scaleY(1);

                                                    setShapes((prevShapes) => {
                                                        const newShapes = prevShapes.map((s) =>
                                                            s.id === shape.id ? updated : s
                                                        );
                                                        pushToHistory(newShapes);
                                                        return newShapes;
                                                    });

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
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            >
                                                {(() => {
                                                    const w = shape.width / 2;
                                                    const h = shape.height;
                                                    const dirX = shape.dirX || 1;
                                                    const dirY = shape.dirY || 1;

                                                    return (
                                                        <>
                                                            {/* Outer triangle */}
                                                            <Line
                                                                points={[
                                                                    0,
                                                                    0, // apex
                                                                    -w * dirX,
                                                                    h * dirY, // left base
                                                                    w * dirX,
                                                                    h * dirY, // right base
                                                                    0,
                                                                    0,
                                                                ]}
                                                                stroke={shape.color}
                                                                strokeWidth={shape.size}
                                                                closed
                                                                fill="transparent"
                                                            />

                                                            {/* Inner triangle */}
                                                            <Line
                                                                points={[
                                                                    0,
                                                                    (h / 2) * dirY, // inner apex
                                                                    -w * dirX,
                                                                    h * dirY, // left base
                                                                    w * dirX,
                                                                    h * dirY, // right base
                                                                    0,
                                                                    (h / 2) * dirY,
                                                                ]}
                                                                stroke={shape.color}
                                                                strokeWidth={shape.size}
                                                                closed
                                                                fill="transparent"
                                                            />

                                                            {/* Dashed line */}
                                                            <Line
                                                                points={[0, 0, 0, (h / 2) * dirY]}
                                                                stroke={shape.color}
                                                                strokeWidth={shape.size}
                                                                dash={[10, 5]}
                                                            />
                                                        </>
                                                    );
                                                })()}
                                            </Group>
                                        );

                                    case "cone":
                                        { const dashProps = {
                                            dash: [5, 5],
                                            stroke: shape.color,
                                        };
                                        return (
                                            <Group
                                                key={shape.id}
                                                id={shape.id}
                                                x={shape.x}
                                                y={shape.y}
                                                draggable={tool === "select"}
                                                listening={true} // important: ensures clicks register anywhere in the group
                                                onClick={() =>
                                                    tool === "select" && setSelectedId(shape.id)
                                                }
                                                onTransformEnd={(e) => {
                                                    const node = e.target;

                                                    // ✅ diagonal scale for uniform resize (works in X & Y)
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();
                                                    const scale =
                                                        Math.sqrt(scaleX * scaleX + scaleY * scaleY) /
                                                        Math.sqrt(2);

                                                    const updated = {
                                                        ...shape,
                                                        radius: Math.max(2, shape.radius * scale),
                                                        height: Math.max(2, shape.height * scale),
                                                        x: node.x(),
                                                        y: node.y(),
                                                        rotation: node.rotation(),
                                                    };

                                                    // reset scale so future transforms are fresh
                                                    node.scaleX(1);
                                                    node.scaleY(1);

                                                    setShapes((prevShapes) => {
                                                        const newShapes = prevShapes.map((s) =>
                                                            s.id === shape.id ? updated : s
                                                        );
                                                        pushToHistory(newShapes);
                                                        return newShapes;
                                                    });

                                                    // ✅ reattach transformer
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
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            >
                                                {/* Invisible hit area covering entire cone */}
                                                <Line
                                                    points={[
                                                        0,
                                                        -shape.height, // apex
                                                        -shape.radius,
                                                        0, // left base
                                                        shape.radius,
                                                        0, // right base
                                                        0,
                                                        -shape.height, // close the triangle
                                                    ]}
                                                    fill="rgba(0,0,0,0.01)" // tiny visible opacity just to register clicks
                                                    strokeWidth={0}
                                                    closed
                                                />

                                                {/* Left triangle (visible lines) */}
                                                <Line
                                                    points={[0, -shape.height, -shape.radius, 0]}
                                                    stroke={shape.color}
                                                    strokeWidth={shape.size}
                                                    fill="transparent"
                                                />

                                                {/* Right triangle (visible lines) */}
                                                <Line
                                                    points={[0, -shape.height, shape.radius, 0]}
                                                    stroke={shape.color}
                                                    strokeWidth={shape.size}
                                                    fill="transparent"
                                                />

                                                {/* Base ellipse */}
                                                <Ellipse
                                                    radiusX={shape.radius}
                                                    radiusY={shape.radius / 3}
                                                    stroke={shape.color}
                                                    fill="transparent"
                                                    {...dashProps} // This applies the dashed effect
                                                />
                                            </Group>
                                        ); }

                                    case "sphere": {
                                        const r = shape.radius;

                                        return (
                                            <Group
                                                key={shape.id}
                                                id={shape.id}
                                                name="sphere"
                                                x={shape.x}
                                                y={shape.y}
                                                draggable={tool === "select"}
                                                onClick={() =>
                                                    tool === "select" && setSelectedId(shape.id)
                                                }
                                                onTransformEnd={(e) => {
                                                    const node = e.target;

                                                    // ✅ Use diagonal scale (so shrinking works too)
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();
                                                    const scale =
                                                        Math.sqrt(scaleX * scaleX + scaleY * scaleY) /
                                                        Math.sqrt(2);

                                                    const updated = {
                                                        ...shape,
                                                        x: node.x(),
                                                        y: node.y(),
                                                        radius: Math.max(2, shape.radius * scale),
                                                        rotation: node.rotation(),
                                                    };

                                                    // reset scale so future transforms are fresh
                                                    node.scaleX(1);
                                                    node.scaleY(1);

                                                    setShapes((prevShapes) => {
                                                        const newShapes = prevShapes.map((s) =>
                                                            s.id === shape.id ? updated : s
                                                        );
                                                        pushToHistory(newShapes);
                                                        return newShapes;
                                                    });

                                                    // ✅ reattach transformer
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
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            >
                                                {/* Outer Circle */}
                                                <Circle
                                                    radius={r}
                                                    stroke={shape.color}
                                                    dashEnabled={false}
                                                />

                                                {/* Horizontal ellipse (equator) */}
                                                <Ellipse
                                                    radiusX={r}
                                                    radiusY={r / 2}
                                                    stroke={shape.color}
                                                    dash={[6, 6]}
                                                />

                                                {/* Vertical ellipse (meridian) */}
                                                <Ellipse
                                                    radiusX={r / 2}
                                                    radiusY={r}
                                                    stroke={shape.color}
                                                    dash={[6, 6]}
                                                />
                                            </Group>
                                        );
                                    }

                                    // case "cylinder": {
                                    //     const rx = Math.abs(shape.width / 2); // horizontal radius
                                    //     const ry = Math.max(8, Math.min(30, rx / 3)); // vertical radius of ellipse

                                    //     return (
                                    //         <Group
                                    //             key={shape.id}
                                    //             id={shape.id}
                                    //             x={shape.x}
                                    //             y={shape.y}
                                    //             draggable={tool === "select"}
                                    //             onClick={() =>
                                    //                 tool === "select" && setSelectedId(shape.id)
                                    //             }
                                    //             onTransformEnd={(e) => {
                                    //                 const node = e.target;
                                    //                 const scaleX = node.scaleX();
                                    //                 const scaleY = node.scaleY();

                                    //                 const updated = {
                                    //                     ...shape,
                                    //                     x: node.x(),
                                    //                     y: node.y(),
                                    //                     width: Math.max(10, shape.width * scaleX),
                                    //                     height: Math.max(10, shape.height * scaleY),
                                    //                 };

                                    //                 node.scaleX(1);
                                    //                 node.scaleY(1);

                                    //                 const updatedShapes = shapes.map((s) =>
                                    //                     s.id === shape.id ? updated : s
                                    //                 );
                                    //                 setShapes(updatedShapes);
                                    //                 pushToHistory(updatedShapes);
                                    //                 // ✅ reattach transformer
                                    //                 requestAnimationFrame(() => {
                                    //                     const stage = stageRef.current;
                                    //                     const tr = transformerRef.current;
                                    //                     if (!stage || !tr) return;
                                    //                     const n = stage.findOne(`#${shape.id}`);
                                    //                     if (n) {
                                    //                         tr.nodes([n]);
                                    //                         tr.getLayer()?.batchDraw();
                                    //                     }
                                    //                 });
                                    //             }}
                                    //             onDragEnd={(e) => handleDragEnd(e, i)}
                                    //         >
                                    //             {/* Invisible rectangle to make full area selectable */}
                                    //             <Rect
                                    //                 x={0}
                                    //                 y={0}
                                    //                 width={shape.width}
                                    //                 height={shape.height}
                                    //                 fill="transparent"
                                    //                 listening={true} // ensures it catches clicks
                                    //             />

                                    //             {/* Top ellipse */}
                                    //             <Ellipse
                                    //                 x={shape.width / 2}
                                    //                 y={0}
                                    //                 radiusX={rx}
                                    //                 radiusY={ry}
                                    //                 stroke={shape.color}
                                    //                 strokeWidth={shape.size}
                                    //             />

                                    //             {/* Bottom ellipse */}
                                    //             <Ellipse
                                    //                 x={shape.width / 2}
                                    //                 y={shape.height}
                                    //                 radiusX={rx}
                                    //                 radiusY={ry}
                                    //                 stroke={shape.color}
                                    //                 strokeWidth={shape.size}
                                    //             />

                                    //             {/* Left vertical line */}
                                    //             <Line
                                    //                 points={[0, 0, 0, shape.height]}
                                    //                 stroke={shape.color}
                                    //                 strokeWidth={shape.size}
                                    //             />

                                    //             {/* Right vertical line */}
                                    //             <Line
                                    //                 points={[shape.width, 0, shape.width, shape.height]}
                                    //                 stroke={shape.color}
                                    //                 strokeWidth={shape.size}
                                    //             />
                                    //         </Group>
                                    //     );
                                    // }
                                    case "cylinder": {
                                        const rx = Math.abs(shape.width / 2); // horizontal radius
                                        const ry = Math.max(8, Math.min(30, rx / 3)); // vertical radius

                                        return (
                                            <Group
                                                key={shape.id}
                                                id={shape.id}
                                                x={shape.x}
                                                y={shape.y}
                                                draggable={tool === "select"}
                                                onClick={() => tool === "select" && setSelectedId(shape.id)}
                                                onTransformEnd={(e) => {
                                                    const node = e.target;
                                                    const scaleX = node.scaleX();
                                                    const scaleY = node.scaleY();

                                                    const updated = {
                                                        ...shape,
                                                        x: node.x(),
                                                        y: node.y(),
                                                        width: Math.max(10, shape.width * scaleX),
                                                        height: Math.max(10, shape.height * scaleY),
                                                    };

                                                    node.scaleX(1);
                                                    node.scaleY(1);

                                                    const updatedShapes = shapes.map((s) =>
                                                        s.id === shape.id ? updated : s
                                                    );
                                                    setShapes(updatedShapes);
                                                    pushToHistory(updatedShapes);

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
                                                onDragEnd={(e) => handleDragEnd(e, i)}
                                                dragBoundFunc={getBoundedDragFunc(shape)}
                                            >
                                                {/* Invisible rectangle for full hit area */}
                                                <Rect
                                                    x={0}
                                                    y={0}
                                                    width={shape.width}
                                                    height={shape.height}
                                                    fill="transparent"
                                                    listening={true}
                                                />

                                                {/* Top ellipse - solid */}
                                                <Ellipse
                                                    x={shape.width / 2}
                                                    y={0}
                                                    radiusX={rx}
                                                    radiusY={ry}
                                                    stroke={shape.color}
                                                    strokeWidth={shape.size}
                                                />

                                                {/* Vertical lines */}
                                                <Line points={[0, 0, 0, shape.height]} stroke={shape.color} strokeWidth={shape.size} />
                                                <Line points={[shape.width, 0, shape.width, shape.height]} stroke={shape.color} strokeWidth={shape.size} />

                                                {/* Bottom ellipse - dashed */}
                                                <Ellipse
                                                    x={shape.width / 2}
                                                    y={shape.height}
                                                    radiusX={rx}
                                                    radiusY={ry}
                                                    stroke={shape.color}
                                                    strokeWidth={shape.size}
                                                    dash={[5, 5]}
                                                />
                                            </Group>
                                        );
                                    }

                                    case "image":
                                        return (
                                            <ImageShape
                                                key={shape.id}
                                                shape={shape}
                                                index={i} // pass index so handleDragEnd works
                                                tool={tool}
                                                image={imageCache[shape.src]} // pass HTMLImageElement if cached
                                                isSelected={selectedId === shape.id}
                                                onSelect={setSelectedId}
                                                onChange={(newShape) => {
                                                    const newShapes = shapes.slice();
                                                    newShapes[i] = newShape;
                                                    setShapes(newShapes);
                                                    pushToHistory(newShapes); // ✅ keep history onChange too
                                                }}
                                                handleDragEnd={handleDragEnd} // pass the global handler
                                                shapes={shapes}
                                                pushToHistory={pushToHistory}
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
                        onClick={() => handleToolToggle("pen")}
                        className={`p-2 rounded-full ${tool === "pen" ? "bg-blue-100 text-blue-stageSize.height" : ""
                            }`}
                    >
                        <FaPen size={20} />
                    </button>
                    {/* Always Visible Pen Size Slider */}
                    {/* <div className="flex flex-col items-center mt-2 p-2 rounded-lg shadow-md w-16 bg-white dark:bg-gray-800">
  <label className="text-[13px] mb-1 font-medium">Pen</label>
  <input
    type="range"
    min="1"
    max="20"
    value={penSize}
    onChange={(e) => setPenSize(Number(e.target.value))}
    className="w-full accent-blue-500 h-1.5"
  />
  <span className="text-[11px] mt-1">{penSize}px</span>
</div> */}
                    <label className="text-[13px] mb-1 font-medium">Pen</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={penSize}
                        onChange={(e) => setPenSize(Number(e.target.value))}
                        className="w-full accent-blue-500 h-1.5"
                    />
                    <span className="text-[11px] mt-1">{penSize}px</span>

                    <button
                        onClick={() => handleToolToggle("eraser")}
                        className={`p-2 rounded-full ${tool === "eraser" ? "bg-blue-100 text-blue-stageSize.height" : ""
                            }`}
                    >
                        <FaEraser size={20} />
                    </button>
                    {/* {tool === "eraser" && (
  
  <div className="">
    <label className="text-[13px] mb-1 font-medium">Eraser</label>
    <input
      type="range"
      min="5"
      max="50"
      value={eraserSize}
      onChange={(e) => setEraserSize(Number(e.target.value))}
      className="w-full accent-red-500 h-1.5"
    />
    <span className="text-[11px] mt-1">{eraserSize}px</span>
  </div>
)} */}

                    <button
                        onClick={() => handleToolToggle("select")}
                        className={`p-2 rounded-full ${tool === "select" ? "bg-blue-100 " : ""
                            }`}
                    >
                        <FaMousePointer size={20} />
                    </button>

                    <div className="relative flex flex-col items-center">
                        <button
                            //   onClick={() => setShowShapes(!showShapes)}
                            onClick={() =>
                                setActivePanel((prev) => (prev === "shapes" ? null : "shapes"))
                            }
                            className={`p-2 rounded-full ${[
                                "rectangle",
                                "line",
                                "circle",
                                "triangle",
                                "ellipse",
                                "pentagon",
                                "square",
                                "hexagon",
                                "trapezium",
                                "star",
                                "rhombus",
                                "dashed",
                                "arrow",
                                "cube",
                                "sphere",
                                "cylinder",
                                "cone",
                                "hemisphere",
                                "pyramid",
                            ].includes(tool)
                                ? "bg-blue-100 text-blue-stageSize.height"
                                : ""
                                }`}
                        >
                            <FaShapes size={20} />
                        </button>

                        {activePanel === "shapes" && (
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
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "rectangle" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        ▭
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("circle"); //hum yeh nahi chahte ki shape ko dobara click krne se shape deselect ho jaye isliye yahan handletooltoggle nahi likha
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "circle" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        ⭘
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("triangle");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "triangle" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        △
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("ellipse");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "ellipse" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        ⬭
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("pentagon");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "pentagon" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        ⬠
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("hexagon");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "hexagon" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        ⬡
                                    </button>

                                    {/* Rhombus */}
                                    <button
                                        onClick={() => {
                                            setTool("rhombus");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "rhombus" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        ◇
                                    </button>
                                    {/* Star */}
                                    <button
                                        onClick={() => {
                                            setTool("star");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "star" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        ☆
                                    </button>

                                    {/* Trapezium */}
                                    <button
                                        onClick={() => {
                                            setTool("trapezium");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "trapezium" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        ⏢
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("square");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-blue-300 flex justify-center items-center ${tool === "square" ? "bg-blue-500 text-white" : ""
                                            }`}
                                    >
                                        ☐
                                    </button>
                                </div>

                                {/* Lines Section */}
                                <p className="text-xs font-semibold mb-2">Lines</p>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <button
                                        onClick={() => {
                                            setTool("line");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-green-300 flex justify-center items-center ${tool === "line" ? "bg-green-500 text-white" : ""
                                            }`}
                                    >
                                        <FaSlash />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("arrow");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-green-300 flex justify-center items-center ${tool === "arrow" ? "bg-green-500 text-white" : ""
                                            }`}
                                    >
                                        ⟶
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("dashed");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-green-300 flex justify-center items-center ${tool === "dashed" ? "bg-green-500 text-white" : ""
                                            }`}
                                    >
                                        -----
                                    </button>
                                </div>

                                {/* 3D Shapes Section */}
                                <p className="text-xs font-semibold mb-2">3D Shapes (Future)</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => {
                                            setTool("cube");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-red-300 flex justify-center items-center ${tool === "cube" ? "bg-red-500 text-white" : ""
                                            }`}
                                    >
                                        <HiOutlineCube size={20} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("sphere");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-red-300 flex justify-center items-center ${tool === "sphere" ? "bg-red-500 text-white" : ""
                                            }`}
                                    >
                                        <HiOutlineGlobe size={20} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setTool("cylinder");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-red-300 flex justify-center items-center ${tool === "cylinder" ? "bg-red-500 text-white" : ""
                                            }`}
                                    >
                                        <Cylinder size={20} />
                                    </button>
                                    {/* Cone */}
                                    <button
                                        onClick={() => {
                                            setTool("cone");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-red-300 flex justify-center items-center ${tool === "cone" ? "bg-red-500 text-white" : ""
                                            }`}
                                    >
                                        <Cone size={20} />
                                    </button>

                                    {/* Hemisphere */}
                                    <button
                                        onClick={() => {
                                            setTool("hemisphere");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-red-300 flex justify-center items-center ${tool === "hemisphere" ? "bg-red-500 text-white" : ""
                                            }`}
                                    >
                                        ◑
                                    </button>

                                    {/* Pyramid */}
                                    <button
                                        onClick={() => {
                                            setTool("pyramid");
                                            setActivePanel(null); // close after selecting
                                        }}
                                        className={`p-2 border rounded hover:bg-red-300 flex justify-center items-center ${tool === "pyramid" ? "bg-red-500 text-white" : ""
                                            }`}
                                    >
                                        <Pyramid size={20} />
                                    </button>
                                </div>

                                {/* --- Pen Size Selector --- */}
                                {/* {tool === "pen" && (
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
                )} */}

                                {/* --- Eraser Size Selector --- */}
                                {/* {tool === "eraser" && (
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
                )} */}
                            </div>
                        )}
                    </div>

                    <div className="relative mt-2">
                        <button
                            //   onClick={() => setShowColors(!showColors)}
                            onClick={() => handleColorToggle("color")}
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: penColor }}
                        />
                        {activePanel === "color" && (
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
                                                setActivePanel(null); // close color panel
                                            }}
                                            className={`w-6 h-6 rounded-full border-2 ${penColor === color
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

                    <button onClick={handleDelete} className="p-2 rounded-full">
                        <FaTimes size={20} />
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


