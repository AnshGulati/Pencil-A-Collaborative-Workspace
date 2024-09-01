// Initialize WebGL context
const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  alert("Your browser does not support WebGL");
}

// Set the canvas size to cover the whole window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

// Adjust the canvas size when the window is resized
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  draw(); // Redraw after resizing
});

// Vertex shader for Strokes Position
const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;

// Fragment shader for Strokes Color
const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    void main() {
        gl_FragColor = u_color;
    }
`;

// Compiling shader
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Error compiling shader", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// Create program
function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Error linking program", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

// Look up locations
const positionLocation = gl.getAttribLocation(program, "a_position");
const colorLocation = gl.getUniformLocation(program, "u_color");

// Set up buffer
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Enable the position attribute
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Variables which store the state of Drawing
let isDrawing = false;
let lastX = 0, lastY = 0;
const strokes = [];
let isPencilActive = false; // Flag to check if pencil tool is active
let isEraserActive = false; // Flag to check if eraser tool is active
const ERASER_RADIUS = 0.05; // Adjust the size of the eraser

// Function to convert mouse coordinates to WebGL coordinates
function getMousePosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
  const y = ((event.clientY - rect.top) / canvas.height) * -2 + 1;
  return [x, y];
}

// Mouse event handlers
canvas.addEventListener("mousedown", (e) => {
  if (!isPencilActive && !isEraserActive) return; // Do nothing if no tool is active

  const [x, y] = getMousePosition(canvas, e);
  lastX = x;
  lastY = y;

  if (isEraserActive) {
    eraseStroke(x, y);
    draw();
    return;
  }

  if (e.button === 2) {
    clearCanvas();
    return;
  }

  isDrawing = true;

  // Get the current brush color from the color picker
  const brushColor = document.getElementById("brushColor").value;
  const [r, g, b] = hexToRgb(brushColor);

  // Start a new stroke with the current brush color
  strokes.push({
    points: [[x, y]],
    color: [r / 255, g / 255, b / 255, 1], // Convert to normalized color values
  });

  // Set cursor to crosshair while drawing
  canvas.style.cursor = 'crosshair';
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;

  const [x, y] = getMousePosition(canvas, e);

  if (isEraserActive) {
    eraseStroke(x, y);
    draw();
    return;
  }

  const currentStroke = strokes[strokes.length - 1];

  // Add the current point to the stroke
  currentStroke.points.push([x, y]);

  lastX = x;
  lastY = y;

  draw();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  // Reset cursor based on active tool
  if (isPencilActive) {
    canvas.style.cursor = 'crosshair';
  } else if (isEraserActive) {
    canvas.style.cursor = 'not-allowed'; // Eraser cursor
  } else {
    canvas.style.cursor = 'default';
  }
});

canvas.addEventListener("mouseout", () => {
  isDrawing = false;
  // Reset cursor based on active tool
  if (isPencilActive) {
    canvas.style.cursor = 'crosshair';
  } else if (isEraserActive) {
    canvas.style.cursor = 'not-allowed'; // Eraser cursor
  } else {
    canvas.style.cursor = 'default';
  }
});

// Draw function
function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  strokes.forEach((stroke) => {
    const points = stroke.points.flat();
    const color = stroke.color;

    gl.uniform4f(colorLocation, ...color); // Set the color for the stroke
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
  });
}

// Erase function
function eraseStroke(x, y) {
  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];
    for (let j = 0; j < stroke.points.length; j++) {
      const [px, py] = stroke.points[j];
      const dx = x - px;
      const dy = y - py;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < ERASER_RADIUS) {
        strokes.splice(i, 1); // Remove the stroke
        return;
      }
    }
  }
}


// Utility function to convert hex color to RGB
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

// Initial draw
gl.clearColor(1, 1, 1, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

function clearCanvas() {
  strokes.length = 0; // Clear all stored strokes
  gl.clear(gl.COLOR_BUFFER_BIT); // Clear the WebGL canvas
}

// const customCursor = document.createElement("img");
// customCursor.src = "eraser.png"; // Path to your custom cursor image

// Tool selectors
const pencilTool = document.getElementById("pencilTool");
const eraserTool = document.getElementById("eraserTool");
const brushColorPicker = document.getElementById("brushColor");
const clearTool = document.getElementById("clearTool"); 

function updateToolIconBackground(toolElement, color) {
  toolElement.style.backgroundColor = color;
}

pencilTool.addEventListener("click", () => {
  if (isPencilActive) {
    isPencilActive = false;
    pencilTool.classList.remove("active");
    pencilTool.style.backgroundColor = ""; // Reset background color
    canvas.style.cursor = "default";
  } else {
    isPencilActive = true;
    isEraserActive = false;
    pencilTool.classList.add("active");
    eraserTool.classList.remove("active");
    updateToolIconBackground(pencilTool, brushColorPicker.value); // Set active color
    eraserTool.style.backgroundColor = ""; // Reset eraser background color
    canvas.style.cursor = "crosshair";
  }
});

eraserTool.addEventListener("click", () => {
  if (isEraserActive) {
    isEraserActive = false;
    eraserTool.classList.remove("active");
    eraserTool.style.backgroundColor = ""; // Reset background color
    canvas.style.cursor = "default";
  } else {
    isEraserActive = true;
    isPencilActive = false;
    eraserTool.classList.add("active");
    pencilTool.classList.remove("active");
    pencilTool.style.backgroundColor = ""; // Reset pencil background color
    canvas.style.cursor = "not-allowed";
    
  }
});

// Listen to color picker changes to update the pencil tool background color
brushColorPicker.addEventListener("input", () => {
  if (isPencilActive) {
    updateToolIconBackground(pencilTool, brushColorPicker.value); // Update pencil icon color
  }
});

// Add event listener for the "All Clear" image to clear the canvas
clearTool.addEventListener("mousedown", () => {
  // Add 'active' class to simulate a button press
  clearTool.classList.add("active");
  
  // Clear the canvas
  clearCanvas();
});

clearTool.addEventListener("mouseup", () => {
  // Remove 'active' class when mouse button is released
  clearTool.classList.remove("active");
});

// Optional: Also handle mouseleave to ensure the button is deactivated
// if the user releases the mouse button outside of the image
clearTool.addEventListener("mouseleave", () => {
  clearTool.classList.remove("active");
});

