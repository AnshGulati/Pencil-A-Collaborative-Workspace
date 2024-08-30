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

// Function to convert mouse coordinates to WebGL coordinates
function getMousePosition(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
  const y = ((event.clientY - rect.top) / canvas.height) * -2 + 1;
  return [x, y];
}

// Mouse event handlers
canvas.addEventListener("mousedown", (e) => {
  if (!isPencilActive) return; // Do nothing if pencil tool is not active

  if (e.button === 2) {
    clearCanvas();
    return;
  }

  isDrawing = true;
  const [x, y] = getMousePosition(canvas, e);
  lastX = x;
  lastY = y;

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
  const currentStroke = strokes[strokes.length - 1];

  // Add the current point to the stroke
  currentStroke.points.push([x, y]);

  lastX = x;
  lastY = y;

  draw();
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
  // Reset cursor to crosshair if pencil tool is active, otherwise default
  canvas.style.cursor = isPencilActive ? 'crosshair' : 'default';
});

canvas.addEventListener("mouseout", () => {
  isDrawing = false;
  // Reset cursor to crosshair if pencil tool is active, otherwise default
  canvas.style.cursor = isPencilActive ? 'crosshair' : 'default';
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

// Clear the canvas
function clearCanvas() {
  // Set the clear color to off-white
  gl.clearColor(245 / 255, 245 / 255, 245 / 255, 1); // Off-white background
  gl.clear(gl.COLOR_BUFFER_BIT);
  strokes.length = 0; // Clear all stored strokes
}

clearCanvas();

// Prevent context menu on right-click
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
  let r = 0, g = 0, b = 0;
  // 3 digits
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  }
  // 6 digits
  else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  return [r, g, b];
}

// Pencil tool click event handler
document.getElementById("pencilTool").addEventListener("click", () => {
  // Toggle pencil tool state
  isPencilActive = !isPencilActive;

  // Update pencil tool icon state
  const pencilToolIcon = document.getElementById("pencilTool");
  if (isPencilActive) {
    pencilToolIcon.classList.add("active");
    canvas.style.cursor = 'crosshair'; // Set cursor to crosshair when tool is active
  } else {
    pencilToolIcon.classList.remove("active");
    canvas.style.cursor = 'default'; // Set cursor to default when tool is not active
  }
});
