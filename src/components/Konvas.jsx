import React, { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Image, Circle, Ellipse, Transformer } from 'react-konva';
import useImage from 'use-image';
import {
    FaPen, FaEraser, FaUndo, FaRedo, FaTrash, FaDownload, FaFileImport,
    FaShapes, FaSquare, FaCircle, FaSlash
} from 'react-icons/fa';

// Background Image Component
const BackgroundImage = ({ imageUrl }) => {
    const [image] = useImage(imageUrl);
    return <Image image={image} x={0} y={0} width={1100} height={600} />;
};

// Utility: Scale triangle points
const scaleTriangle = (triangle, scaleX, scaleY) => {
    const centerX = (triangle.points[0] + triangle.points[2] + triangle.points[4]) / 3;
    const centerY = (triangle.points[1] + triangle.points[3] + triangle.points[5]) / 3;
    const newPoints = triangle.points.map((p, idx) =>
        idx % 2 === 0 ? centerX + (p - centerX) * scaleX : centerY + (p - centerY) * scaleY
    );
    return { ...triangle, points: newPoints };
};

// Utility: Scale polygon points
const scalePolygon = (polygon, scaleX, scaleY) => {
    const centerX = polygon.points.filter((_, i) => i % 2 === 0).reduce((a,b)=>a+b,0)/ (polygon.points.length/2);
    const centerY = polygon.points.filter((_, i) => i % 2 !== 0).reduce((a,b)=>a+b,0)/ (polygon.points.length/2);
    const newPoints = polygon.points.map((p, idx) =>
        idx % 2 === 0 ? centerX + (p - centerX) * scaleX : centerY + (p - centerY) * scaleY
    );
    return { ...polygon, points: newPoints };
};

const Konvas = () => {
    const stageRef = useRef(null);
    const isDrawing = useRef(false);
    const shapeRefs = useRef({});

    const [tool, setTool] = useState('pen'); 
    const [shapes, setShapes] = useState([]);
    const [selectedShapeId, setSelectedShapeId] = useState(null);
    const [penColor, setPenColor] = useState('#000000');
    const [penSize, setPenSize] = useState(2);
    const [eraserSize, setEraserSize] = useState(20);
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    const [showColors, setShowColors] = useState(false);
    const [showShapes, setShowShapes] = useState(false);
    const [lineStyle, setLineStyle] = useState('solid');

    const colors = ["#000000", "#FF0000", "#008000", "#0000FF", "#f3f4f6", "#FFCDD2", "#FFF59D", "#BBDEFB"];

    // Undo/Redo history
    const [history, setHistory] = useState([[]]);
    const [historyStep, setHistoryStep] = useState(0);

    // --- Drawing logic ---
    const handleMouseDown = (e) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        let newShape = {};

        switch (tool) {
            case 'pen':
            case 'eraser':
                newShape = { tool, points: [pos.x, pos.y], color: tool==='eraser'? (darkMode?'#1a202c':'#ffffff') : penColor, size: tool==='eraser'? eraserSize : penSize };
                break;
            case 'rectangle':
                newShape = { tool, x: pos.x, y: pos.y, width:0, height:0, color: penColor, size: penSize };
                break;
            case 'circle':
                newShape = { tool, x: pos.x, y: pos.y, radius:0, color: penColor, size: penSize };
                break;
            case 'triangle':
                newShape = { tool, points: [pos.x, pos.y, pos.x, pos.y, pos.x, pos.y], color: penColor, size: penSize };
                break;
            case 'ellipse':
                newShape = { tool, x: pos.x, y: pos.y, radiusX:0, radiusY:0, color: penColor, size: penSize };
                break;
            case 'polygon':
                newShape = { tool, points: [pos.x,pos.y,pos.x,pos.y,pos.x,pos.y,pos.x,pos.y], color: penColor, size: penSize };
                break;
            case 'line':
                newShape = { tool, points: [pos.x,pos.y,pos.x,pos.y], color: penColor, size: penSize, lineStyle };
                break;
            default: return;
        }
        setShapes([...shapes, newShape]);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) return;
        const pos = e.target.getStage().getPointerPosition();
        let lastShape = shapes[shapes.length-1];
        if(!lastShape) return;

        if(tool==='eraser'){
            const erasedShapes = shapes.filter(shape=>{
                if(shape.tool==='rectangle'){
                    return !(pos.x>=shape.x && pos.x<=shape.x+shape.width && pos.y>=shape.y && pos.y<=shape.y+shape.height);
                } else if(shape.tool==='circle'){
                    const dx = pos.x-shape.x; const dy = pos.y-shape.y;
                    return Math.sqrt(dx*dx+dy*dy)>shape.radius;
                } else if(shape.tool==='line' || shape.tool==='pen'){
                    return !shape.points.some((p,idx)=>idx%2===0?Math.hypot(pos.x-p,pos.y-shape.points[idx+1])<eraserSize:false);
                }
                return true;
            });
            setShapes(erasedShapes);
            return;
        }

        switch(lastShape.tool){
            case 'pen': case 'eraser': lastShape.points = lastShape.points.concat([pos.x,pos.y]); break;
            case 'rectangle': lastShape.width = pos.x-lastShape.x; lastShape.height = pos.y-lastShape.y; break;
            case 'circle': lastShape.radius = Math.sqrt(Math.pow(pos.x-lastShape.x,2)+Math.pow(pos.y-lastShape.y,2)); break;
            case 'triangle': lastShape.points[2]=pos.x; lastShape.points[3]=pos.y; lastShape.points[4]=lastShape.points[0]; lastShape.points[5]=lastShape.points[1]-(pos.y-lastShape.points[1]); break;
            case 'ellipse': lastShape.radiusX = Math.abs(pos.x-lastShape.x); lastShape.radiusY = Math.abs(pos.y-lastShape.y); break;
            case 'polygon': lastShape.points[lastShape.points.length-2]=pos.x; lastShape.points[lastShape.points.length-1]=pos.y; break;
            case 'line': lastShape.points[2]=pos.x; lastShape.points[3]=pos.y; break;
            default: break;
        }

        shapes.splice(shapes.length-1,1,lastShape);
        setShapes([...shapes]);
    };

    const handleMouseUp = () => {
        if(!isDrawing.current) return;
        isDrawing.current=false;
        const newHistory = history.slice(0,historyStep+1);
        setHistory([...newHistory, shapes]);
        setHistoryStep(historyStep+1);
    };

    const handleUndo = () => { if(historyStep>0){ const newStep=historyStep-1; setHistoryStep(newStep); setShapes(history[newStep]); } };
    const handleRedo = () => { if(historyStep<history.length-1){ const newStep=historyStep+1; setHistoryStep(newStep); setShapes(history[newStep]); } };
    const handleClear = () => { setShapes([]); setBackgroundImage(null); setHistory([[]]); setHistoryStep(0); };
    const handleExport = () => { const uri = stageRef.current.toDataURL(); const link = document.createElement('a'); link.download='whiteboard.png'; link.href=uri; link.click(); };
    const toggleDarkMode = () => { setDarkMode(!darkMode); document.body.classList.toggle('dark'); };

    // Update eraser color on dark mode change
    useEffect(()=>{ setShapes(shapes.map(shape=>shape.tool==='eraser'?{...shape,color:darkMode?'#1a202c':'#ffffff'}:shape)); },[darkMode]);

    // Cursor styles
    const cursorStyles = { pen:'crosshair', eraser:'crosshair', rectangle:'crosshair', circle:'crosshair', triangle:'crosshair', ellipse:'crosshair', polygon:'crosshair', line:'crosshair' };

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="flex rounded-xl shadow-lg p-4 relative w-[1100px] h-[600px]">
                <div className="flex w-full h-full gap-2">
                    <div className="flex-1 h-full rounded-xl overflow-hidden" style={{cursor:cursorStyles[tool]}}>
                        <Stage width={1100} height={600} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} ref={stageRef}>
                            <Layer>
                                {backgroundImage && <BackgroundImage imageUrl={backgroundImage} />}
                                {!backgroundImage && <Rect x={0} y={0} width={1100} height={600} fill={darkMode?'#1a202c':'#ffffff'} />}

                                {shapes.map((shape,i)=>{
                                    const commonProps={key:i, stroke:shape.color, strokeWidth:shape.size, draggable:!['pen','eraser'].includes(shape.tool), onClick:()=>setSelectedShapeId(i), ref:node=>shapeRefs.current[i]=node};
                                    switch(shape.tool){
                                        case 'pen': return <Line {...commonProps} points={shape.points} tension={0.5} lineCap="round" />;
                                        case 'eraser': return <Line {...commonProps} points={shape.points} tension={0.5} lineCap="round" globalCompositeOperation="destination-out" />;
                                        case 'rectangle': return <Rect {...commonProps} x={shape.x} y={shape.y} width={shape.width} height={shape.height}/>;
                                        case 'circle': return <Circle {...commonProps} x={shape.x} y={shape.y} radius={shape.radius}/>;
                                        case 'triangle': return <Line {...commonProps} points={shape.points} closed />;
                                        case 'ellipse': return <Ellipse {...commonProps} x={shape.x} y={shape.y} radiusX={shape.radiusX} radiusY={shape.radiusY}/>;
                                        case 'polygon': return <Line {...commonProps} points={shape.points} closed />;
                                        case 'line': return <Line {...commonProps} points={shape.points} dash={shape.lineStyle==='dashed'?[10,5]:[]} />;
                                        default: return null;
                                    }
                                })}

                                {selectedShapeId!==null && shapeRefs.current[selectedShapeId] && !['pen','eraser'].includes(shapes[selectedShapeId].tool) && (
                                    <Transformer
                                        node={shapeRefs.current[selectedShapeId]}
                                        onTransformEnd={e=>{
                                            const node = e.target;
                                            const shape = shapes[selectedShapeId];
                                            let updatedShape={...shape};
                                            const scaleX=node.scaleX(); const scaleY=node.scaleY();
                                            switch(shape.tool){
                                                case 'rectangle': updatedShape.width*=scaleX; updatedShape.height*=scaleY; break;
                                                case 'circle': updatedShape.radius*=Math.max(scaleX,scaleY); break;
                                                case 'ellipse': updatedShape.radiusX*=scaleX; updatedShape.radiusY*=scaleY; break;
                                                case 'triangle': updatedShape=scaleTriangle(shape,scaleX,scaleY); break;
                                                case 'polygon': updatedShape=scalePolygon(shape,scaleX,scaleY); break;
                                                case 'line': updatedShape.points=shape.points.map((p,idx)=>idx%2===0?p*scaleX:p*scaleY); break;
                                            }
                                            node.scaleX(1); node.scaleY(1);
                                            const newShapes=shapes.slice();
                                            newShapes[selectedShapeId]=updatedShape;
                                            setShapes(newShapes);
                                        }}
                                    />
                                )}
                            </Layer>
                        </Stage>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col gap-2 h-full w-24 items-center p-2 rounded-xl">
                        <button onClick={toggleDarkMode} className="p-2 rounded-full">{darkMode?'☀️':'🌙'}</button>

                        <div className="relative">
                            <button onClick={()=>setTool('pen')} className={`p-2 rounded-full ${tool==='pen'?'bg-blue-100':''}`}><FaPen size={20}/></button>
                        </div>
                        <div className="relative">
                            <button onClick={()=>setTool('eraser')} className={`p-2 rounded-full ${tool==='eraser'?'bg-blue-100':''}`}><FaEraser size={20}/></button>
                        </div>

                        {/* Shapes Menu */}
                        <div className="relative flex flex-col items-center">
                            <button onClick={()=>setShowShapes(!showShapes)} className={`p-2 rounded-full ${['rectangle','circle','triangle','ellipse','polygon','line'].includes(tool)?'bg-blue-100':''}`}><FaShapes size={20}/></button>
                            {showShapes && (
                                <div className="absolute -left-56 top-1/2 -translate-y-1/2 border rounded-2xl shadow-xl p-3 bg-white dark:bg-gray-800 z-20 w-52">
                                    <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-200">2D Shapes</p>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <button onClick={()=>{setTool('rectangle'); setShowShapes(false)}} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center"><FaSquare/></button>
                                        <button onClick={()=>{setTool('circle'); setShowShapes(false)}} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center"><FaCircle/></button>
                                        <button onClick={()=>{setTool('triangle'); setShowShapes(false)}} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center">▲</button>
                                        <button onClick={()=>{setTool('ellipse'); setShowShapes(false)}} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center">⬭</button>
                                        <button onClick={()=>{setTool('polygon'); setShowShapes(false)}} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center">⬠</button>
                                    </div>
                                    <p className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-200">Lines</p>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <button onClick={()=>{setTool('line'); setShowShapes(false)}} className="p-2 border rounded hover:bg-blue-100 flex justify-center items-center"><FaSlash/></button>
                                        <button onClick={()=>{setLineStyle('solid'); setShowShapes(false)}} className="p-2 border rounded hover:bg-blue-100 text-xs">Solid</button>
                                        <button onClick={()=>{setLineStyle('dashed'); setShowShapes(false)}} className="p-2 border rounded hover:bg-blue-100 text-xs">Dashed</button>
                                    </div>
                                    {/* Pen/Eraser size selectors */}
                                    {tool==='pen' && (
                                        <div className="flex flex-col items-center mt-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md">
                                            <label className="text-xs mb-1 text-gray-700 dark:text-gray-200">Pen Size</label>
                                            <input type="range" min="1" max="20" value={penSize} onChange={(e)=>setPenSize(Number(e.target.value))} className="w-full"/>
                                            <span className="text-xs mt-1">{penSize}px</span>
                                        </div>
                                    )}
                                    {tool==='eraser' && (
                                        <div className="flex flex-col items-center mt-2 p-2 rounded-lg shadow-md">
                                            <label className="text-xs mb-1">Eraser Size</label>
                                            <input type="range" min="5" max="50" value={eraserSize} onChange={(e)=>setEraserSize(Number(e.target.value))} className="w-full"/>
                                            <span className="text-xs mt-1">{eraserSize}px</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Colors */}
                        <div className="relative mt-2">
                            <button onClick={()=>setShowColors(!showColors)} className="w-6 h-6 rounded-full border" style={{backgroundColor:penColor}}/>
                            {showColors && (
                                <div className="absolute left-1/2 mt-1 -translate-x-1/2 border rounded shadow-md p-2 w-max bg-white dark:bg-gray-800">
                                    <div className="grid grid-cols-3 gap-2">
                                        {colors.map(color=>(
                                            <button key={color} onClick={()=>{setPenColor(color); setShowColors(false)}} className={`w-6 h-6 rounded-full border-2 ${penColor===color?'border-black':'border-transparent'}`} style={{backgroundColor:color}}/>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={handleUndo} className="p-2 rounded-full"><FaUndo size={20}/></button>
                        <button onClick={handleRedo} className="p-2 rounded-full"><FaRedo size={20}/></button>
                        <button onClick={handleClear} className="p-2 rounded-full"><FaTrash size={20}/></button>
                        <button onClick={handleExport} className="p-2 rounded-full"><FaDownload size={20}/></button>
                        <input type="file" accept="image/*" id="import-image" className="hidden" onChange={(e)=>{const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>setBackgroundImage(reader.result); reader.readAsDataURL(file);}}/>
                        <label htmlFor="import-image" className="p-2 rounded-full cursor-pointer"><FaFileImport size={20}/></label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Konvas;
