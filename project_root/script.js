const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
  console.log('Connected to the WebSocket server');
};

socket.onmessage = (event) => {
  console.log('Received message from server:', event.data);
  const data = JSON.parse(event.data);
  handleRemoteDrawing(data);
};

socket.onerror = (error) => {
  console.error('WebSocket Error:', error);
};

socket.onclose = (event) => {
  console.log('WebSocket connection closed:', event);
  if (event.code !== 1000) {
    console.error('WebSocket closed unexpectedly. Code:', event.code, 'Reason:', event.reason);
  }
};

document.getElementById("clearTool").addEventListener("click", clearCanvas);


// Initialize WebGL context
const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl");
let isNeonPenActive = false;
let fadeStrokes = [];

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
  requestAnimationFrame(draw_neon);
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

let lastNeonStrokeTime = 0;
const FADE_DELAY = 1000; // 3 seconds delay before fading starts
// Mouse event handlers
canvas.addEventListener("mousedown", (e) => {
  if (!isPencilActive && !isEraserActive && !isNeonPenActive) return; // Do nothing if no tool is active

  const [x, y] = getMousePosition(canvas, e);
  lastX = x;
  lastY = y;

  

  // if (e.button === 2) {
  //   clearCanvas();
  //   return;
  // }

  isDrawing = true;

  if (isEraserActive) {
    eraseStroke(x, y);
    const message = JSON.stringify({ type: 'erase', x, y });
    socket.send(message);
    draw();
    return;
  }

  if (isPencilActive) {
    const brushColor = document.getElementById("brushColor").value;
    const [r, g, b] = hexToRgb(brushColor);

    strokes.push({
      points: [[x, y]],
      color: [r / 255, g / 255, b / 255, 1],
    });

    canvas.style.cursor = 'crosshair';
  }

  if (isNeonPenActive) {
    fadeStrokes.push({
      points: [[x, y]],
      color: [1, 0, 0, 1], // Neon red color
     // startTime: Date.now(),
     startTime: currentTime,
     lastDrawTime: currentTime,
      isFading: false,
      fadeStartTime: null,
      alpha: 1
    });

    lastNeonStrokeTime = currentTime;
    canvas.style.cursor = 'crosshair';
    // requestAnimationFrame(draw_neon);
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(draw_neon);
     } 

       // Send the neon stroke data to the server
     const message = JSON.stringify({ 
      type: 'neonDraw', 
      x, 
      y, 
      color: [1, 0, 0, 1],
      startTime: currentTime, 
      lastDrawTime: currentTime
    });
    console.log('Sending neonDraw action:', message);
    socket.send(message);

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(draw_neon);
    }
  }

});



canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;

  const [x, y] = getMousePosition(canvas, e);

  if (isEraserActive) {
    eraseStroke(x, y);
    draw();
    // Send erase action to server
    const message = JSON.stringify({ type: 'erase', x, y });
    console.log('Sending erase action:', message);
    socket.send(message);
    return;
  }

  if (isPencilActive) {
    const currentStroke = strokes[strokes.length - 1];
    currentStroke.points.push([x, y]);
    draw();

    const message = JSON.stringify({ 
      type: 'draw', 
      x, 
      y, 
      color: currentStroke.color 
    });
    console.log('Sending draw action:', message);
    socket.send(message);

  }

  if (isNeonPenActive) {
    const currentTime = Date.now();
    const currentStroke = fadeStrokes[fadeStrokes.length - 1];
    currentStroke.points.push([x, y]);
   // currentStroke.lastDrawTime = Date.now();
   currentStroke.lastDrawTime = currentTime;
    //requestAnimationFrame(draw_neon);

    const message = JSON.stringify({ 
      type: 'neonDraw', 
      x, 
      y, 
      color: currentStroke.color,
      startTime: currentStroke.startTime,
      lastDrawTime: currentTime 
    });
    console.log('Sending neonDraw action:', message);
    socket.send(message);

    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(draw_neon);
    }
  }

  lastX = x;
  lastY = y;
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
  if (isPencilActive) {
    canvas.style.cursor = 'crosshair';
  } else if (isEraserActive) {
    canvas.style.cursor = 'not-allowed'; // Eraser cursor
  } else {
    canvas.style.cursor = 'default';
  }
});

// Draw function for normal strokes
function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  strokes.forEach((stroke) => {
    const points = stroke.points.flat();
    const color = stroke.color;

    gl.uniform4f(colorLocation, ...color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
  });
}

let currentTime = 0;

// Draw function for neon pen with continuous fading effect
function draw_neon() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw pencil strokes
  strokes.forEach((stroke) => {
    const points = stroke.points.flat();
    const color = stroke.color;

    gl.uniform4f(colorLocation, ...color);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
  });

  // Draw neon pen strokes with fading effect
  const currentTime = Date.now();
  let activeStrokes = 0;

  fadeStrokes = fadeStrokes.filter(stroke => {
    // const points = stroke.points.flat();
    // const baseColor = stroke.color;
    // const timeElapsed = (currentTime - stroke.startTime) / 1000;

    // const fadeDuration = 2;
    // const alpha = Math.max(1 - timeElapsed / fadeDuration, 0);
    // const fadedColor = [...baseColor.slice(0, 3), alpha];

    // gl.uniform4f(colorLocation, ...fadedColor);

    
    //  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    // gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);

    // return alpha > 0;
    const timeSinceLastDraw = currentTime - stroke.lastDrawTime;
    //const timeSinceStart = currentTime - stroke.startTime;

    //if (timeSinceLastDraw > FADE_DELAY) {

 if (timeSinceLastDraw > FADE_DELAY) {
  if (!stroke.isFading) {
  stroke.isFading = true;
  stroke.fadeStartTime = currentTime;
  }
  const fadeTime = currentTime - stroke.fadeStartTime;
  const fadeDuration = 1000; // 1 second fade duration
  stroke.alpha = Math.max(1 - fadeTime / fadeDuration, 0);
 } else {
  stroke.alpha = 1;
 }

//  if (stroke.alpha > 0) {
//   activeStrokes++;
//   return true;
//  }
//  return false;
//   });

//   fadeStrokes.forEach(stroke => {
//     if (stroke.alpha > 0) {
//      const points = stroke.points.flat();
//      const fadedColor = [...stroke.color.slice(0, 3), stroke.alpha];
//      gl.uniform4f(colorLocation, ...fadedColor);
//      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
//      gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
//     }
//     });

if (stroke.alpha > 0) {
  activeStrokes++;
  const points = stroke.points.flat();
  const fadedColor = [...stroke.color.slice(0, 3), stroke.alpha];
  gl.uniform4f(colorLocation, ...fadedColor);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
  gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
  return true;
}
return false;
});


  // requestAnimationFrame(draw_neon);
   // Optimize animation frame requests
 if (activeStrokes > 0 || isNeonPenActive) {
  animationFrameId = requestAnimationFrame(draw_neon);
  } else {
  animationFrameId = null;
  }
}

function handleRemoteDrawing(data) {
  console.log('Handling remote drawing:', data);
  switch (data.type) {
    case 'draw':
      const lastStroke = strokes[strokes.length - 1];
      const shouldStartNewStroke = () => {
        if (strokes.length === 0) return true;
        if (!colorMatch(lastStroke.color, data.color)) return true;
        const lastPoint = lastStroke.points[lastStroke.points.length - 1];
        const dx = data.x - lastPoint[0];
        const dy = data.y - lastPoint[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance > 0.1; // Adjust this threshold as needed
      };

      if (shouldStartNewStroke()) {
        console.log('Adding new stroke');
        strokes.push({
          points: [[data.x, data.y]],
          color: data.color
        });
      } else {
        console.log('Adding point to existing stroke');
        lastStroke.points.push([data.x, data.y]);
      }
      draw();
      break;
    case 'neonDraw':
      if (fadeStrokes.length === 0 || fadeStrokes[fadeStrokes.length - 1].startTime !== data.startTime) {
        console.log('Adding new neon stroke');
        fadeStrokes.push({
          points: [[data.x, data.y]],
          color: data.color,
          startTime: data.startTime,
          lastDrawTime: data.lastDrawTime,
          isFading: false,
          fadeStartTime: null,
          alpha: 1
        });
      } else {
        console.log('Adding point to existing neon stroke');
        //fadeStrokes[fadeStrokes.length - 1].points.push([data.x, data.y]);
        const currentStroke = fadeStrokes[fadeStrokes.length - 1];
        currentStroke.points.push([data.x, data.y]);
        currentStroke.lastDrawTime = data.lastDrawTime;
      
    
      }
      //requestAnimationFrame(draw_neon);
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(draw_neon);
      }
      break;
    case 'erase':
      console.log('Erasing at', data.x, data.y);
      eraseStroke(data.x, data.y);
      draw();
      break;

    case 'clear':
      // Handle remote clear
      strokes.length = 0;
      fadeStrokes.length = 0;
      draw();
      break;

    default:
      console.log('Unknown drawing type:', data.type);
  }
}

// Add this helper function to compare colors
function colorMatch(color1, color2) {
  return color1.every((val, index) => Math.abs(val - color2[index]) < 0.01);
}


// Clear the canvas
let animationFrameId = null;
function clearCanvas() {
  gl.clearColor(245 / 255, 245 / 255, 245 / 255, 1); // Off-white background
  gl.clear(gl.COLOR_BUFFER_BIT);
  
//   while(fadeStrokes.length > 0) {
//     fadeStrokes.pop();
// }
// while(strokes.length > 0) {
//   strokes.pop();
// }
//   strokes.length = 0;
//   fadeStrokes.length = 0;

//   if (animationFrameId) {
//     cancelAnimationFrame(animationFrameId);
//     animationFrameId = null;
//   }

  // Clear the local canvas
  strokes.length = 0;
  fadeStrokes.length = 0;
  draw();

  // Send the clear action to other connected instances
  const message = JSON.stringify({ type: 'clear' });
  console.log('Sending clear action:', message);
  socket.send(message);  // Broadcast the clear action
}


animationFrameId = requestAnimationFrame(draw_neon);

// Prevent context menu on right-click
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// Erase function
function eraseStroke(x, y) {
  let erasedAny = false;
  for (let i = 0; i < strokes.length; i++) {
    const stroke = strokes[i];
    for (let j = 0; j < stroke.points.length; j++) {
      const [px, py] = stroke.points[j];
      const dx = x - px;
      const dy = y - py;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < ERASER_RADIUS) {
        strokes.splice(i, 1);
        erasedAny = true;
        return;
      }
    }
    if (erasedAny) break;
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



const pencilTool = document.getElementById("pencilTool");
const eraserTool = document.getElementById("eraserTool");
const neonPenTool = document.getElementById("neonPenTool");
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
      isNeonPenActive = false;
      pencilTool.classList.add("active");
      eraserTool.classList.remove("active");
      neonPenTool.classList.remove("active");
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
      isNeonPenActive = false;
      eraserTool.classList.add("active");
      pencilTool.classList.remove("active");
      neonPenTool.classList.remove("active");
      pencilTool.style.backgroundColor = ""; // Reset pencil background color
      canvas.style.cursor = "not-allowed";
      
    }
  });


neonPenTool.addEventListener("click", () => {
  
if (isNeonPenActive) {
    isNeonPenActive = false;
    neonPenTool.classList.remove("active");
   // eraserTool.style.backgroundColor = ""; // Reset background color
   neonPenTool.style.backgroundColor = ""; 
   canvas.style.cursor = "default";
  } else {
    isNeonPenActive = true;
    isEraserActive = false;
    isPencilActive = false;
    
    neonPenTool.classList.add("active");
    pencilTool.classList.remove("active");
    eraserTool.classList.remove("active");
    pencilTool.style.backgroundColor = ""; // Reset pencil background color
    eraserTool.style.backgroundColor = ""; // Reset eraser background color
    
    canvas.style.cursor = "crosshair";
    
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