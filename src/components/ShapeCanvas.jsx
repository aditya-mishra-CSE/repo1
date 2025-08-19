// ShapeCanvas.js
import React, { useState } from "react";
import { Stage, Layer, Rect, Circle, Line } from "react-konva";

const ShapeCanvas = ({ selectedShape, penColor, penSize }) => {
  const [shapes, setShapes] = useState([]);

  const handleCanvasClick = (e) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();

    const newShape = {
      id: shapes.length + 1,
      type: selectedShape,
      x: pointer.x,
      y: pointer.y,
      draggable: true,
      color: penColor,
      size: penSize
    };

    setShapes([...shapes, newShape]);
  };

  return (
    <Stage width={800} height={600} onClick={handleCanvasClick}>
      <Layer>
        {shapes.map((shape) => {
          switch (shape.type) {
            case "rectangle":
              return (
                <Rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.size * 10}
                  height={shape.size * 6}
                  fill={shape.color}
                  draggable
                />
              );
            case "circle":
              return (
                <Circle
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.size * 4}
                  fill={shape.color}
                  draggable
                />
              );
            case "line":
              return (
                <Line
                  key={shape.id}
                  points={[shape.x, shape.y, shape.x + 100, shape.y + 100]}
                  stroke={shape.color}
                  strokeWidth={shape.size}
                  draggable
                />
              );
            default:
              return null;
          }
        })}
      </Layer>
    </Stage>
  );
};

export default ShapeCanvas;
