

function connectWebSocket() {
    socket = new WebSocket('wss://pencil-with-dsa-implementation.onrender.com');
    socket.onopen = function (event) {
        console.log('Connected to the WebSocket server');
    };

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === 'userId') {
            userId = data.userId;
            console.log('Received user ID:', userId);
        } else {
            handleRemoteDrawing(data);
        }
    };

    socket.onerror = function (error) {
        console.error(`WebSocket Error: ${error}`);
    };

    socket.onclose = function (event) {
        console.log('WebSocket connection closed:', event);
        if (event.code !== 1000) {
            console.error('WebSocket closed unexpectedly. Code:', event.code, 'Reason:', event.reason);
            // Attempt to reconnect after a delay
            setTimeout(connectWebSocket, 5000);
        }
    };
}

// Call this function when your application starts
connectWebSocket();
document.getElementById("clearTool").addEventListener("click", clearCanvas);


//custom cursors
const eraserCursor = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="-11 6.5 34 24" transform="rotate(-30, 12, 12)"><rect x="2" y="4" width="15" height="18" rx="2" ry="2" fill="pink" stroke="black" stroke-width="2"/><rect x="2" y="12" width="15" height="15" rx="2" ry="4" fill="white" stroke="black" stroke-width="2"/></svg>`;

//const pencilCursor = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="black"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="black"/></svg>`;
//const pencilCursor = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="${brushColorPicker.value}"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="${brushColorPicker.value}'/></svg>`;


const neonPenCursor = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="none" stroke="red" stroke-width="2"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="red"/></svg>`;




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
    requestAnimationFrame(draw_neon);
});

// Vertex shader for Strokes Position
const vertexShaderSource = `
    attribute vec4 a_position;
    void main() {
        gl_Position = a_position;
        gl_PointSize = 2.0; // Set the size of the point
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
const strokes = [];  // Array of line objects
let isPencilActive = false; // Flag to check if pencil tool is active
let isEraserActive = false; // Flag to check if eraser tool is active
const ERASER_RADIUS = 0.05; // Adjust the size of the eraser
let isSelectionActive = false; // Flag to check if selection tool is active
let selectedStroke = null; // Variable to hold the currently selected line
let isDragging = false; // To track if the selected line is being dragged
let isResizing = false; // To track if the selected line is being resized
let isRotating = false; // To track if the selected line is being rotated
let isNeonPenActive = false; // Flag to check if neon pen tool is active
let fadeStrokes = []; //  // Array of fade-line objects
let lastNeonStrokeTime = 0;
const FADE_DELAY = 1000; // 3 seconds delay before fading starts

// Function to convert mouse coordinates to WebGL coordinates
function getMousePosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
    const y = ((event.clientY - rect.top) / canvas.height) * -2 + 1;
    return [x, y];
}

function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

class Stroke {
    constructor() {
        this.id = generateUniqueId();
        this.points = [];
        this.color = [0, 0, 0, 1];
        this.scale = 1;
        this.rotation = 0;
        this.translationX = 0;
        this.translationY = 0;
    }

    addPoint(x, y) {
        this.points.push([x, y]);
    }

    setColor(r, g, b, a) {
        this.color = [r, g, b, a];
    }

    // Applies the tranformation by using translationX, translationY (data members of Stroke Class)
    getTransformedPoints() {
        const cosAngle = Math.cos(this.rotation);
        const sinAngle = Math.sin(this.rotation);

        return this.points.map(([x, y]) => {
            // Apply scale
            x *= this.scale;
            y *= this.scale;

            // Apply rotation
            const rotatedX = x * cosAngle - y * sinAngle;
            const rotatedY = x * sinAngle + y * cosAngle;

            // Apply translation
            const translatedX = rotatedX + this.translationX;
            const translatedY = rotatedY + this.translationY;

            return [translatedX, translatedY];
        });
    }

    // checks if a given point is close to any stroke
    isPointOnStroke(x, y, threshold = 0.05) {
        const transformedPoints = this.getTransformedPoints();
        for (let i = 0; i < transformedPoints.length; i++) {
            const [px, py] = transformedPoints[i];
            const dx = x - px;
            const dy = y - py;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < threshold) {
                return true;
            }
        }
        return false;
    }


    distanceToLineSegment(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

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

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Send stroke data to GPU
    draw(gl, colorLocation) {
        const flatPoints = this.getTransformedPoints().flat();

        gl.uniform4f(colorLocation, ...this.color);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatPoints), gl.STATIC_DRAW);

        if (flatPoints.length === 2) {
            gl.drawArrays(gl.POINTS, 0, 1);
        } else {
            gl.drawArrays(gl.LINE_STRIP, 0, flatPoints.length / 2);
        }
    }

    move(dx, dy) {
        this.translationX += dx;
        this.translationY += dy;
    }

    scaleLine(factor) {
        this.scale *= factor;
    }

    rotateLine(angle) {
        this.rotation += angle;
    }
}

// Detect if a line is clicked based on proximity to the points
function detectLineClick(x, y) {
    for (let stroke of strokes) {
        if (stroke.isPointOnStroke(x, y)) {
            return stroke;
        }
    }
    return null;
}

let currentStroke = null;
let userStrokes = {};

// Mouse event handlers
canvas.addEventListener("mousedown", (e) => {
    if (!isPencilActive && !isEraserActive && !isNeonPenActive && !isSelectionActive) return; // Do nothing if no tool is active



    const [x, y] = getMousePosition(canvas, e);
    lastX = x;
    lastY = y;

    isDrawing = true;

    if (isEraserActive) {
        canvas.style.cursor = `url('${eraserCursor}') 16 16, auto`;
        eraseStroke(x, y);
        const message = JSON.stringify({ type: 'erase', x, y });
        socket.send(message);
        draw();
        return;
    }

    if (isPencilActive) {
        canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;
        isDrawing = true;
        const brushColor = document.getElementById("brushColor").value;
        const [r, g, b] = hexToRgb(brushColor);

        currentStroke = new Stroke();
        currentStroke.addPoint(x, y);
        currentStroke.setColor(r / 255, g / 255, b / 255, 1);

        strokes.push(currentStroke);

        // Send the new stroke data to the server
        const message = JSON.stringify({
            type: 'drawStart',
            userId: userId,
            strokeId: currentStroke.id,
            x,
            y,
            color: currentStroke.color
        });
        socket.send(message);
    }

    if (isNeonPenActive) {
        const newNeonStroke = {
            points: [[x, y]],
            color: [1, 0, 0, 1], // Neon red color
            startTime: Date.now(),
            lastDrawTime: Date.now(),
            isFading: false,
            fadeStartTime: null,
            alpha: 1
        };
        fadeStrokes.push(newNeonStroke);

        //canvas.style.cursor = 'crosshair';
        canvas.style.cursor = `url('${neonPenCursor}') 0 24, auto`;

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(draw_neon);
        }

        // Send the neon stroke data to the server
        const message = JSON.stringify({
            type: 'neonDraw',
            x,
            y,
            color: [1, 0, 0, 1],
            startTime: newNeonStroke.startTime,
            lastDrawTime: newNeonStroke.lastDrawTime
        });
        console.log('Sending neonDraw action:', message);
        socket.send(message);

        canvas.style.cursor = `url('${neonPenCursor}') 0 24, auto`;
        //canvas.style.cursor = 'crosshair';

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(draw_neon);
        }
    }



    if (isSelectionActive) {
        selectedStroke = detectLineClick(x, y);
        if (selectedStroke) {
            isDragging = true;
            if (e.shiftKey) {
                isResizing = true;
            }
            else if (e.ctrlKey) {
                isRotating = true;
            }

            canvas.style.cursor = 'move';

            // Send the selection action to the server
            const message = JSON.stringify({
                type: 'selection',
                action: 'select',
                selectedStroke: { id: selectedStroke.id }
            });
            socket.send(message);
        }
    }

});



canvas.addEventListener("mousemove", (e) => {
    // if (!isDrawing) return;

    const [x, y] = getMousePosition(canvas, e);
    const dx = x - lastX;
    const dy = y - lastY;



    if (isPencilActive && currentStroke) {

        //canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;

        currentStroke.addPoint(x, y);
        requestAnimationFrame(draw);

        const message = JSON.stringify({
            type: 'draw',
            userId: userId,
            strokeId: currentStroke.id,
            x,
            y
        });
        socket.send(message);
    }

    else if (isNeonPenActive && isDrawing) {

        //canvas.style.cursor = `url('${neonPenCursor}') 0 24, auto`;

        const currentTime = Date.now();
        const currentStroke = fadeStrokes[fadeStrokes.length - 1];
        currentStroke.points.push([x, y]);
        currentStroke.lastDrawTime = currentTime;

        const message = JSON.stringify({
            type: 'neonDraw',
            x,
            y,
            color: currentStroke.color,
            startTime: currentStroke.startTime,
            lastDrawTime: currentTime
        });
        socket.send(message);

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(draw_neon);
        }
    }

    else if (isDragging && selectedStroke) {
        let action;
        if (isResizing) {
            const scalingFactor = 1 + (dy / 100);
            selectedStroke.scaleLine(scalingFactor);
            action = 'resize';
        } else if (isRotating) {
            const rotationAngle = dx / 100;
            selectedStroke.rotateLine(rotationAngle);
            action = 'rotate';
        } else {
            selectedStroke.move(dx, dy);
            action = 'move';
        }

        const message = JSON.stringify({
            type: 'selection',
            dx,
            dy,
            selectedStroke: { id: selectedStroke.id },
            action
        });
        socket.send(message);

        draw();
    }

    lastX = x;
    lastY = y;
});

canvas.addEventListener("mouseup", () => {

    if (isDrawing) {
        const message = JSON.stringify({
            type: 'drawEnd',
            userId: userId,
            strokeId: currentStroke ? currentStroke.id : null
        });
        socket.send(message);
    }
    isDrawing = false;
    currentStroke = null;


    if (isNeonPenActive) {

        canvas.style.cursor = `url('${neonPenCursor}') 0 24, auto`;

        const message = JSON.stringify({ type: 'neonDrawEnd' });
        socket.send(message);
        isDrawing = false;
    }

    isDrawing = false;
    isDragging = false;
    isResizing = false;
    isRotating = false;

    selectedStroke = null;



    // Reset cursor based on active tool
    if (isPencilActive) {
        canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;
        //canvas.style.cursor = 'crosshair';
    } else if (isEraserActive) {
        canvas.style.cursor = `url('${eraserCursor}') 16 16, auto`;
        //canvas.style.cursor = 'not-allowed'; // Eraser cursor
    } else if (isSelectionActive) {
        canvas.style.cursor = 'move';
        //canvas.style.cursor = 'not-allowed'; // Eraser cursor
    }

    else if (isNeonPenActive) {
        canvas.style.cursor = `url('${neonPenCursor}') 0 24, auto`;
    }
    else {
        canvas.style.cursor = cursor;
    }
});

canvas.addEventListener("mouseout", () => {
    isDrawing = false;
    if (isPencilActive) {
        //canvas.style.cursor = 'crosshair';
        canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;
    } else if (isEraserActive) {
        canvas.style.cursor = `url('${eraserCursor}') 16 16, auto`;
        //canvas.style.cursor = 'not-allowed'; // Eraser cursor
    } else if (isNeonPenActive) {
        canvas.style.cursor = `url('${neonPenCursor}') 0 24, auto`;
    } else if (isSelectionActive) {
        canvas.style.cursor = 'move';
    }

    else {
        canvas.style.cursor = 'default';
    }
});


let animationFrameId = null;
// Draw function for normal strokes
function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let stroke of strokes) {
        if (stroke === selectedStroke) {
            // Draw a highlight around the selected stroke
            gl.uniform4f(colorLocation, 1, 0, 0, 1); // Red color for highlight
            stroke.draw(gl, colorLocation);

            // Draw the actual stroke
            gl.uniform4f(colorLocation, ...stroke.color);
            stroke.draw(gl, colorLocation);
        } else {
            stroke.draw(gl, colorLocation);
        }
    }

    // // Request next frame only if there's ongoing drawing
    // if (isDrawing || Object.keys(userStrokes).length > 0) {
    //     animationFrameId = requestAnimationFrame(draw);
    // } else {
    //     animationFrameId = null;
    // }
}

let currentTime = 0;

function draw_neon() {
    gl.clear(gl.COLOR_BUFFER_BIT);



    // Draw pencil strokes
    strokes.forEach((stroke) => {
        stroke.draw(gl, colorLocation);
    });

    // Draw neon pen strokes with fading effect
    const currentTime = Date.now();
    let activeStrokes = 0;

    fadeStrokes = fadeStrokes.filter(stroke => {

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


// Function to handle remote selection updates
function handleRemoteSelection(data) {
    console.log('Handling remote selection:', data);
    if (data.type === 'selection') {
        const { x, y, selectedStrokeIndex } = data;
        if (selectedStrokeIndex >= 0 && selectedStrokeIndex < strokes.length) {
            selectedStroke = strokes[selectedStrokeIndex];
            selectedStrokeIndex = selectedStrokeIndex;
            draw();
        } else {
            selectedStroke = null;
            selectedStrokeIndex = null;
        }
    }
}


let currentRemoteStroke = null;
let isNewStroke = true;


function handleRemoteDrawing(data) {
    const { type, userId, strokeId } = data;

    switch (type) {
        case 'drawStart':
            const { x, y, color } = data;
            userStrokes[strokeId] = new Stroke();
            userStrokes[strokeId].id = strokeId;
            userStrokes[strokeId].setColor(color[0], color[1], color[2], color[3]);
            strokes.push(userStrokes[strokeId]);
            userStrokes[strokeId].addPoint(x, y);
            requestAnimationFrame(draw);
            break;

        case 'draw':
            const { x: drawX, y: drawY } = data;
            if (userStrokes[strokeId]) {
                userStrokes[strokeId].addPoint(drawX, drawY);
                requestAnimationFrame(draw);
            }
            break;

        case 'drawEnd':
            delete userStrokes[strokeId];
            break;

        case 'erase':
            const { x: eraseX, y: eraseY } = data;
            eraseStroke(eraseX, eraseY);
            requestAnimationFrame(draw);
            break;

        case 'neonDraw':
            const { x: neonX, y: neonY, color: neonColor, startTime, lastDrawTime } = data;
            let currentNeonStroke = fadeStrokes.find(stroke => stroke.startTime === startTime && stroke.userId === userId);

            if (!currentNeonStroke) {
                currentNeonStroke = {
                    points: [],
                    color: neonColor,
                    startTime: startTime,
                    lastDrawTime: lastDrawTime,
                    isFading: false,
                    fadeStartTime: null,
                    alpha: 1,
                    userId: userId
                };
                fadeStrokes.push(currentNeonStroke);
            }

            currentNeonStroke.points.push([neonX, neonY]);
            currentNeonStroke.lastDrawTime = lastDrawTime;

            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(draw_neon);
            }
            break;

        case 'neonDrawEnd':
            // No action needed here, as the neon stroke will start fading automatically
            break;

        case 'selection':
            const { dx, dy, selectedStroke: remoteSelectedStroke, action } = data;
            const localStroke = strokes.find(stroke => stroke.id === remoteSelectedStroke.id);
            if (localStroke) {
                switch (action) {
                    case 'move':
                        localStroke.move(dx, dy);
                        break;
                    case 'resize':
                        const scalingFactor = 1 + (dy / 100);
                        localStroke.scaleLine(scalingFactor);
                        break;
                    case 'rotate':
                        const rotationAngle = dx / 100;
                        localStroke.rotateLine(rotationAngle);
                        break;
                }
                requestAnimationFrame(draw);
            }
            break;

        case 'clear':
            strokes.length = 0;
            fadeStrokes.length = 0;
            requestAnimationFrame(draw);
            break;

        default:
            console.log('Unknown drawing type:', type);
    }
}

// Add this helper function to compare colors
function colorMatch(color1, color2) {
    return color1.every((val, index) => Math.abs(val - color2[index]) < 0.01);
}


// Clear the canvas

function clearCanvas() {
    gl.clearColor(245 / 255, 245 / 255, 245 / 255, 1); // Off-white background
    gl.clear(gl.COLOR_BUFFER_BIT);

    while (strokes.length > 0) {
        strokes.pop();
    }

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
    for (let i = strokes.length - 1; i >= 0; i--) {
        const stroke = strokes[i];
        const transformedPoints = stroke.getTransformedPoints();
        for (let j = 0; j < transformedPoints.length; j++) {
            const [px, py] = transformedPoints[j];
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
const selectionTool = document.getElementById("selectionTool");
const brushColorPicker = document.getElementById("brushColor");
const clearTool = document.getElementById("clearTool");

function updateToolIconBackground(toolElement, color) {
    toolElement.style.backgroundColor = color;
}

function getPencilCursor(color) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="${encodeURIComponent(color)}"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="${encodeURIComponent(color)}"/></svg>`;
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
        isSelectionActive = false;
        pencilTool.classList.add("active");
        eraserTool.classList.remove("active");
        neonPenTool.classList.remove("active");
        selectionTool.classList.remove("active");
        updateToolIconBackground(pencilTool, brushColorPicker.value); // Set active color
        eraserTool.style.backgroundColor = ""; // Reset eraser background color
        neonPenTool.style.backgroundColor = ""; // Reset neon-pen background color
        selectionTool.style.backgroundColor = ""; // Reset select tool background color
        //canvas.style.cursor = "crosshair";
        canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;

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
        isSelectionActive = false;
        eraserTool.classList.add("active");
        pencilTool.classList.remove("active");
        neonPenTool.classList.remove("active");
        selectionTool.classList.remove("active");
        pencilTool.style.backgroundColor = ""; // Reset pencil background color
        neonPenTool.style.backgroundColor = ""; // Reset neon-pen background color
        selectionTool.style.backgroundColor = ""; // Reset pencil background color
        // canvas.style.cursor = "not-allowed";
        canvas.style.cursor = `url('${eraserCursor}') 16 16, auto`;

    }
});


neonPenTool.addEventListener("click", () => {

    if (isNeonPenActive) {
        isNeonPenActive = false;
        neonPenTool.classList.remove("active");
        neonPenTool.style.backgroundColor = "";
        canvas.style.cursor = "default";
    } else {
        isNeonPenActive = true;
        isEraserActive = false;
        isPencilActive = false;
        isSelectionActive = false;

        neonPenTool.classList.add("active");
        pencilTool.classList.remove("active");
        eraserTool.classList.remove("active");
        selectionTool.classList.remove("active");
        pencilTool.style.backgroundColor = ""; // Reset pencil background color
        eraserTool.style.backgroundColor = ""; // Reset eraser background color
        selectionTool.style.backgroundColor = ""; // Reset selection-tool background color

        //canvas.style.cursor = "crosshair";
        canvas.style.cursor = `url('${neonPenCursor}') 0 24, auto`;

    }
});

// Activate Selection Tool
selectionTool.addEventListener("click", () => {
    if (isSelectionActive) {
        isSelectionActive = false;
        selectionTool.classList.remove("active");
        selectionTool.style.backgroundColor = ""; // Reset background color
        canvas.style.cursor = "default";
    } else {
        isSelectionActive = true;
        isEraserActive = false;
        isNeonPenActive = false;
        isPencilActive = false;
        selectionTool.classList.add("active");
        eraserTool.classList.remove("active");
        neonPenTool.classList.remove("active");
        pencilTool.classList.remove("active");
        eraserTool.style.backgroundColor = ""; // Reset eraser background color
        neonPenTool.style.backgroundColor = ""; // Reset neon-pen background color
        pencilTool.style.backgroundColor = ""; // Reset pencil background color
        //canvas.style.cursor = "cursor";
        canvas.style.cursor = 'move';
    }
});

// Listen to color picker changes to update the pencil tool background color
brushColorPicker.addEventListener("input", () => {
    if (isPencilActive) {
        updateToolIconBackground(pencilTool, brushColorPicker.value); // Update pencil icon color
        canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;

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