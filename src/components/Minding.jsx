

import { useRef, useState, useEffect } from "react";
import { Stage, Layer, Line, Rect, Image as KonvaImage, Circle, Transformer, Ellipse, Group, RegularPolygon, Arrow } from "react-konva";
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
import { HiOutlineCube, HiOutlineGlobe, HiOutlineDesktopComputer } from "react-icons/hi";

// Component to render the imported background image
const BackgroundImage = ({ imageUrl }) => {
    const [image] = useImage(imageUrl);
    return <KonvaImage image={image} x={0} y={0} width={1100} height={600} listening={false} />;
};

const ImageShape = ({ shape, isSelected, onSelect, onChange, tool }) => {
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

export default function Minding() {
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

    const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#f3f4f6", "#FFCDD2", "#FFF59D", "#BBDEFB"];

    // --- SELECTION AND DRAWING LOGIC ---
    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage(); // click only on the stage background
        if (clickedOnEmpty) {
            setSelectedId(null);
            if (transformerRef.current) {
                transformerRef.current.nodes([]);
            }
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
                    color: tool === "eraser" ? (darkMode ? "#1a202c" : "#ffffff") : penColor,
                    size: tool === "eraser" ? eraserSize : penSize,
                };
                break;
            case "rectangle":
                newShape = { id, tool, x: pos.x, y: pos.y, width: 0, height: 0, color: penColor, size: penSize };
                break;
            case "circle":
                newShape = { id, tool, x: pos.x, y: pos.y, radius: 0, color: penColor, size: penSize };
                break;
            case "line":
                newShape = { id, tool, points: [pos.x, pos.y, pos.x, pos.y], color: penColor, size: penSize };
                break;
            case "triangle":
                newShape = {
                    id,
                    tool,
                    x: pos.x,         // top point x
                    y: pos.y,         // top point y
                    width: 0,         // will expand as user drags
                    height: 0,        // will expand as user drags
                    color: penColor,
                    size: penSize,
                };
                break;
            case "ellipse":
                newShape = { id, tool, x: pos.x, y: pos.y, radiusX: 0, radiusY: 0, color: penColor, size: penSize };
                break;

            case "polygon": // default hexagon (6 sides)
                newShape = { id, tool, x: pos.x, y: pos.y, sides: 6, radius: 0, color: penColor, size: penSize };
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
                    stroke: penColor
                };
                break;


            case "sphere":
                newShape = { id, tool, x: pos.x, y: pos.y, radius: 0, color: penColor, size: penSize };
                break;

            case "cylinder":
                newShape = { id, tool, x: pos.x, y: pos.y, width: 0, height: 0, color: penColor, size: penSize };
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
                }
                else if (shape.tool === "circle") {
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
                        shape.x, shape.y,                          // top
                        shape.x - shape.width / 2, shape.y + shape.height, // bottom-left
                        shape.x + shape.width / 2, shape.y + shape.height  // bottom-right
                    ];

                    const [x1, y1, x2, y2, x3, y3] = points;

                    // Area method to check if point is inside triangle
                    const areaOrig = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));
                    const area1 = Math.abs((x1 - point.x) * (y2 - point.y) - (x2 - point.x) * (y1 - point.y));
                    const area2 = Math.abs((x2 - point.x) * (y3 - point.y) - (x3 - point.x) * (y2 - point.y));
                    const area3 = Math.abs((x3 - point.x) * (y1 - point.y) - (x1 - point.x) * (y3 - point.y));

                    erase = area1 + area2 + area3 <= areaOrig + 0.1; // small tolerance
                } else if (shape.tool === "ellipse") {
                    const dx = (point.x - shape.x) / shape.radiusX;
                    const dy = (point.y - shape.y) / shape.radiusY;
                    erase = dx * dx + dy * dy <= 1; // inside ellipse formula
                }



                else if (shape.tool === "arrow" || shape.tool === "dashed") {
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
                            xx = x1; yy = y1;
                        } else if (param > 1) {
                            xx = x2; yy = y2;
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

                // Cube erase check
                else if (shape.tool === "cube") {
                    const size = shape.size;
                    const minX = shape.x;
                    const maxX = shape.x + size;
                    const minY = shape.y - size / 2;
                    const maxY = shape.y + size / 2;
                    if (
                        point.x >= minX - eraserSize &&
                        point.x <= maxX + eraserSize &&
                        point.y >= minY - eraserSize &&
                        point.y <= maxY + eraserSize
                    ) {
                        erase = true;
                    }
                }

                // Cylinder erase check
                else if (shape.tool === "cylinder") {
                    const dx = (point.x - (shape.x + shape.width / 2)) / (shape.width / 2);
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
                }

                else if (shape.tool === "cube") {
                    const minX = shape.x;
                    const maxX = shape.x + shape.size;
                    const minY = shape.y;
                    const maxY = shape.y + shape.size;

                    erase =
                        point.x >= minX &&
                        point.x <= maxX &&
                        point.y >= minY &&
                        point.y <= maxY;
                }




                else if (shape.tool === "sphere") {
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
            case "pen":
                // Clamp pen points inside canvas
                const clampedX = Math.max(0, Math.min(point.x, 1100));
                const clampedY = Math.max(0, Math.min(point.y, 600));
                lastShape.points = lastShape.points.concat([clampedX, clampedY]);
                break;

            case "rectangle":
                lastShape.width = point.x - lastShape.x;
                lastShape.height = point.y - lastShape.y;
                break;

            case "circle": {
                // Clamp pointer inside canvas
                const clampedX = Math.max(0, Math.min(point.x, 1100));
                const clampedY = Math.max(0, Math.min(point.y, 600));

                const dx = clampedX - lastShape.x;
                const dy = clampedY - lastShape.y;

                // radius = distance from center to clamped pointer
                let radius = Math.sqrt(dx * dx + dy * dy);

                // Make sure radius does not exceed canvas bounds
                const maxRadiusX = Math.min(lastShape.x, 1100 - lastShape.x);
                const maxRadiusY = Math.min(lastShape.y, 600 - lastShape.y);
                lastShape.radius = Math.min(radius, maxRadiusX, maxRadiusY);
                break;
            }


            case "triangle": {
                // Clamp pointer inside canvas
                const clampedX = Math.max(0, Math.min(point.x, 1100));
                const clampedY = Math.max(0, Math.min(point.y, 600));

                // Width is distance from center (top vertex) to bottom corners
                let width = clampedX - lastShape.x;
                let height = clampedY - lastShape.y;

                // Clamp width so triangle does not cross left/right
                const leftEdge = lastShape.x - width / 2;
                const rightEdge = lastShape.x + width / 2;
                if (leftEdge < 0) width = lastShape.x * 2;
                if (rightEdge > 1100) width = (1100 - lastShape.x) * 2;

                // Clamp height so triangle does not cross bottom/top
                if (lastShape.y + height > 600) height = 600 - lastShape.y;
                if (lastShape.y + height < 0) height = -lastShape.y;

                lastShape.width = width;
                lastShape.height = height;
                break;
            }


            case "line":
                lastShape.points = [
                    Math.max(0, Math.min(lastShape.points[0], 1100)),
                    Math.max(0, Math.min(lastShape.points[1], 600)),
                    Math.max(0, Math.min(point.x, 1100)),
                    Math.max(0, Math.min(point.y, 600)),
                ];
                break;
            case "ellipse": {
                lastShape.radiusX = Math.abs(point.x - lastShape.x);
                lastShape.radiusY = Math.abs(point.y - lastShape.y);
                break;
            }

            case "polygon": {
                const dx = point.x - lastShape.x;
                const dy = point.y - lastShape.y;
                lastShape.radius = Math.sqrt(dx * dx + dy * dy);
                break;
            }
            case "arrow":
            case "dashed":
                lastShape.points = [
                    lastShape.points[0],  // x1
                    lastShape.points[1],  // y1
                    point.x,              // x2
                    point.y               // y2
                ];
                break;



            case "cube": {
                const dx = point.x - lastShape.x;
                const dy = point.y - lastShape.y;
                lastShape.size = Math.max(Math.abs(dx), Math.abs(dy));
                break;
            }


            case "sphere": {
                const dx = point.x - lastShape.x;
                const dy = point.y - lastShape.y;
                lastShape.radius = Math.sqrt(dx * dx + dy * dy);
                break;
            }

            case "cylinder":
                lastShape.width = point.x - lastShape.x;
                lastShape.height = point.y - lastShape.y;
                break;
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
            setSelectedId(lastShape.id);   // ✅ auto-select only shapes
            // setTool("select");             // switch to select mode
        }

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
        const tr = transformerRef.current;
        const stage = stageRef.current;
        if (!tr || !stage) return;

        // Find the shape corresponding to the selectedId
        const selectedShape = shapes.find((s) => s.id === selectedId);

        if (selectedId && tool === "select" && selectedShape && selectedShape.tool !== "pen" && selectedShape.tool !== "eraser") {
            const selectedNode = stage.findOne(`#${selectedId}`);
            if (selectedNode) {
                tr.nodes([selectedNode]);
                tr.getLayer()?.batchDraw();
            } else {
                tr.nodes([]);
            }
        } else {
            tr.nodes([]);
            tr.getLayer()?.batchDraw();
        }
    }, [selectedId, tool, shapes]); // include shapes in dependency since we use it

    useEffect(() => {
        if (tool !== "select") setSelectedId(null);
    }, [tool]);

    const cursorStyles = {
        pen: "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 height=%2224%22 width=%2224%22><path d=%22M3 21v-3l14-14 3 3-14 14H3z%22 fill=%22black%22/></svg>') 0 24, auto",
        eraser: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}"><rect x="0" y="0" width="${eraserSize}" height="${eraserSize}" fill="white" stroke="black" stroke-width="2"/></svg>') ${eraserSize / 2} ${eraserSize / 2}, auto`,
        rectangle: "crosshair",
        line: "crosshair",
        circle: "crosshair",
        select: "default",
    };

    return (
        <div className="flex justify-center items-center min-h-screen">
                   <div className="whiteboard-container">
                     <div className="canvas-wrapper flex-1 h-full rounded-xl overflow-hidden" style={{ cursor: cursorStyles[tool] || "default" }}>
                        <Stage
                            width={1100}
                            height={600}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onClick={checkDeselect}
                            ref={stageRef}
                            style={{ backgroundColor: "var(--canvas-bg)" }}
                        >
                            <Layer>
                                {backgroundImage && <BackgroundImage imageUrl={backgroundImage} />}
                                {!backgroundImage && (
                                    <Rect x={0} y={0} width={1100} height={600} fill={darkMode ? "#1a202c" : "#ffffff"} listening={false} />
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
                                                    tension={0.5}
                                                    lineCap="round"
                                                    onClick={() => tool === "select" && setSelectedId(shape.id)}
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
                                                    onClick={() => tool === "select" && setSelectedId(shape.id)}
                                                    draggable={tool === "select"}
                                                    onDragEnd={(e) => {
                                                        const newShapes = shapes.slice();
                                                        newShapes[i] = { ...newShapes[i], x: e.target.x(), y: e.target.y() };
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
                                                    onClick={() => tool === "select" && setSelectedId(shape.id)}
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
                                                    points={[
                                                        shape.x, shape.y, // top point (mouse down start)
                                                        shape.x - shape.width / 2, shape.y + shape.height, // bottom left
                                                        shape.x + shape.width / 2, shape.y + shape.height, // bottom right
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
                                                        newShapes[i] = {
                                                            ...newShapes[i],
                                                            x: node.x(),
                                                            y: node.y(),
                                                            width: node.width() * node.scaleX(),
                                                            height: node.height() * node.scaleY(),
                                                            rotation: node.rotation(),
                                                        };
                                                        setShapes(newShapes);
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
                                                    draggable={tool === "select"}
                                                    onClick={() => tool === "select" && setSelectedId(shape.id)}
                                                    onTransformEnd={(e) => {
                                                        const node = e.target;
                                                        const newShapes = shapes.slice();
                                                        const scaleX = node.scaleX();
                                                        newShapes[i] = {
                                                            ...newShapes[i],
                                                            x: node.x(),
                                                            y: node.y(),
                                                            radius: node.radius() * scaleX,
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
                                                    fill={shape.color}         // arrowhead color
                                                    pointerLength={12}
                                                    pointerWidth={12}
                                                    lineCap="round"
                                                    lineJoin="round"
                                                    hitStrokeWidth={20}        // 👈 makes it selectable
                                                    draggable={tool === "select"}
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
                                                    dash={[10, 5]}             // dashed effect
                                                    lineCap="round"
                                                    lineJoin="round"
                                                    hitStrokeWidth={20}        // 👈 easier to select
                                                    draggable={tool === "select"}
                                                />
                                            );



                                        case "cube": {
                                            const size = shape.size;
                                            const offset = size / 2; // depth offset for 3D effect

                                            // Front face
                                            const frontPoints = [
                                                shape.x, shape.y,
                                                shape.x + size, shape.y,
                                                shape.x + size, shape.y + size,
                                                shape.x, shape.y + size
                                            ];

                                            // Back face (shifted by offset)
                                            const backPoints = [
                                                shape.x + offset, shape.y - offset,
                                                shape.x + size + offset, shape.y - offset,
                                                shape.x + size + offset, shape.y + size - offset,
                                                shape.x + offset, shape.y + size - offset
                                            ];

                                            return (
                                                <Group key={i} draggable={tool === "select"}>
                                                    {/* Front face */}
                                                    <Line
                                                        id={shape.id}
                                                        points={frontPoints}
                                                        stroke={shape.color}
                                                        closed
                                                    />

                                                    {/* Back face */}
                                                    <Line
                                                        points={backPoints}
                                                        stroke={shape.color}
                                                        closed
                                                    />

                                                    {/* Connectors */}
                                                    <Line
                                                        points={[frontPoints[0], frontPoints[1], backPoints[0], backPoints[1]]}
                                                        stroke={shape.color}
                                                    />
                                                    <Line
                                                        points={[frontPoints[2], frontPoints[3], backPoints[2], backPoints[3]]}
                                                        stroke={shape.color}
                                                    />
                                                    <Line
                                                        points={[frontPoints[4], frontPoints[5], backPoints[4], backPoints[5]]}
                                                        stroke={shape.color}
                                                    />
                                                    <Line
                                                        points={[frontPoints[6], frontPoints[7], backPoints[6], backPoints[7]]}
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
                                                    fillLinearGradientStartPoint={{ x: -shape.radius, y: -shape.radius }}
                                                    fillLinearGradientEndPoint={{ x: shape.radius, y: shape.radius }}
                                                    fillLinearGradientColorStops={[0, "white", 1, shape.color]}
                                                    draggable={tool === "select"}
                                                />
                                            );

                                        case "cylinder":
                                            return (
                                                <Group key={i} draggable={tool === "select"}>
                                                    <Rect
                                                        x={shape.x}
                                                        y={shape.y}
                                                        width={shape.width}
                                                        height={shape.height}
                                                        stroke={shape.color}
                                                        strokeWidth={shape.size}
                                                    />
                                                    <Ellipse
                                                        x={shape.x + shape.width / 2}
                                                        y={shape.y}
                                                        radiusX={Math.abs(shape.width / 2)}
                                                        radiusY={10}
                                                        stroke={shape.color}
                                                        strokeWidth={shape.size}
                                                    />
                                                    <Ellipse
                                                        x={shape.x + shape.width / 2}
                                                        y={shape.y + shape.height}
                                                        radiusX={Math.abs(shape.width / 2)}
                                                        radiusY={10}
                                                        stroke={shape.color}
                                                        strokeWidth={shape.size}
                                                    />
                                                </Group>
                                            );

                                        case "image":
                                            return (
                                                <ImageShape
                                                    key={shape.id}
                                                    shape={shape}
                                                    tool={tool}
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
                                        "top-left", "top-right", "bottom-left", "bottom-right",
                                        "middle-left", "middle-right", "top-center", "bottom-center"
                                    ]}
                                />

                            </Layer>
                        </Stage>
                    </div>

                    <div className="toolbar h-full w-18 items-center p-2 rounded-xl">
                        <button onClick={toggleDarkMode} className="p-2 rounded-full">{darkMode ? "☀️" : "🌙"}</button>

                        <button onClick={() => setTool("pen")} className={`p-2 rounded-full ${tool === "pen" ? "bg-blue-100 text-blue-600" : ""}`}>
                            <FaPen size={20} />
                        </button>
                        <button onClick={() => setTool("eraser")} className={`p-2 rounded-full ${tool === "eraser" ? "bg-blue-100 text-blue-600" : ""}`}>
                            <FaEraser size={20} />
                        </button>
                        <button onClick={() => setTool("select")} className={`p-2 rounded-full ${tool === "select" ? "bg-blue-100 text-blue-600" : ""}`}>
                            <FaMousePointer size={20} />
                        </button>

                        <div className="relative flex flex-col items-center">
                            <button
                                onClick={() => setShowShapes(!showShapes)}
                                className={`p-2 rounded-full ${["rectangle", "line", "circle", "triangle", "ellipse", "polygon", "dashed", "arrow", "cube", "sphere", "cylinder"].includes(tool) ? "bg-blue-100 text-blue-600" : ""}`}
                            >
                                <FaShapes size={20} />
                            </button>

                            {showShapes && (
                                <div className="absolute -left-56 top-1/2 -translate-y-1/2 border rounded-2xl shadow-xl p-3 z-20 w-52" style={{ backgroundColor: "var(--toolbar-bg)" }}>
                                    {/* 2D Shapes Section */}
                                    <p className="text-xs font-semibold mb-2 ">2D Shapes</p>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <button onClick={() => { setTool("rectangle"); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center">
                                            <FaSquare />
                                        </button>
                                        <button onClick={() => { setTool("circle"); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center">
                                            <FaCircle />
                                        </button>
                                        <button onClick={() => { setTool("triangle"); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center">
                                            ▲
                                        </button>
                                        <button onClick={() => { setTool("ellipse"); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center">
                                            ⬭
                                        </button>
                                        <button onClick={() => { setTool("polygon"); setShowShapes(false); }} className="p-2 border rounded hover:bg-blue-500 flex justify-center items-center">
                                            ⬠
                                        </button>
                                    </div>

                                    {/* Lines Section */}
                                    <p className="text-xs font-semibold mb-2">Lines</p>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <button onClick={() => { setTool("line"); setShowShapes(false); }} className="p-2 border rounded hover:bg-green-500 flex justify-center items-center">
                                            <FaSlash />
                                        </button>
                                        <button onClick={() => { setTool("arrow"); setShowShapes(false); }} className="p-2 border rounded hover:bg-green-500 text-xs">
                                            Arrow
                                        </button>
                                        <button onClick={() => { setTool("dashed"); setShowShapes(false); }} className="p-2 border rounded hover:bg-green-500 text-xs">
                                            Dashed
                                        </button>
                                    </div>

                                    {/* 3D Shapes Section */}
                                    <p className="text-xs font-semibold mb-2">3D Shapes (Future)</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => { setTool("cube"); setShowShapes(false); }} className="p-2 border rounded hover:bg-red-500 flex justify-center items-center">
                                            <HiOutlineCube size={20} />
                                        </button>
                                        <button onClick={() => { setTool("sphere"); setShowShapes(false); }} className="p-2 border rounded hover:bg-red-500 flex justify-center items-center">
                                            <HiOutlineGlobe size={20} />
                                        </button>
                                        <button onClick={() => { setTool("cylinder"); setShowShapes(false); }} className="p-2 border rounded hover:bg-red-500 flex justify-center items-center">
                                            <HiOutlineDesktopComputer size={20} />
                                        </button>
                                    </div>

                                    {/* --- Pen Size Selector --- */}
                                    {tool === "pen" && (
                                        <div className="flex flex-col items-center mt-2  p-2 rounded-lg shadow-md">
                                            <label className="text-xs mb-1 ">Pen Size</label>
                                            <input type="range" min="1" max="20" value={penSize} onChange={(e) => setPenSize(Number(e.target.value))} className="w-full" />
                                            <span className="text-xs mt-1">{penSize}px</span>
                                        </div>
                                    )}

                                    {/* --- Eraser Size Selector --- */}
                                    {tool === "eraser" && (
                                        <div className="flex flex-col items-center mt-2 p-2 rounded-lg shadow-md">
                                            <label className="text-xs mb-1 ">Eraser Size</label>
                                            <input type="range" min="5" max="50" value={eraserSize} onChange={(e) => setEraserSize(Number(e.target.value))} className="w-full" />
                                            <span className="text-xs mt-1 ">{eraserSize}px</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="relative mt-2">
                            <button onClick={() => setShowColors(!showColors)} className="w-6 h-6 rounded-full border" style={{ backgroundColor: penColor }} />
                            {showColors && (
                                <div className="absolute left-1/2 mt-1 -translate-x-1/2 border rounded shadow-md p-2 w-max" style={{ backgroundColor: "var(--toolbar-bg)" }}>
                                    <div className="grid grid-cols-3 gap-2">
                                        {colors.map((color) => (
                                            <button
                                                key={color}
                                                onClick={() => {
                                                    setPenColor(color);
                                                    setShowColors(false);
                                                }}
                                                className={`w-6 h-6 rounded-full border-2 ${penColor === color ? "border-black" : "border-transparent"}`}
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
                                    const id = Date.now().toString();
                                    setShapes((prev) => [
                                        ...prev,
                                        { id, tool: "image", src: reader.result, x: 100, y: 100, width: 200, height: 200 },
                                    ]);
                                    setSelectedId(id);
                                    setTool("select");
                                };
                                reader.readAsDataURL(file);
                                e.target.value = "";
                            }}
                        />

                        <label htmlFor="import-image" className="p-2 rounded-full cursor-pointer">
                            <FaFileImport size={20} />
                        </label>
                    </div>
                   </div>
        </div>
    );
}
