// Add this to the start of your whiteboard JavaScript
if (!sessionStorage.getItem('roomId') || !sessionStorage.getItem('passcode')) {
    window.location.href = '/room.html';
}


// Declare these globally at the top of your script
let currentRoomId = null;
let userId = null;
let socket = null;
let isOnline = true;
const connectionStatus = document.getElementById('connectionStatus');

function updateConnectionStatus(online) {
    isOnline = online;
    connectionStatus.className = `connection-status show ${online ? 'online' : 'offline'}`;
    connectionStatus.querySelector('.status-text').textContent = online ? 'Connected' : 'Offline';

    // Hide the notification after 3 seconds if online
    if (online) {
        setTimeout(() => {
            connectionStatus.classList.remove('show');
        }, 3000);
    }
}

const roomId = sessionStorage.getItem('roomId');

function connectWebSocket() {
    // Get roomId from sessionStorage
    const roomId = sessionStorage.getItem('roomId');
    const passcode = sessionStorage.getItem('passcode');

    

    // Set currentRoomId globally before creating socket
    currentRoomId = roomId;

    socket = new WebSocket(`wss://pencil-whiteboard.onrender.com?room=${roomId}`);
    
    socket.onopen = function (event) {
        console.log('Connected to the WebSocket server');
        updateConnectionStatus(true);

        // Send join room message
        socket.send(JSON.stringify({
            type: 'join_room',
            roomId: roomId,
            passcode: passcode
        }));
    };

    socket.onmessage = function (event) {
        const data = JSON.parse(event.data);
        
        // Handle user ID assignment
        if (data.type === 'userId') {
            userId = data.userId;
            console.log('Received user ID:', userId);
        } 
        // Handle room state
        else if (data.type === 'room_state') {
            console.log('Room state received:', data.state);
            // Optionally restore canvas state or perform other initialization
        }
        // Handle remote drawing events
        else {
            handleRemoteDrawing(data);
        }
    };

    socket.onerror = function (error) {
        console.error(`WebSocket Error: ${error}`);
        updateConnectionStatus(false);
    };

    socket.onclose = function (event) {
        console.log('WebSocket connection closed:', event);
        updateConnectionStatus(false);
        if (event.code !== 1000) {
            console.error('WebSocket closed unexpectedly. Code:', event.code, 'Reason:', event.reason);
            // Attempt to reconnect after a delay
            setTimeout(connectWebSocket, 5000);
        }
    };
}

// Call this function when your application starts
connectWebSocket();

// Add these functions to your existing script.js

function getRoomShareMessage() {
    const roomId = sessionStorage.getItem('roomId');
    const passcode = sessionStorage.getItem('passcode');
    
    if (!roomId || !passcode) {
        alert('Room details not available. Please create or join a room first.');
        return null;
    }

    return `Join my Pencil Whiteboard Room!\n\nRoom ID: ${roomId}\nPasscode: ${passcode}\n\nVisit: ${window.location.origin}/room.html to join.`;
}

function shareViaWhatsApp() {
    const message = getRoomShareMessage();
    if (message) {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }
}

function shareViaTelegram() {
    const message = getRoomShareMessage();
    if (message) {
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/room.html')}&text=${encodeURIComponent(message)}`;
        window.open(telegramUrl, '_blank');
    }
}

function copyRoomDetails() {
    const message = getRoomShareMessage();
    if (message) {
        navigator.clipboard.writeText(message).then(() => {
            alert('Room details copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Failed to copy room details.');
        });
    }
}

// Add event listener for the share button
document.addEventListener('DOMContentLoaded', () => {
    const shareRoomButton = document.getElementById('shareRoomButton');
    const shareOptionsDropdown = document.getElementById('shareOptionsDropdown');

    if (shareRoomButton && shareOptionsDropdown) {
        shareRoomButton.addEventListener('click', () => {
            shareOptionsDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        window.addEventListener('click', (event) => {
            if (!shareRoomButton.contains(event.target) && 
                !shareOptionsDropdown.contains(event.target)) {
                shareOptionsDropdown.classList.remove('show');
            }
        });
    }
});

window.addEventListener('online', () => {
    updateConnectionStatus(true);
    connectWebSocket(); // Reconnect WebSocket when internet returns
});

window.addEventListener('offline', () => {
    updateConnectionStatus(false);
});

// Check initial connection status
updateConnectionStatus(navigator.onLine);

document.getElementById("clearTool").addEventListener("click", clearCanvas);


//custom cursors
const eraserCursor = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="-11 6.5 34 24" transform="rotate(-30, 12, 12)"><rect x="2" y="4" width="15" height="18" rx="2" ry="2" fill="pink" stroke="black" stroke-width="2"/><rect x="2" y="12" width="15" height="15" rx="2" ry="4" fill="white" stroke="black" stroke-width="2"/></svg>`;

//const pencilCursor = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="black"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="black"/></svg>`;
//const pencilCursor = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="${brushColorPicker.value}"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="${brushColorPicker.value}'/></svg>`;


const neonPenCursor = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="none" stroke="red" stroke-width="2"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="red"/></svg>`;




// Initialize WebGL context
const canvas = document.getElementById("webglCanvas");
const gl = canvas.getContext("webgl", {
    antialias: true,
    alpha: true,
    premultipliedAlpha: false
});

const lineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
console.log('Supported line width range:', lineWidthRange);


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


let strokeSize = 1;
// Vertex shader for Strokes Position
const vertexShaderSource = `
    attribute vec4 a_position;
    uniform float u_pointSize;
    uniform mat4 u_matrix;
    varying float v_pointSize;

    void main() {
        gl_Position = a_position;
        gl_PointSize = u_pointSize;
        v_pointSize = u_pointSize;
    }
`;

// Modify fragment shader to support line width
const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    varying float v_pointSize;

    void main() {
        vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
        float distanceFromCenter = length(circCoord);
        
        // Adaptive soft edge based on point size
        float edgeThreshold = 1.0 - (2.0 / v_pointSize);
        
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

const pointSizeLocation = gl.getUniformLocation(program, "u_pointSize");


// Variables which store the state of Drawing
let isDrawing = false;
let lastX = 0, lastY = 0;
let strokes = [];  // Array of line objects
let isPencilActive = false; // Flag to check if pencil tool is active
let isEraserActive = false; // Flag to check if eraser tool is active
const ERASER_RADIUS = 0.05; // Adjust the size of the eraser
const PIXEL_ERASER_RADIUS = 0.02; // Adjust this radius as needed for pixel erasing
let isPixelEraserActive = false; // Flag to check if pixel eraser tool is active
let isSelectionActive = false; // Flag to check if selection tool is active
let selectedStroke = null; // Variable to hold the currently selected line
let initialPosition = null;  // Stores the initial position before dragging
let isDragging = false; // To track if the selected line is being dragged
let isResizing = false; // To track if the selected line is being resized
let isRotating = false; // To track if the selected line is being rotated
let isNeonPenActive = false; // Flag to check if neon pen tool is active
let fadeStrokes = []; //  // Array of fade-line objects
let lastNeonStrokeTime = 0;
const FADE_DELAY = 1000; // 3 seconds delay before fading starts

// Version control states
let undoStack = [];
let redoStack = [];

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

let isShapeToolActive = false;
let currentShape = null;
let shapeStartX = 0;
let shapeStartY = 0;
let shapePreview = null;


function normalizeCoordinates(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    // Convert screen coordinates to WebGL clip space (-1 to 1)
    const x = ((e.clientX - rect.left) / canvas.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / canvas.height) * 2 + 1;
    return { x, y };
}

class Stroke {
    constructor(initialSize = 1, currentSize = null) {
        this.id = generateUniqueId();
        this.points = [];
        this.smoothedPoints = [];
        this.color = [0, 0, 0, 1];
        this.initialStrokeSize = initialSize; // Original stroke size

        // Use the provided current size, or default to initial size
        this.strokeSize = currentSize || initialSize;
        this.renderStrokeSize = currentSize || initialSize;

        this.renderPoints = []; // Separate array for rendering
        this.scale = 1;
        this.rotation = 0;
        this.translationX = 0;
        this.translationY = 0;
        this.lastPoint = null;
        this.interpolationThreshold = 0.5;
        this.interpolationConfig = {
            minDistance: 0.01,      // Minimum point capture distance
            maxDistance: 0.02,       // Maximum interpolation distance
            velocityThreshold: 59, // Drawing speed threshold
            smoothingFactor: 0.3    // Curve smoothing intensity
        };
        this.lastTimestamp = Date.now();
        this.velocityHistory = []; // Track recent drawing velocities
    }

    calculateInterpolationSteps(distance) {
        // Dynamically calculate interpolation steps based on drawing speed
        const { minDistance, maxDistance } = this.interpolationConfig;
        return Math.max(
            1,
            Math.min(
                Math.floor(distance / minDistance),
                Math.ceil(distance * 10)
            )
        );
    }

    addPoint(x, y, timestamp = Date.now()) {
        // First point handling
        if (this.points.length === 0) {
            this.points.push([x, y]);
            this.lastPoint = [x, y];
            this.lastTimestamp = timestamp;
            return;
        }

        // Calculate drawing dynamics
        const [lastX, lastY] = this.lastPoint;
        const timeDelta = timestamp - this.lastTimestamp;
        const distance = Math.sqrt(
            Math.pow(x - lastX, 2) +
            Math.pow(y - lastY, 2)
        );

        // Calculate velocity
        const velocity = timeDelta > 0 ? distance / timeDelta : 0;

        // Maintain velocity history (rolling window)
        this.velocityHistory.push(velocity);
        if (this.velocityHistory.length > 5) {
            this.velocityHistory.shift();
        }

        // Calculate average velocity
        const averageVelocity = this.velocityHistory.reduce((a, b) => a + b, 0) / this.velocityHistory.length;

        // Adaptive interpolation
        const interpolationSteps = this.calculateInterpolationSteps(distance, averageVelocity);

        // Generate interpolated points
        for (let i = 1; i <= interpolationSteps; i++) {
            const t = i / interpolationSteps;

            // Use cubic interpolation for smoother curves
            const interpX = this.smoothInterpolate(lastX, x, t);
            const interpY = this.smoothInterpolate(lastY, y, t);

            this.points.push([interpX, interpY]);
        }

        // Always add the final point to ensure continuity
        this.points.push([x, y]);

        // Update tracking variables
        this.lastPoint = [x, y];
        this.lastTimestamp = timestamp;
    }

    calculateInterpolationSteps(distance, velocity) {
        const {
            minDistance,
            maxDistance,
            velocityThreshold,
            maxInterpolationSteps
        } = this.interpolationConfig;

        // Base interpolation steps on distance and velocity
        let steps = Math.ceil(distance / minDistance);

        // Adjust steps based on velocity
        if (velocity > velocityThreshold) {
            // Fast drawing - reduce interpolation
            steps = Math.max(1, Math.floor(steps * 0.5));
        } else {
            // Slow drawing - increase interpolation
            steps = Math.min(steps, maxInterpolationSteps);
        }

        return steps;
    }


    generateRenderPoints() {
        // Create interpolated points for smoother rendering
        this.renderPoints = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            const [x1, y1] = this.points[i];
            const [x2, y2] = this.points[i + 1];

            // Interpolate additional points
            const segments = Math.max(1, Math.floor(this.strokeSize / 2));
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const x = x1 + t * (x2 - x1);
                const y = y1 + t * (y2 - y1);
                this.renderPoints.push([x, y]);
            }
        }

        // Fallback if no interpolation
        if (this.renderPoints.length === 0) {
            this.renderPoints = [...this.points];
        }
    }

    // Advanced point interpolation method
    // addPoint(x, y) {
    //     // First point
    //     if (this.points.length === 0) {
    //         this.points.push([x, y]);
    //         this.smoothedPoints.push([x, y]);
    //         this.lastPoint = [x, y];
    //         return;
    //     }

    //     // Calculate distance from last point
    //     const [lastX, lastY] = this.lastPoint;
    //     const distance = Math.sqrt(
    //         Math.pow(x - lastX, 2) +
    //         Math.pow(y - lastY, 2)
    //     );

    //     // Interpolate points for smooth drawing
    //     if (distance > this.interpolationThreshold) {
    //         // Linear interpolation
    //         const interpolationSteps = Math.ceil(distance / this.interpolationThreshold);

    //         for (let i = 1; i <= interpolationSteps; i = i + .01) {
    //             const t = i / interpolationSteps;
    //             const interpX = lastX + t * (x - lastX);
    //             const interpY = lastY + t * (y - lastY);

    //             this.points.push([interpX, interpY]);
    //             this.smoothedPoints.push([interpX, interpY]);
    //         }

    //         this.lastPoint = [x, y];
    //     } else {
    //         // Add point directly if close to last point
    //         this.points.push([x, y]);
    //         this.smoothedPoints.push([x, y]);
    //         this.lastPoint = [x, y];
    //     }
    // }
    smoothInterpolate(start, end, t) {
        // Enhanced cubic interpolation with tension control
        const tension = 0.5; // Adjust for different curve characteristics
        const t2 = t * t;
        const t3 = t2 * t;

        return start + (end - start) * (
            (2 * t3 - 3 * t2 + 1) * tension +
            (t3 - 2 * t2 + t) * (1 - tension) +
            (-2 * t3 + 3 * t2)
        );
    }

    smoothStroke() {
        if (this.points.length < 2) return;

        const smoothed = [];
        for (let i = 0; i < this.points.length - 1; i++) {
            const [x1, y1] = this.points[i];
            const [x2, y2] = this.points[i + 1];

            // Compute quarter and three-quarter points
            const qx1 = 0.75 * x1 + 0.25 * x2;
            const qy1 = 0.75 * y1 + 0.25 * y2;
            const qx2 = 0.25 * x1 + 0.75 * x2;
            const qy2 = 0.25 * y1 + 0.75 * y2;

            // Add smoothed points
            if (i === 0) smoothed.push([x1, y1]);
            smoothed.push([qx1, qy1]);
            smoothed.push([qx2, qy2]);
            if (i === this.points.length - 2) smoothed.push([x2, y2]);
        }

        this.smoothedPoints = smoothed;
    }

    setColor(r, g, b, a) {
        this.color = [r, g, b, a];
    }

    // Applies the tranformation by using translationX, translationY (data members of Stroke Class)
    getTransformedPoints() {
        const cosAngle = Math.cos(this.rotation);
        const sinAngle = Math.sin(this.rotation);

        const transformedPoints = this.points.map(([x, y]) => {
            // Apply scale 
            let scaledX = x * this.scale;
            let scaledY = y * this.scale;

            // Apply rotation 
            const rotatedX = scaledX * cosAngle - scaledY * sinAngle;
            const rotatedY = scaledX * sinAngle + scaledY * cosAngle;

            // Apply translation 
            const translatedX = rotatedX + this.translationX;
            const translatedY = rotatedY + this.translationY;

            return [translatedX, translatedY];
        });

        return transformedPoints;
    }


    // checks if a given point is close to any stroke
    isPointOnStroke(x, y, threshold = 0.1) {
        const transformedPoints = this.getTransformedPoints();

        // Check if the shape is a rectangle, circle, or triangle
        if (this.type === 'rectangle') {
            return isPointInRectangle(x, y, this.startX, this.startY, this.endX, this.endY);
        } else if (this.type === 'circle') {
            return isPointInCircle(x, y, this.startX, this.startY, this.endX, this.endY);
        } else if (this.type === 'triangle') {
            return isPointInTriangle(x, y, this.startX, this.startY, this.endX, this.endY);
        }

        // For strokes with fewer points, use a different proximity check 
        if (transformedPoints.length < 2) {
            const [strokeX, strokeY] = transformedPoints[0];
            const distance = Math.sqrt(
                Math.pow(x - strokeX, 2) +
                Math.pow(y - strokeY, 2)
            );
            return distance <= threshold;
        }

        // Iterate through each line segment in the stroke 
        for (let i = 0; i < transformedPoints.length - 1; i++) {
            const [x1, y1] = transformedPoints[i];
            const [x2, y2] = transformedPoints[i + 1];

            const distance = this.distanceToLineSegment(x, y, x1, y1, x2, y2);

            // Adjust the threshold based on stroke size for better precision
            const dynamicThreshold = threshold / (this.strokeSize);

            if (distance <= dynamicThreshold) {
                return true;
            }
        }
        return false;
    }

    distanceToLineSegment(x, y, x1, y1, x2, y2) {
        // Vector from line start to point 
        const A = x - x1;
        const B = y - y1;

        // Vector from line start to line end 
        const C = x2 - x1;
        const D = y2 - y1;

        // Length of line segment squared 
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        // Normalized projection of point onto line 
        let param = lenSq !== 0 ? Math.max(0, Math.min(1, dot / lenSq)) : -1;

        // Calculate closest point on line segment 
        const closestX = x1 + param * C;
        const closestY = y1 + param * D;

        // Return distance to closest point 
        const dx = x - closestX;
        const dy = y - closestY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Send stroke data to GPU
    draw(gl, colorLocation) {
        const canvasWidth = gl.canvas.width;
        const canvasHeight = gl.canvas.height;
        const normalizedSize = this.initialStrokeSize / Math.min(canvasWidth, canvasHeight);

        this.smoothStroke();
        gl.uniform4f(colorLocation, ...this.color);

        const thickPoints = this.points.flatMap((point, i, arr) => {
            if (i === arr.length - 1) return [];
            const [x1, y1] = point;
            const [x2, y2] = arr[i + 1];

            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);

            const perpX = -dy / len * normalizedSize;
            const perpY = dx / len * normalizedSize;

            return [
                [x1 - perpX, y1 - perpY],
                [x1 + perpX, y1 + perpY],
                [x2 - perpX, y2 - perpY],
                [x2 + perpX, y2 + perpY]
            ];
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(thickPoints.flat()), gl.STATIC_DRAW);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, thickPoints.length);
    }

    updateCurrentStrokeSize(newSize) {
        // Ensure the new size is within reasonable bounds
        const constrainedSize = Math.max(1, Math.min(newSize, 50));

        // Update both strokeSize and renderStrokeSize
        this.strokeSize = constrainedSize;
        this.renderStrokeSize = constrainedSize;
    }

    generateThickLineGeometry(points, thickness) {
        if (points.length < 2) return points;

        const thickPoints = [];

        for (let i = 0; i < points.length - 1; i++) {
            const [x1, y1] = points[i];
            const [x2, y2] = points[i + 1];

            // Calculate perpendicular vector
            const dx = x2 - x1;
            const dy = y2 - y1;
            const length = Math.sqrt(dx * dx + dy * dy);

            // Normalize and rotate 90 degrees
            const perpX = -dy / length * (thickness / 2);
            const perpY = dx / length * (thickness / 2);

            // Generate thick line segment as two triangles
            thickPoints.push(
                [x1 - perpX, y1 - perpY],  // Left bottom
                [x1 + perpX, y1 + perpY],  // Left top
                [x2 - perpX, y2 - perpY],  // Right bottom
                [x2 + perpX, y2 + perpY]   // Right top
            );
        }

        return thickPoints;
    }



    move(dx, dy) {
        console.log(`Moving stroke ID: ${this.id}, dx: ${dx}, dy: ${dy}`);
        this.translationX += dx;
        this.translationY += dy;
    }

    scaleLine(factor) {
        console.log(`Scaling stroke ID: ${this.id}, Scale factor: ${factor}`);
        this.scale *= factor;
    }

    rotateLine(angle) {
        console.log(`Rotating stroke ID: ${this.id}, Rotation angle: ${angle}`);
        this.rotation += angle;
    }


    updateStrokeSize(newSize) {
        // Validate and constrain stroke size
        const constrainedSize = Math.max(1, Math.min(newSize, 50));

        if (this.strokeSize !== constrainedSize) {
            console.log(`Stroke Size Update: ${this.strokeSize} → ${constrainedSize}`);

            this.strokeSize = constrainedSize;
            this.generateRenderPoints(); // Regenerate points on size change

            // Optional: Broadcast size change
            this.broadcastSizeChange();
        }
    }

    broadcastSizeChange() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'strokeSizeUpdate',
                strokeId: this.id,
                size: this.strokeSize
            }));
        }
    }


}

class Shape extends Stroke {
    constructor(type) {
        super();
        this.type = type;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.points = [];
    }

    // Override the addPoint method to ensure points are added correctly
    addPoint(x, y) {
        this.points.push([x, y]); // Add points to the points array
    }

    draw(gl, colorLocation) {
        switch (this.type) {
            case 'rectangle':
                this.drawRectangle(gl, colorLocation);
                break;
            case 'circle':
                this.drawCircle(gl, colorLocation);
                break;
            case 'triangle':
                this.drawTriangle(gl, colorLocation);
                break;
        }
    }

    drawRectangle(gl, colorLocation) {
        const points = [
            this.startX, this.startY,
            this.endX, this.startY,
            this.endX, this.endY,
            this.startX, this.endY,
            this.startX, this.startY
        ];

        gl.uniform4f(colorLocation, ...this.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        gl.drawArrays(gl.LINE_STRIP, 0, 5);
    }

    drawCircle(gl, colorLocation) {
        const segments = 32;
        const points = [];
        const centerX = (this.startX + this.endX) / 2;
        const centerY = (this.startY + this.endY) / 2;
        const radiusX = Math.abs(this.endX - this.startX) / 2;
        const radiusY = Math.abs(this.endY - this.startY) / 2;

        for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * 2 * Math.PI;
            points.push(
                centerX + radiusX * Math.cos(theta),
                centerY + radiusY * Math.sin(theta)
            );
        }

        gl.uniform4f(colorLocation, ...this.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        gl.drawArrays(gl.LINE_STRIP, 0, points.length / 2);
    }

    drawTriangle(gl, colorLocation) {
        const points = [
            this.startX, this.startY,
            this.endX, this.startY,
            (this.startX + this.endX) / 2, this.endY,
            this.startX, this.startY
        ];

        gl.uniform4f(colorLocation, ...this.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        gl.drawArrays(gl.LINE_STRIP, 0, 4);
    }

    move(dx, dy) {
        this.startX += dx;
        this.endX += dx;
        this.startY += dy;
        this.endY += dy;
    }

    scaleLine(factor) {
        const centerX = (this.startX + this.endX) / 2;
        const centerY = (this.startY + this.endY) / 2;

        const newWidth = (this.endX - this.startX) * factor;
        const newHeight = (this.endY - this.startY) * factor;

        this.startX = centerX - newWidth / 2;
        this.endX = centerX + newWidth / 2;
        this.startY = centerY - newHeight / 2;
        this.endY = centerY + newHeight / 2;
    }

    rotateLine(angle) {
        // For shapes, rotation might be more complex
        // This is a simple placeholder implementation
        const centerX = (this.startX + this.endX) / 2;
        const centerY = (this.startY + this.endY) / 2;

        const rotatePoint = (x, y) => {
            const dx = x - centerX;
            const dy = y - centerY;
            return [
                centerX + dx * Math.cos(angle) - dy * Math.sin(angle),
                centerY + dx * Math.sin(angle) + dy * Math.cos(angle)
            ];
        };

        const [newStartX, newStartY] = rotatePoint(this.startX, this.startY);
        const [newEndX, newEndY] = rotatePoint(this.endX, this.endY);

        this.startX = newStartX;
        this.startY = newStartY;
        this.endX = newEndX;
        this.endY = newEndY;
    }
}

// Update TextStroke class to support more text properties
class TextStroke extends Stroke {
    constructor(text, x, y, fontSize, color, fontFamily, isBold, isItalic) {
        super();
        this.type = 'text';
        this.x = x;
        this.y = y;
        this.text = text;
        this.fontSize = fontSize;
        this.fontColor = color;
        this.fontFamily = fontFamily;
        this.isBold = isBold;
        this.isItalic = isItalic;
        this.addPoint(x, y);

        // Add bounding box properties for better selection
        this.width = null;
        this.height = null;
    }

    // Override draw method to use new text properties
    draw(gl, colorLocation) {
        // This method remains for potential WebGL use, 
        // but text rendering is handled in drawTextOverlay
    }

    // Method to calculate text dimensions
    calculateTextDimensions(ctx) {
        ctx.font = `${this.fontSize}px ${this.fontFamily}`;
        const metrics = ctx.measureText(this.text);
        this.width = metrics.width;
        this.height = this.fontSize;
    }

    // Enhanced selection method
    isPointInside(x, y, ctx) {
        // Calculate text dimensions if not already done 
        if (this.width === null || this.height === null) {
            ctx.font = `${this.isBold ? 'bold ' : ''}${this.isItalic ? 'italic ' : ''}${this.fontSize}px ${this.fontFamily}`;
            const metrics = ctx.measureText(this.text);
            this.width = metrics.width;
            this.height = this.fontSize;
        }

        // Transform WebGL coordinates to canvas coordinates 
        const canvasX = ((this.x + 1) / 2) * canvas.width;
        const canvasY = ((1 - this.y) / 2) * canvas.height;

        // Check if point is within text bounding box 
        return (
            x >= canvasX &&
            x <= canvasX + this.width &&
            y >= canvasY - this.height &&
            y <= canvasY
        );
    }

    // Method to draw selection border (optional, for visual feedback)
    drawSelectionBorder(ctx) {
        const canvasX = ((this.x + 1) / 2) * canvas.width;
        const canvasY = ((1 - this.y) / 2) * canvas.height;

        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            canvasX,
            canvasY - this.height,
            this.width,
            this.height
        );
    }
}


// Detect if a line is clicked based on proximity to the points
function detectLineClick(x, y) {
    console.log(`Detecting line click at: (${x}, ${y})`);

    const baseThreshold = 0.1;

    // Reverse iteration to select the topmost (most recently added) stroke
    for (let i = strokes.length - 1; i >= 0; i--) {
        const stroke = strokes[i];

        // Check if stroke is defined and has the expected properties
        if (!stroke) {
            console.warn(`Stroke at index ${i} is undefined.`);
            continue;
        }

        // Enhanced selection for shapes, with specific handling for triangle
        if (stroke instanceof Shape) {
            const { startX, startY, endX, endY, type } = stroke;
            let isSelected = false;

            switch (type) {
                case 'rectangle':
                    isSelected = isPointInRectangle(x, y, startX, startY, endX, endY);
                    break;
                case 'circle':
                    isSelected = isPointInCircle(x, y, startX, startY, endX, endY);
                    break;
                case 'triangle':
                    // Check if point is inside the triangle
                    isSelected = isPointInTriangle(x, y, startX, startY, endX, endY);
                    break;
            }

            if (isSelected) {
                console.log(`Shape stroke selected: ${type}`);
                return stroke;
            }
        }

        // Existing point-based detection for other strokes
        if (typeof stroke.isPointOnStroke === 'function') {
            const dynamicThreshold = baseThreshold * (stroke.strokeSize || 1);
            if (stroke.isPointOnStroke(x, y, dynamicThreshold)) {
                console.log(`Stroke selected: ID ${stroke.id}`);
                return stroke;
            }
        } else {
            console.warn(`Stroke at index ${i} does not have isPointOnStroke method.`);
        }
    }

    console.log("No stroke detected.");
    return null;
}

// Helper functions for shape selection (these can be added to your existing code)
function isPointInRectangle(x, y, startX, startY, endX, endY) {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

function isPointInCircle(x, y, startX, startY, endX, endY) {
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const radiusX = Math.abs(endX - startX) / 2;
    const radiusY = Math.abs(endY - startY) / 2;

    const dx = (x - centerX) / radiusX;
    const dy = (y - centerY) / radiusY;
    return dx * dx + dy * dy <= 1;
}

function isPointInTriangle(x, y, startX, startY, endX, endY) {
    const midX = (startX + endX) / 2;
    const thirdPointY = endY;

    // Define the triangle vertices
    const v1 = { x: startX, y: startY };
    const v2 = { x: endX, y: startY };
    const v3 = { x: midX, y: thirdPointY };

    // Barycentric coordinate technique for point-in-triangle test
    function sign(p1, p2, p3) {
        return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    }

    const d1 = sign({ x, y }, v1, v2);
    const d2 = sign({ x, y }, v2, v3);
    const d3 = sign({ x, y }, v3, v1);

    const hasNegative = (d1 < 0) || (d2 < 0) || (d3 < 0);
    const hasPositive = (d1 > 0) || (d2 > 0) || (d3 > 0);

    // Point is inside if all signs are the same (all negative or all positive)
    return !(hasNegative && hasPositive);
}

let currentStroke = null;
let userStrokes = {};

// Mouse event handlers
canvas.addEventListener("mousedown", (e) => {
    const [x, y] = getMousePosition(canvas, e);
    lastX = x;
    lastY = y;
    isDrawing = true;

    if (isTextToolActive) {
        const [x, y] = getMousePosition(canvas, e);
        handleTextTool(x, y);
    }

    if (isTextToolActive &&
        !textInputOverlay.contains(e.target) &&
        !textControlsOverlay.contains(e.target) &&
        e.target !== canvas) {
        textInputOverlay.style.display = 'none';
        textControlsOverlay.style.display = 'none';
    }
    // Handle shape tools
    if (isShapeToolActive && currentShape) {
        shapeStartX = x;
        shapeStartY = y;

        const currentShapeObj = new Shape(currentShape);
        currentShapeObj.startX = x;
        currentShapeObj.startY = y;
        currentShapeObj.endX = x;
        currentShapeObj.endY = y;

        // Add the initial point to the shape's points
        currentShapeObj.addPoint(x, y); // Ensure points are added

        const brushColor = document.getElementById("brushColor").value;
        const [r, g, b] = hexToRgb(brushColor);
        currentShapeObj.setColor(r / 255, g / 255, b / 255, 1);

        currentStroke = currentShapeObj;
        strokes.push(currentShapeObj);

        // Send shape start to server
        const message = JSON.stringify({
            type: 'shapeStart',
            shapeType: currentShape,
            x: x,
            y: y,
            color: currentShapeObj.color
        });
        socket.send(message);
        return;
    }

    // Handle eraser
    if (isEraserActive) {
        canvas.style.cursor = `url('${eraserCursor}') 16 16, auto`;
        eraseStroke(x, y);
        const message = JSON.stringify({ type: 'erase', x, y });
        socket.send(message);
        draw();
        return;
    }

    if (isPixelEraserActive) {
        draw(); // Finalize the erase
        
        // Send comprehensive stroke data after pixel erasing
        const message = JSON.stringify({
            type: 'erasePixel',
            userId: userId,
            x: lastX,
            y: lastY,
            updatedStrokes: strokes.map(stroke => {
                // Create a plain object representation of the stroke
                const strokeData = {
                    ...stroke,
                    points: stroke.points,
                    color: stroke.color,
                    strokeSize: stroke.strokeSize
                };
                
                // Add additional properties for shapes
                if (stroke.type) {
                    strokeData.type = stroke.type;
                    strokeData.startX = stroke.startX;
                    strokeData.startY = stroke.startY;
                    strokeData.endX = stroke.endX;
                    strokeData.endY = stroke.endY;
                }
                
                return strokeData;
            })
        });
        socket.send(message);
    }
    // Handle pencil
    if (isPencilActive) {
        canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;
        isDrawing = true;
        const brushColor = document.getElementById("brushColor").value;
        const [r, g, b] = hexToRgb(brushColor);

        currentStroke = new Stroke(strokeSize);
        currentStroke.addPoint(x, y);
        currentStroke.setColor(r / 255, g / 255, b / 255, 1);
        currentStroke.strokeSize = strokeSize;

        strokes.push(currentStroke);

        recordAction('add', currentStroke); // Record this new stroke as an "add" action

        // Send the new stroke data to the server
        const message = JSON.stringify({
            type: 'drawStart',
            userId: userId,
            strokeId: currentStroke.id,
            x,
            y,
            color: currentStroke.color,
            strokeSize: strokeSize
        });
        socket.send(message);
    }

    // Handle neon pen
    if (isNeonPenActive) {
        const newNeonStroke = {
            points: [[x, y]],
            color: [1, 0, 0, 1], // Neon red color
            startTime: Date.now(),
            lastDrawTime: Date.now(),
            isFading: false,
            fadeStartTime: null,
            alpha: 1,
            userId: userId
        };
        fadeStrokes.push(newNeonStroke);

        canvas.style.cursor = `url('${neonPenCursor}') 0 24, auto`;

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(draw_neon);
        }

        // Send the neon stroke data to the server
        const message = JSON.stringify({
            type: 'neonDraw',
            userId: userId,
            x,
            y,
            color: [1, 0, 0, 1],
            startTime: newNeonStroke.startTime,
            lastDrawTime: newNeonStroke.lastDrawTime
        });
        socket.send(message);
        return;
    }

    // Handle selection
    if (isSelectionActive) {
        selectedStroke = detectLineClick(x, y);

        if (selectedStroke) {
            console.log(`Selected stroke ID: ${selectedStroke.id}`);
            isDragging = true;
            initialPosition = { translationX: selectedStroke.translationX, translationY: selectedStroke.translationY };  // Record initial position
            if (e.shiftKey) {
                isResizing = true;
            } else if (e.ctrlKey) {
                isRotating = true;
            }

            canvas.style.cursor = 'move';

            // Deselect previously selected strokes and highlight the current one
            strokes.forEach(stroke => {
                if (stroke !== selectedStroke) {
                    stroke.setColor(...stroke.color.slice(0, 3), 1); // Reset opacity
                }
            });

            
            requestAnimationFrame(draw);
        } else {
            console.log("No stroke selected. Try clicking closer to a stroke.");

            // Deselect all strokes if no stroke is selected
            strokes.forEach(stroke => {
                stroke.setColor(...stroke.color.slice(0, 3), 1); // Reset opacity
            });
            requestAnimationFrame(draw);
        }

        return;
    }

    
});



canvas.addEventListener("mousemove", (e) => {
    // if (!isDrawing) return;

    const [x, y] = getMousePosition(canvas, e);
    const dx = x - lastX;
    const dy = y - lastY;


    if (isShapeToolActive && isDrawing && currentStroke) {
        const [x, y] = getMousePosition(canvas, e);
        currentStroke.endX = x;
        currentStroke.endY = y;

        // Send shape update to server
        const message = JSON.stringify({
            type: 'shapeUpdate',
            shapeType: currentShape,
            startX: currentStroke.startX,
            startY: currentStroke.startY,
            endX: x,
            endY: y
        });
        socket.send(message);

        requestAnimationFrame(draw);
    }

    if (isPencilActive && currentStroke) {

        //canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;

        currentStroke.updateStrokeSize(strokeSize);
        currentStroke.addPoint(x, y);
        strokes = [...strokes, currentStroke];
        requestAnimationFrame(draw);
        strokes.pop(); // Remove the temporary stroke

        const message = JSON.stringify({
            type: 'draw',
            userId: userId,
            strokeId: currentStroke.id,
            x,
            y,
            strokeSize: strokeSize
        });
        socket.send(message);
    }

    if (isPixelEraserActive && isDrawing) {
        erasePixel(x, y);
        
        // Add WebSocket message sending
        const message = JSON.stringify({
            type: 'erasePixel',
            x,
            y
        });
        socket.send(message);
        
        draw();
    }


    else if (isNeonPenActive && isDrawing) {
        const currentTime = Date.now();
        const currentNeonStroke = fadeStrokes[fadeStrokes.length - 1];

        if (currentNeonStroke && currentNeonStroke.userId === userId) {
            currentNeonStroke.points.push([x, y]);
            currentNeonStroke.lastDrawTime = currentTime;

            const message = JSON.stringify({
                type: 'neonDraw',
                userId: userId,
                x,
                y,
                color: currentNeonStroke.color,
                startTime: currentNeonStroke.startTime,
                lastDrawTime: currentTime
            });
            socket.send(message);

            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(draw_neon);
            }
        }
    }

    else if (isDragging && selectedStroke) {
        console.log('Dragging stroke:', selectedStroke.id);
        let action;
        if (isResizing) {
            const scaleFactor = 1 + dy;
            selectedStroke.scaleLine(scaleFactor);
            action = 'resize';
            console.log('Resizing stroke');
        } else if (isRotating) {
            const rotationFactor = dx * Math.PI;
            selectedStroke.rotateLine(rotationFactor);
            action = 'rotate';
            console.log('Rotating stroke');
        } else {
            selectedStroke.move(dx, dy);
            action = 'move';
            console.log('Moving stroke');
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
    draw();
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
    if (currentStroke && currentStroke.points.length > 0) {
        currentStroke = null;
        draw();
    }


    if (isNeonPenActive) {
        const message = JSON.stringify({
            type: 'neonDrawEnd',
            userId: userId
        });
        socket.send(message);

        // End the current neon stroke
        if (fadeStrokes.length > 0) {
            fadeStrokes[fadeStrokes.length - 1].lastDrawTime = Date.now();
        }
    }

    if (isPixelEraserActive) {
        draw(); // Finalize the erase
        
        // Optional: Send a final erase message if needed
        const message = JSON.stringify({
            type: 'erasePixelEnd',
            userId: userId
        });
        socket.send(message);
    }

    if (isDragging && selectedStroke) {
        const finalPosition = { translationX: selectedStroke.translationX, translationY: selectedStroke.translationY };

        // Record the move action with initial and final positions
        recordAction('move', selectedStroke, initialPosition, finalPosition);
        console.log("Final Position Recorded:", finalPosition);

        // Reset dragging state
        isDragging = false;
        selectedStroke = null;
    }

    isDrawing = false;
    isDragging = false;
    isResizing = false;
    isRotating = false;
    currentStroke = null;
    selectedStroke = null;



    // Reset cursor based on active tool
    if (isPencilActive) {
        canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;
        //canvas.style.cursor = 'crosshair';
    } else if (isEraserActive) {
        canvas.style.cursor = `url('${eraserCursor}') 16 16, auto`;
        //canvas.style.cursor = 'not-allowed'; // Eraser cursor
    } else if (isPixelEraserActive) {
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
    } else if (isPixelEraserActive) {
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

    // Draw the background 
    drawBackground();

    for (let stroke of strokes) {
        // Use the transformed points for drawing
        const transformedPoints = stroke.getTransformedPoints();

        // Temporarily replace the stroke's points with transformed points
        const originalPoints = stroke.points;
        stroke.points = transformedPoints;

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

        // Restore original points
        stroke.points = originalPoints;
    }

    drawTextOverlay();
}

//Text Input Properties

document.getElementById('textTool').addEventListener('click', activateTextTool);

// Text configuration controls
const textControlsOverlay = document.createElement('div');
textControlsOverlay.id = 'textControlsOverlay';
textControlsOverlay.innerHTML = `
    <div style="display: flex; background: rgba(240,240,240,0.9); padding: 10px; border-radius: 5px; gap: 10px; align-items: center;">
        <select id="fontSelect">
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
        </select>
        <input type="color" id="textColorPicker" value="#000000">
        <input type="number" id="fontSizeInput" min="8" max="72" value="16">
        <button id="boldToggle">B</button>
        <button id="italicToggle">I</button>
    </div>
`;
document.body.appendChild(textControlsOverlay);

// Get references to controls
const fontSelect = document.getElementById('fontSelect');
const textColorPicker = document.getElementById('textColorPicker');
const fontSizeInput = document.getElementById('fontSizeInput');
const boldToggle = document.getElementById('boldToggle');
const italicToggle = document.getElementById('italicToggle');

// State for text styling
let textStyle = {
    font: 'Arial',
    color: '#000000',
    fontSize: 16,
    isBold: false,
    isItalic: false
};

// Add a text input overlay
const textInputOverlay = document.createElement('div');
textInputOverlay.id = 'textInputOverlay';
textInputOverlay.style.position = 'absolute';
textInputOverlay.style.display = 'none';
textInputOverlay.style.zIndex = '1000';
textInputOverlay.innerHTML = `
    <input type="text" id="textInput" 
           style="position: absolute; 
                  background: rgba(255,255,255,0.8); 
                  border: 1px solid #ccc; 
                  padding: 5px; 
                  font-size: 16px;"
           placeholder="Type your text here">
`;
document.body.appendChild(textInputOverlay);

const textInput = document.getElementById('textInput');

// Position text controls overlay
function positionTextControls(x, y) {
    const canvasX = ((x + 1) / 2) * canvas.width;
    const canvasY = ((1 - y) / 2) * canvas.height;
    
    textControlsOverlay.style.position = 'absolute';
    textControlsOverlay.style.left = `${canvasX}px`;
    textControlsOverlay.style.top = `${canvasY + 30}px`;
    textControlsOverlay.style.display = 'block';
}

// Modify handleTextTool to show controls
function handleTextTool(x, y) {
    // Position and show text input
    const canvasX = ((x + 1) / 2) * canvas.width;
    const canvasY = ((1 - y) / 2) * canvas.height;
    
    textInputOverlay.style.left = `${canvasX}px`;
    textInputOverlay.style.top = `${canvasY}px`;
    textInputOverlay.style.display = 'block';
    
    // Position text controls
    positionTextControls(x, y);
    
    // Store the current text coordinates
    textInput.dataset.x = x;
    textInput.dataset.y = y;
    
    // Focus the input
    textInput.focus();
}

let isTextToolActive = false;
let textFontSize = 16;

// Modify text tool activation to use the new mechanism
function activateTextTool() {
    // Deactivate other tools
    isPencilActive = false;
    isEraserActive = false;
    isSelectionActive = false;
    isNeonPenActive = false;
    isShapeToolActive = false;

    // Activate text tool
    isTextToolActive = true;

    // Update cursor
    canvas.style.cursor = 'text';

    // Highlight the text tool icon
    document.getElementById('textTool').classList.add('active-tool');
}


// Event listeners for text style controls
fontSelect.addEventListener('change', (e) => {
    textStyle.font = e.target.value;
});

textColorPicker.addEventListener('input', (e) => {
    textStyle.color = e.target.value;
});

fontSizeInput.addEventListener('input', (e) => {
    textStyle.fontSize = parseInt(e.target.value);
});

boldToggle.addEventListener('click', () => {
    textStyle.isBold = !textStyle.isBold;
    boldToggle.style.fontWeight = textStyle.isBold ? 'bold' : 'normal';
});

italicToggle.addEventListener('click', () => {
    textStyle.isItalic = !textStyle.isItalic;
    italicToggle.style.fontStyle = textStyle.isItalic ? 'italic' : 'normal';
});

// Create a preview text stroke to show text in real-time
let previewTextStroke = null;

textInput.addEventListener('input', (e) => {
    const text = textInput.value;
    const x = parseFloat(textInput.dataset.x);
    const y = parseFloat(textInput.dataset.y);
    
    // Remove previous preview text stroke
    if (previewTextStroke) {
        const index = strokes.indexOf(previewTextStroke);
        if (index > -1) {
            strokes.splice(index, 1);
        }
    }
    
    if (text) {
        const [r, g, b] = hexToRgb(textStyle.color);

        previewTextStroke = new TextStroke(
            text, 
            x, 
            y, 
            textStyle.fontSize, 
            [r / 255, g / 255, b / 255, 0.5], // Lower opacity for preview
            textStyle.font,
            textStyle.isBold,
            textStyle.isItalic
        );
        
        // Add preview stroke to strokes array
        strokes.push(previewTextStroke);
        
        // Redraw to show preview
        requestAnimationFrame(draw);
        drawTextOverlay();
    }
});




// Modify existing enter key handler to remove preview
textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const text = textInput.value;
        const x = parseFloat(textInput.dataset.x);
        const y = parseFloat(textInput.dataset.y);
        
        if (text) {
            const [r, g, b] = hexToRgb(textStyle.color);

            const textStroke = new TextStroke(
                text, 
                x, 
                y, 
                textStyle.fontSize, 
                [r / 255, g / 255, b / 255, 1], // Full opacity for final text
                textStyle.font,
                textStyle.isBold,
                textStyle.isItalic
            );
            
            // Remove preview stroke if it exists
            if (previewTextStroke) {
                const index = strokes.indexOf(previewTextStroke);
                if (index > -1) {
                    strokes.splice(index, 1);
                }
                previewTextStroke = null;
            }
            
            strokes.push(textStroke);

            // Send text stroke data to server
            const message = JSON.stringify({
                type: 'textStroke',
                text,
                x,
                y,
                fontSize: textStyle.fontSize,
                color: {  // Change color to an object
                    r: r / 255,
                    g: g / 255,
                    b: b / 255,
                    a: 1
                },
                fontFamily: textStyle.font,
                isBold: textStyle.isBold,
                isItalic: textStyle.isItalic
            });
            socket.send(message);

            // Redraw canvas
            requestAnimationFrame(draw);
            drawTextOverlay();

            // Clear and hide input
            textInput.value = '';
            textInputOverlay.style.display = 'none';
        }
    }
});

// Create a separate canvas for text overlay
const textOverlayCanvas = document.createElement('canvas');
textOverlayCanvas.id = 'textOverlayCanvas';
textOverlayCanvas.style.position = 'absolute';
textOverlayCanvas.style.left = '0';
textOverlayCanvas.style.top = '0';
textOverlayCanvas.style.pointerEvents = 'none';
textOverlayCanvas.style.zIndex = '2';
textOverlayCanvas.style.background = 'transparent';
document.body.appendChild(textOverlayCanvas);

// Modify the drawTextOverlay function to use transparent background
function drawTextOverlay() {
    const ctx = textOverlayCanvas.getContext('2d', { alpha: true }); // Enable alpha channel
    ctx.clearRect(0, 0, textOverlayCanvas.width, textOverlayCanvas.height);
    
    textOverlayCanvas.width = canvas.width;
    textOverlayCanvas.height = canvas.height;
    
    // Ensure the context is transparent after resize
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, textOverlayCanvas.width, textOverlayCanvas.height);

    strokes.forEach(stroke => {
        if (stroke.type === 'text') {
            // Construct font style
            let fontStyle = '';
            if (stroke.isItalic) fontStyle += 'italic ';
            if (stroke.isBold) fontStyle += 'bold ';
            
            ctx.font = `${fontStyle} ${stroke.fontSize}px ${stroke.fontFamily}`;
            ctx.fillStyle = `rgba(${stroke.fontColor[0]*255}, ${stroke.fontColor[1]*255}, ${stroke.fontColor[2]*255}, ${stroke.fontColor[3]})`;
            
            // Transform text position to match WebGL coordinate system
            const canvasX = ((stroke.points[0][0] + 1) / 2) * canvas.width;
            const canvasY = ((1 - stroke.points[0][1]) / 2) * canvas.height;
            
            ctx.fillText(stroke.text, canvasX, canvasY);
        }
    });
}

// New helper function to hide text overlay
function hideTextOverlay() {
    // Hide text input overlay
    const textInputOverlay = document.getElementById('textInputOverlay');
    if (textInputOverlay) {
        textInputOverlay.style.display = 'none';
    }

    // Hide text controls overlay
    const textControlsOverlay = document.getElementById('textControlsOverlay');
    if (textControlsOverlay) {
        textControlsOverlay.style.display = 'none';
    }

    // Clear any preview text stroke
    if (previewTextStroke) {
        const index = strokes.indexOf(previewTextStroke);
        if (index > -1) {
            strokes.splice(index, 1);
        }
        previewTextStroke = null;
    }

    // Reset text tool state
    isTextToolActive = false;
    document.getElementById('textTool').classList.remove('active-tool');
    
    // Redraw to remove any preview
    requestAnimationFrame(draw);
}

// Update window resize to also resize text overlay
window.addEventListener('resize', () => {
    textOverlayCanvas.width = canvas.width;
    textOverlayCanvas.height = canvas.height;
    drawTextOverlay();
});


let currentTime = 0;

function draw_neon() {
    gl.clear(gl.COLOR_BUFFER_BIT);


    draw();
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


// Helper function to create a deep copy of a stroke
function cloneStroke(stroke) {
    const newStroke = new Stroke();
    newStroke.id = stroke.id;
    newStroke.points = [...stroke.points];
    newStroke.color = [...stroke.color];
    newStroke.scale = stroke.scale;
    newStroke.rotation = stroke.rotation;
    newStroke.translationX = stroke.translationX;
    newStroke.translationY = stroke.translationY;
    return newStroke;
}

// Helper function to create a deep copy of strokes array
function cloneStrokes(strokes) {
    return strokes.map(stroke => cloneStroke(stroke));
}

// Function to record actions with differential changes
function recordAction(type, stroke, previousPosition = null, newPosition = null) {
    const action = {
        type,
        stroke: cloneStroke(stroke),  // Using your existing cloneStroke function
        previousPosition: previousPosition ? { ...previousPosition } : null,
        newPosition: newPosition ? { ...newPosition } : null
    };
    undoStack.push(action);
    redoStack = [];
    console.log("Action recorded:", action);
}

// Apply the recorded action for undo or redo
function applyAction(action, reverse = false) {
    console.log("Applying action:", action, "reverse:", reverse);

    let newStrokes = [...strokes]; // Create a new array reference

    if ((action.type === 'add' && !reverse) || (action.type === 'remove' && reverse)) {
        const newStroke = cloneStroke(action.stroke);
        newStrokes.push(newStroke);
        console.log("Added stroke:", newStroke);
    }
    else if ((action.type === 'remove' && !reverse) || (action.type === 'add' && reverse)) {
        newStrokes = newStrokes.filter(stroke => stroke.id !== action.stroke.id);
        console.log("Removed stroke with id:", action.stroke.id);
    }
    else if (action.type === 'move') {
        const strokeIndex = newStrokes.findIndex(s => s.id === action.stroke.id);
        if (strokeIndex !== -1) {
            const position = reverse ? action.previousPosition : action.newPosition;
            const updatedStroke = cloneStroke(newStrokes[strokeIndex]);
            updatedStroke.translationX = position.translationX;
            updatedStroke.translationY = position.translationY;
            newStrokes[strokeIndex] = updatedStroke;
        }
    }

    // Update the strokes array with the new state
    strokes = newStrokes;
    draw(); // Call draw immediately after updating strokes
}

function undo() {
    if (undoStack.length === 0) return;

    const lastAction = undoStack.pop();
    const redoAction = {
        type: lastAction.type,
        stroke: cloneStroke(lastAction.stroke),
        previousPosition: lastAction.previousPosition ? { ...lastAction.previousPosition } : null,
        newPosition: lastAction.newPosition ? { ...lastAction.newPosition } : null
    };
    redoStack.push(redoAction);

    console.log("Undoing action:", lastAction);
    applyAction(lastAction, true);
}

function redo() {
    if (redoStack.length === 0) return;

    const lastRedoAction = redoStack.pop();
    const undoAction = {
        type: lastRedoAction.type,
        stroke: cloneStroke(lastRedoAction.stroke),
        previousPosition: lastRedoAction.previousPosition ? { ...lastRedoAction.previousPosition } : null,
        newPosition: lastRedoAction.newPosition ? { ...lastRedoAction.newPosition } : null
    };
    undoStack.push(undoAction);

    console.log("Redoing action:", lastRedoAction);
    applyAction(lastRedoAction, false);

    // Force a redraw to ensure the stroke is displayed
    requestAnimationFrame(() => {
        draw();
        console.log("Redraw after redo, strokes:", strokes);
    });
}




const backgroundTypes = {
    BLANK: 'blank',
    GRAPH: 'graph',
    DOTS: 'dots',
    LINES: 'lines',
    HONEYCOMB: 'honeycomb',
};

let currentBackground = backgroundTypes.BLANK;

function drawBackground() {
    switch (currentBackground) {
        case backgroundTypes.GRAPH:
            drawGraphBackground();
            break;
        case backgroundTypes.DOTS:
            drawDotsBackground();
            break;
        case backgroundTypes.LINES:
            drawLinesBackground();
            break;

        case backgroundTypes.HONEYCOMB:
            drawHoneycombBackground();
            break;


        case backgroundTypes.BLANK:
        default:
            // Do nothing for blank background
            break;
    }
}

function drawGraphBackground() {
    const gridSize = 50; // Size of each grid square in pixels
    gl.useProgram(program);

    // Set color to light grey
    gl.uniform4f(colorLocation, 0.9, 0.9, 0.9, 1);

    // Draw vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
        const normalizedX = (x / canvas.width) * 2 - 1;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            normalizedX, -1,
            normalizedX, 1
        ]), gl.STATIC_DRAW);
        gl.drawArrays(gl.LINES, 0, 2);
    }

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
        const normalizedY = 1 - (y / canvas.height) * 2;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, normalizedY,
            1, normalizedY
        ]), gl.STATIC_DRAW);
        gl.drawArrays(gl.LINES, 0, 2);
    }
}

function drawDotsBackground() {
    const dotSpacing = 150; // Space between dots in pixels
    const dotSize = 3.0; // Size of the dots (you can adjust this value)

    gl.useProgram(program);

    // Set color to light grey
    gl.uniform4f(colorLocation, 0.5, 0.5, 0.5, 1);

    // Set the point size
    const pointSizeLocation = gl.getUniformLocation(program, "u_pointSize");
    gl.uniform1f(pointSizeLocation, dotSize);

    for (let x = 0; x <= canvas.width; x += dotSpacing) {
        for (let y = 0; y <= canvas.height; y += dotSpacing) {
            const normalizedX = (x / canvas.width) * 2 - 1;
            const normalizedY = 1 - (y / canvas.height) * 2;
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([normalizedX, normalizedY]), gl.STATIC_DRAW);
            gl.drawArrays(gl.POINTS, 0, 1);
        }
    }
}

function drawLinesBackground() {
    const lineSpacing = 50; // Space between lines in pixels
    gl.useProgram(program);

    // Set color to light grey
    gl.uniform4f(colorLocation, 0.9, 0.9, 0.9, 1);

    // Draw horizontal lines
    for (let y = 0; y <= canvas.height; y += lineSpacing) {
        const normalizedY = 1 - (y / canvas.height) * 2;
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, normalizedY,
            1, normalizedY
        ]), gl.STATIC_DRAW);
        gl.drawArrays(gl.LINES, 0, 2);
    }
}

function drawHoneycombBackground() {
    const hexSize = 30; // Size of each hexagon
    const hexColor = [0.9, 0.9, 0.9, 1]; // Light grey

    gl.useProgram(program);
    gl.uniform4f(colorLocation, ...hexColor);

    let hexagons = [];

    for (let y = 0; y < canvas.height + hexSize * 2; y += hexSize * 1.5) {
        for (let x = 0; x < canvas.width + hexSize * 2; x += hexSize * Math.sqrt(3)) {
            const centerX = x / canvas.width * 2 - 1;
            const centerY = 1 - y / canvas.height * 2;

            for (let i = 0; i < 6; i++) {
                const angle = i / 6 * Math.PI * 2;
                const nextAngle = (i + 1) / 6 * Math.PI * 2;

                hexagons.push(
                    centerX + Math.cos(angle) * hexSize / canvas.width,
                    centerY + Math.sin(angle) * hexSize / canvas.height,
                    centerX + Math.cos(nextAngle) * hexSize / canvas.width,
                    centerY + Math.sin(nextAngle) * hexSize / canvas.height
                );
            }
        }
    }

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hexagons), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINES, 0, hexagons.length / 2);
}


// Function to switch and draw the selected background
function changeBackground(backgroundType) {
    if (backgroundTypes.hasOwnProperty(backgroundType)) {
        currentBackground = backgroundTypes[backgroundType];
        draw(); // Redraw the canvas with the new background

        // Send the background change to other clients
        const message = JSON.stringify({
            type: 'backgroundChange',
            backgroundType: backgroundType
        });
        socket.send(message);
    } else {
        console.error('Invalid background type');
    }
    // Hide the dropdown after selection
    const dropdown = document.getElementById('backgroundDropdown');
    dropdown.style.display = 'none';
    setBackgroundTool.classList.remove("active");
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

        

        case 'shapeStart':
            const shapeObj = new Shape(data.shapeType);
            shapeObj.startX = data.x;
            shapeObj.startY = data.y;
            shapeObj.endX = data.x;
            shapeObj.endY = data.y;
            shapeObj.setColor(...data.color);
            strokes.push(shapeObj);
            requestAnimationFrame(draw);
            break;

        case 'shapeUpdate':
            const lastStroke = strokes[strokes.length - 1];
            if (lastStroke instanceof Shape) {
                lastStroke.endX = data.endX;
                lastStroke.endY = data.endY;
                requestAnimationFrame(draw);
            }
            break;
        // Modify the 'drawStart' case
        case 'drawStart':
            const { x, y, color, strokeSize: initialSize } = data;
            const newStroke = new Stroke(initialSize);
            newStroke.id = strokeId;
            newStroke.setColor(color[0], color[1], color[2], color[3]);
            newStroke.addPoint(x, y);
            strokes.push(newStroke);
            // Add the stroke to userStrokes
            userStrokes[strokeId] = newStroke;
            requestAnimationFrame(draw);
            break;

        case 'draw':
            const { x: drawX, y: drawY, strokeId: drawStrokeId } = data;
            const drawStroke = strokes.find(s => s.id === drawStrokeId);
            
            if (drawStroke) {
                drawStroke.addPoint(drawX, drawY);
                requestAnimationFrame(draw);
            } else {
                console.warn(`Stroke with ID ${drawStrokeId} not found`);
            }
            break;


        case 'drawEnd':
            delete userStrokes[strokeId];
            break;

        case 'strokeSizeUpdate':
            const { strokeId: sizeStrokeId, size } = data;
            const sizeStroke = strokes.find(s => s.id === sizeStrokeId);
            if (sizeStroke) {
                sizeStroke.updateStrokeSize(size);
                requestAnimationFrame(draw);
            }
            break;

        case 'erase':
            const { x: eraseX, y: eraseY } = data;
            eraseStroke(eraseX, eraseY);
            requestAnimationFrame(draw);
            break;

        case 'erasePixel':
            const { x: erasePixelX, y: erasePixelY, updatedStrokes } = data;
            
            // If updatedStrokes is provided, directly replace the strokes
            if (updatedStrokes) {
                strokes = updatedStrokes.map(strokeData => {
                    // Reconstruct strokes with proper methods
                    let stroke;
                    if (strokeData.type && ['rectangle', 'circle', 'triangle'].includes(strokeData.type)) {
                        stroke = new Shape(strokeData.type);
                        Object.assign(stroke, strokeData);
                    } else {
                        stroke = new Stroke(strokeData.strokeSize);
                        Object.assign(stroke, strokeData);
                    }
                    return stroke;
                });
            } else {
                // Fallback to original pixel erase method if no updated strokes are provided
                erasePixel(erasePixelX, erasePixelY);
            }
            
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
                    userId: userId  // Add userId to the stroke
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
                console.log(`Remote action: ${action} on stroke ID: ${localStroke.id}`);
                draw(); // Redraw after remote action
            }
            break;

        case 'clear':
            const isDarkMode = data.darkMode;
            if (isDarkMode) {
                gl.clearColor(0.133, 0.133, 0.133, 1.0); // Dark grey for dark mode
            } else {
                gl.clearColor(0.961, 0.961, 0.961, 1.0); // Light grey for light mode
            }
            gl.clear(gl.COLOR_BUFFER_BIT);
            strokes.length = 0;
            fadeStrokes.length = 0;
            requestAnimationFrame(draw);
            break;

        case 'backgroundChange':
            currentBackground = backgroundTypes[data.backgroundType];
            requestAnimationFrame(draw);
            break;

        case 'modeChange':
            if (data.darkMode) {
                enableDarkMode();
            } else {
                disableDarkMode();
            }
            updateClearColor();
            break;

        case 'textStroke':
            const textStroke = new TextStroke(
                data.text,
                data.x,
                data.y,
                data.fontSize,
                // Change this line to use the new color object format
                [data.color.r, data.color.g, data.color.b, data.color.a],
                data.fontFamily || 'Arial',
                data.isBold || false,
                data.isItalic || false
            );
            strokes.push(textStroke);
            requestAnimationFrame(draw);
            break;

        case 'undo':
            strokes = data.strokes;
            draw();
            break;
        case 'redo':
            strokes = data.strokes;
            draw();
            break;

        default:
            console.log('Unknown drawing type:', type);
    }
}



function handleDrawStart(event) {
    const { x, y } = getCanvasCoordinates(event);

    // Create new stroke with dynamic properties
    currentStroke = new Stroke(strokeSize);
    currentStroke.setColor(...currentColor);
    currentStroke.addPoint(x, y);

    strokes.push(currentStroke);

    // Prepare for smooth drawing
    lastX = x;
    lastY = y;
}
const optimizedDraw = createDrawingOptimizer();


function createDrawingOptimizer(maxFrequency = 60) {
    let lastDrawTime = 0;
    const minInterval = 1000 / maxFrequency;

    return function optimize(drawFunction) {
        const now = Date.now();
        if (now - lastDrawTime >= minInterval) {
            drawFunction();
            lastDrawTime = now;
        }
    };
}

// Add this helper function to compare colors
function colorMatch(color1, color2) {
    return color1.every((val, index) => Math.abs(val - color2[index]) < 0.01);
}



// Add event listeners for all tools

document.getElementById('rectangleTool').addEventListener('click', activateRectangleTool);
document.getElementById('circleTool').addEventListener('click', activateCircleTool);
document.getElementById('triangleTool').addEventListener('click', activateTriangleTool);
const shapesTool = document.getElementById('shapesTool');

function clearCanvas() {


    const isDarkMode = document.body.classList.contains('dark-mode');

    if (isDarkMode) {
        gl.clearColor(0.133, 0.133, 0.133, 1.0); // Dark grey for dark mode
    } else {
        gl.clearColor(0.961, 0.961, 0.961, 1.0); // Light grey for light mode (245/255)
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    while (strokes.length > 0) {
        strokes.pop();
    }

    // Clear the local canvas
    strokes.length = 0;
    fadeStrokes.length = 0;
    draw();

    // Send the clear action to other connected instances
    const message = JSON.stringify({
        type: 'clear',
        darkMode: isDarkMode // Include the current mode in the message
    });
    console.log('Sending clear action:', message);
    socket.send(message);  // Broadcast the clear action
}


animationFrameId = requestAnimationFrame(draw_neon);

// Prevent context menu on right-click
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

function eraseStroke(x, y) {
    let erasedAny = false;
    for (let i = strokes.length - 1; i >= 0; i--) {
        const stroke = strokes[i];

        // Check if the stroke is a Shape or a regular Stroke
        if (stroke instanceof Shape) {
            // For shapes, check if the point is inside or very close to the shape
            const [startX, startY] = [stroke.startX, stroke.startY];
            const [endX, endY] = [stroke.endX, stroke.endY];

            switch (stroke.type) {
                case 'rectangle':
                    if (isPointInRectangle(x, y, startX, startY, endX, endY)) {
                        strokes.splice(i, 1);
                        recordAction('remove', stroke); // Record this stroke removal
                        erasedAny = true;
                        return;
                    }
                    break;
                case 'circle':
                    if (isPointInCircle(x, y, startX, startY, endX, endY)) {
                        strokes.splice(i, 1);
                        recordAction('remove', stroke); // Record this stroke removal
                        erasedAny = true;
                        return;
                    }
                    break;
                case 'triangle':
                    if (isPointInTriangle(x, y, startX, startY, endX, endY)) {
                        strokes.splice(i, 1);
                        recordAction('remove', stroke); // Record this stroke removal
                        erasedAny = true;
                        return;
                    }
                    break;
            }
        } else {
            // Existing point-based erasing for regular strokes
            const transformedPoints = stroke.getTransformedPoints();
            for (let j = 0; j < transformedPoints.length; j++) {
                const [px, py] = transformedPoints[j];
                const dx = x - px;
                const dy = y - py;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < ERASER_RADIUS) {
                    strokes.splice(i, 1);
                    recordAction('remove', stroke); // Record this stroke removal
                    erasedAny = true;
                    return;
                }
            }
        }

        if (erasedAny) break;
    }
}


function erasePixel(x, y) {
    let erasedAny = false;
    let updatedStrokes = [];

    for (let stroke of strokes) {
        if (!stroke?.points?.length) continue;

        // Use the original stroke size for eraser radius calculation
        // Make sure to store the original size to prevent accumulation
        const originalStrokeSize = stroke.originalStrokeSize || stroke.strokeSize;
        // stroke.originalStrokeSize = originalStrokeSize; // Store for future reference

        const dynamicPixelEraserRadius = PIXEL_ERASER_RADIUS * (originalStrokeSize / 10);

        // Special handling for shapes
        if (stroke.type && ['rectangle', 'circle', 'triangle'].includes(stroke.type)) {
            let keepShape = true;
            const shapePoints = [];

            // Generate points along the shape's border
            switch (stroke.type) {
                case 'rectangle':
                    // Rectangle border points
                    shapePoints.push(
                        [stroke.startX, stroke.startY], // Top-left
                        [stroke.endX, stroke.startY],   // Top-right
                        [stroke.endX, stroke.endY],     // Bottom-right
                        [stroke.startX, stroke.endY],   // Bottom-left
                        [stroke.startX, stroke.startY]  // Back to start
                    );
                    break;

                case 'circle':
                    // Generate points along circle circumference
                    const centerX = (stroke.startX + stroke.endX) / 2;
                    const centerY = (stroke.startY + stroke.endY) / 2;
                    const radius = Math.sqrt(
                        Math.pow(stroke.endX - stroke.startX, 2) +
                        Math.pow(stroke.endY - stroke.startY, 2)
                    ) / 2;

                    for (let angle = 0; angle < 360; angle += 10) {
                        const radian = angle * Math.PI / 180;
                        shapePoints.push([
                            centerX + radius * Math.cos(radian),
                            centerY + radius * Math.sin(radian)
                        ]);
                    }
                    break;

                case 'triangle':
                    // Triangle border points
                    const midX = (stroke.startX + stroke.endX) / 2;
                    shapePoints.push(
                        [midX, stroke.startY],                  // Top
                        [stroke.endX, stroke.endY],             // Bottom-right
                        [stroke.startX, stroke.endY],           // Bottom-left
                        [midX, stroke.startY]                   // Back to top
                    );
                    break;
            }

            // Check if eraser touches any part of the shape's border
            for (let i = 0; i < shapePoints.length - 1; i++) {
                const [x1, y1] = shapePoints[i];
                const [x2, y2] = shapePoints[i + 1];

                const distance = stroke.distanceToLineSegment(x, y, x1, y1, x2, y2);
                if (distance <= dynamicPixelEraserRadius) {
                    keepShape = false;
                    erasedAny = true;
                    break;
                }
            }

            if (keepShape) {
                updatedStrokes.push(stroke);
            }
            continue;
        }

        // Handle regular strokes
        const transformedPoints = stroke.getTransformedPoints();
        if (!transformedPoints?.length) continue;

        let newSegments = [];
        let currentSegment = [];
        let segmentStarted = false;

        for (let i = 0; i < transformedPoints.length - 1; i++) {
            const [x1, y1] = transformedPoints[i];
            const [x2, y2] = transformedPoints[i + 1];
            const originalPoint = stroke.points[i];
            const nextOriginalPoint = stroke.points[i + 1];

            const distance = stroke.distanceToLineSegment(x, y, x1, y1, x2, y2);

            if (distance > dynamicPixelEraserRadius) {
                if (!segmentStarted) {
                    currentSegment = [originalPoint];
                    segmentStarted = true;
                }
                currentSegment.push(nextOriginalPoint);
            } else {
                erasedAny = true;
                if (segmentStarted && currentSegment.length >= 2) {
                    const newStroke = createStrokeFromPoints(currentSegment, stroke);
                    if (newStroke) {
                        // Preserve the current stroke sizes
                        newStroke.initialStrokeSize = stroke.initialStrokeSize;
                        newStroke.strokeSize = stroke.strokeSize;
                        newStroke.renderStrokeSize = stroke.renderStrokeSize;
                        newSegments.push(newStroke);
                    }
                }
                currentSegment = [];
                segmentStarted = false;
            }
        }

        // Handle final segment
        if (segmentStarted && currentSegment.length >= 2) {
            const newStroke = createStrokeFromPoints(currentSegment, stroke);
            if (newStroke) {
                newStroke.initialStrokeSize = stroke.initialStrokeSize;
                newStroke.strokeSize = stroke.strokeSize;
                newStroke.renderStrokeSize = stroke.renderStrokeSize;

                newSegments.push(newStroke);
            }
        }

        if (newSegments.length === 0 && !erasedAny) {
            updatedStrokes.push(stroke);
        } else {
            updatedStrokes.push(...newSegments);
        }
    }

    if (erasedAny) {
        strokes = updatedStrokes;
        recordAction('modify', strokes);
        requestAnimationFrame(draw);
    }

    return erasedAny;
}

// Helper function to create a new stroke from a list of points
function createStrokeFromPoints(points, originalStroke) {
    if (!points || points.length === 0) return null; // Return null if points array is empty

    const newStroke = new Stroke();
    newStroke.points = points;
    newStroke.color = originalStroke.color;
    newStroke.scale = originalStroke.scale;
    newStroke.strokeSize = originalStroke.strokeSize; // Add this line
    newStroke.rotation = originalStroke.rotation;
    newStroke.translationX = originalStroke.translationX;
    newStroke.translationY = originalStroke.translationY;
    return newStroke;
}


function createStrokeFromPoints(points, originalStroke) {
    if (!points || points.length === 0) return null; // Return null if points array is empty

    const newStroke = new Stroke();
    newStroke.points = points;
    newStroke.color = originalStroke.color;
    newStroke.scale = originalStroke.scale;
    newStroke.strokeSize = originalStroke.strokeSize;
    newStroke.rotation = originalStroke.rotation;
    newStroke.translationX = originalStroke.translationX;
    newStroke.translationY = originalStroke.translationY;
    return newStroke;
}

// Helper functions for shape-based erasing
function isPointInRectangle(x, y, startX, startY, endX, endY) {
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    return x >= minX && x <= maxX && y >= minY && y <= maxY;
}

function isPointInCircle(x, y, startX, startY, endX, endY) {
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const radiusX = Math.abs(endX - startX) / 2;
    const radiusY = Math.abs(endY - startY) / 2;

    // Ellipse point-in-shape test
    const dx = (x - centerX) / radiusX;
    const dy = (y - centerY) / radiusY;
    return dx * dx + dy * dy <= 1;
}

function isPointInTriangle(x, y, startX, startY, endX, endY) {
    const midX = (startX + endX) / 2;
    const thirdPointY = endY;

    // Simple triangle hit test using barycentric coordinates
    const dX1 = startX - midX;
    const dY1 = startY - thirdPointY;
    const dX2 = endX - midX;
    const dY2 = startY - thirdPointY;
    const dX3 = x - midX;
    const dY3 = y - thirdPointY;

    const det = dX1 * dY2 - dX2 * dY1;
    const a = (dX3 * (dY2 - dY1) + dX1 * dY3 - dX2 * dY1) / det;
    const b = (dX1 * dY3 - dX3 * dY1) / det;
    const c = 1 - a - b;

    return a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1;
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
const pixelEraserTool = document.getElementById("pixelEraserTool");
const neonPenTool = document.getElementById("neonPenTool");
const selectionTool = document.getElementById("selectionTool");
const brushColorPicker = document.getElementById("brushColor");
const clearTool = document.getElementById("clearTool");
const setBackgroundTool = document.getElementById("setBackgroundTool");
const undoTool = document.getElementById("UndoTool")
const redoTool = document.getElementById("RedoTool")
const strokeSizeSlider = document.getElementById("strokeSizeSlider");
const strokeSizeValue = document.getElementById("strokeSizeValue");

strokeSizeSlider.addEventListener("input", () => {
    const newStrokeSize = parseFloat(strokeSizeSlider.value);
    strokeSize = newStrokeSize;
    strokeSizeValue.textContent = strokeSize;

    // Update all existing strokes
    strokes.forEach(stroke => {
        stroke.updateStrokeSize(newStrokeSize);
    });


    // If you have a current stroke being drawn, update its stroke size
    if (currentStroke) {
        currentStroke.updateStrokeSize(newStrokeSize);
    }


    requestAnimationFrame(() => {
        draw();
        if (isNeonPenActive) draw_neon();
    });
});

function updateToolIconBackground(toolElement, color) {
    toolElement.style.backgroundColor = color;
}

function getPencilCursor(color) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="${encodeURIComponent(color)}"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="${encodeURIComponent(color)}"/></svg>`;
}


// const pencilTool = document.getElementById('pencilTool');
const strokeSizeContainer = document.querySelector('.stroke-size-container');
const colorPicker = document.querySelector('.color-picker-container');

// Initial positioning and visibility
function positionStrokeSizeContainer() {
    strokeSizeContainer.style.position = 'absolute';
    strokeSizeContainer.style.left = `${colorPicker.offsetLeft + 80}px`; // Move more to the right
    strokeSizeContainer.style.top = `${colorPicker.offsetTop + colorPicker.offsetHeight + 10}px`;
    strokeSizeContainer.style.zIndex = '1001';
}

// document.addEventListener('DOMContentLoaded', showInitialStrokeSize);

// const pencilTool = document.getElementById('pencilTool');

pencilTool.addEventListener("click", () => {
    if (isPencilActive) {
        isPencilActive = false;
        pencilTool.classList.remove("active");
        pencilTool.style.backgroundColor = ""; // Reset background color
        canvas.style.cursor = "default";
        strokeSizeContainer.style.display = 'none';
        // selectedStroketrokeSizeContainer.style.display = 'none';
    } else {
        isPencilActive = true;
        isEraserActive = false;
        isPixelEraserActive = false;
        isNeonPenActive = false;
        isSelectionActive = false;
        isShapeToolActive = false;
        isTextToolActive = false;
        pencilTool.classList.add("active");
        eraserTool.classList.remove("active");
        pixelEraserTool.classList.remove("active");
        neonPenTool.classList.remove("active");
        selectionTool.classList.remove("active");
        setBackgroundTool.classList.remove("active");
        hideTextOverlay();
        updateToolIconBackground(pencilTool, brushColorPicker.value); // Set active color
        eraserTool.style.backgroundColor = ""; // Reset eraser background color
        pixelEraserTool.style.backgroundColor = ""; // Reset eraser background color
        neonPenTool.style.backgroundColor = ""; // Reset neon-pen background color
        selectionTool.style.backgroundColor = ""; // Reset select tool background color
        canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;
        positionStrokeSizeContainer();
        strokeSizeContainer.style.display = 'none';
    }
});


strokeSizeContainer.addEventListener('mouseenter', () => {
    if (isPencilActive) {
        strokeSizeContainer.style.display = 'flex';
    }
});

strokeSizeContainer.addEventListener('mouseleave', () => {
    if (isPencilActive) {
        strokeSizeContainer.style.display = 'none';
    }
});

// Hover handling for pencil tool
pencilTool.addEventListener('mouseenter', () => {
    if (isPencilActive) {
        positionStrokeSizeContainer();
        strokeSizeContainer.style.display = 'flex';
    }
});

pencilTool.addEventListener('mouseleave', () => {
    if (isPencilActive) {
        strokeSizeContainer.style.display = 'none';
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
        isPixelEraserActive = false;
        isPencilActive = false;
        isNeonPenActive = false;
        isSelectionActive = false;
        isShapeToolActive = false;
        isTextToolActive = false;
        eraserTool.classList.add("active");
        pixelEraserTool.classList.remove("active");
        pencilTool.classList.remove("active");
        neonPenTool.classList.remove("active");
        selectionTool.classList.remove("active");
        setBackgroundTool.classList.remove("active");
        shapesTool.classList.remove("active");
        hideTextOverlay();
        pencilTool.style.backgroundColor = ""; // Reset pencil background color
        pixelEraserTool.style.backgroundColor = ""; // Reset pencil background color
        neonPenTool.style.backgroundColor = ""; // Reset neon-pen background color
        selectionTool.style.backgroundColor = ""; // Reset pencil background color
        // canvas.style.cursor = "not-allowed";
        canvas.style.cursor = `url('${eraserCursor}') 16 16, auto`;

    }
});

pixelEraserTool.addEventListener("click", () => {
    if (isPixelEraserActive) {
        isPixelEraserActive = false;
        pixelEraserTool.classList.remove("active");
        pixelEraserTool.style.backgroundColor = ""; // Reset background color
        canvas.style.cursor = "default";
    } else {
        isPixelEraserActive = true;
        isEraserActive = false;
        isPencilActive = false;
        isNeonPenActive = false;
        isSelectionActive = false;
        isShapeToolActive = false;
        isTextToolActive = false;
        pixelEraserTool.classList.add("active");
        eraserTool.classList.remove("active");
        pencilTool.classList.remove("active");
        neonPenTool.classList.remove("active");
        selectionTool.classList.remove("active");
        setBackgroundTool.classList.remove("active");
        shapesTool.classList.remove("active");
        hideTextOverlay();
        pencilTool.style.backgroundColor = ""; // Reset pencil background color
        eraserTool.style.backgroundColor = ""; // Reset pencil background color
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
        isPixelEraserActive = false;
        isPencilActive = false;
        isSelectionActive = false;
        isShapeToolActive = false;
        isTextToolActive = false;
        neonPenTool.classList.add("active");
        pencilTool.classList.remove("active");
        eraserTool.classList.remove("active");
        pixelEraserTool.classList.remove("active");
        selectionTool.classList.remove("active");
        setBackgroundTool.classList.remove("active");
        shapesTool.classList.remove("active");
        hideTextOverlay();
        pencilTool.style.backgroundColor = ""; // Reset pencil background color
        eraserTool.style.backgroundColor = ""; // Reset eraser background color
        pixelEraserTool.style.backgroundColor = ""; // Reset eraser background color
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
        isPixelEraserActive = false;
        isNeonPenActive = false;
        isPencilActive = false;
        isShapeToolActive = false;
        isTextToolActive = false;
        selectionTool.classList.add("active");
        eraserTool.classList.remove("active");
        pixelEraserTool.classList.remove("active");
        neonPenTool.classList.remove("active");
        pencilTool.classList.remove("active");
        setBackgroundTool.classList.remove("active");
        shapesTool.classList.remove("active");
        hideTextOverlay();
        eraserTool.style.backgroundColor = ""; // Reset eraser background color
        pixelEraserTool.style.backgroundColor = ""; // Reset eraser background color
        neonPenTool.style.backgroundColor = ""; // Reset neon-pen background color
        pencilTool.style.backgroundColor = ""; // Reset pencil background color
        //canvas.style.cursor = "cursor";
        canvas.style.cursor = 'move';
    }
});

// First, modify deactivateOtherTools to also reset shape-related variables
function deactivateOtherTools() {
    isPencilActive = false;
    isEraserActive = false;
    isSelectionActive = false;
    isNeonPenActive = false;
    isTextToolActive = false;
    isShapeToolActive = false;  // Reset shape tool active state
    hideTextOverlay();
    currentShape = null;        // Reset current shape
    document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.shape-button').forEach(btn => btn.classList.remove('shape-active'));
    
}



// Update the shape tool activation functions
function activateRectangleTool() {
    deactivateOtherTools();
    isShapeToolActive = true;
    currentShape = 'rectangle';
    canvas.style.cursor = 'crosshair';
    document.getElementById('circleTool').classList.remove('active');
    document.getElementById('triangleTool').classList.remove('active');
    document.getElementById('rectangleTool').classList.add('active');
    document.getElementById('rectangleTool').classList.add('shape-active');
}

function activateCircleTool() {
    deactivateOtherTools();
    isShapeToolActive = true;
    currentShape = 'circle';
    canvas.style.cursor = 'crosshair';
    document.getElementById('triangleTool').classList.remove('active');
    document.getElementById('rectangleTool').classList.remove('active');
    
    document.getElementById('circleTool').classList.add('active');
    document.getElementById('circleTool').classList.add('shape-active');
}

function activateTriangleTool() {
    deactivateOtherTools();
    isShapeToolActive = true;
    currentShape = 'triangle';
    canvas.style.cursor = 'crosshair';
    document.getElementById('rectangleTool').classList.remove('active');
    document.getElementById('circleTool').classList.remove('active');
    document.getElementById('triangleTool').classList.add('active');
    document.getElementById('triangleTool').classList.add('shape-active');
}


//Shapes Dropdown
function toggleShapesDropdown() {


    const dropdown = document.getElementById('shapesDropdown');
    shapesTool.classList.add("active");
    selectionTool.classList.remove("active");
    eraserTool.classList.remove("active");
    neonPenTool.classList.remove("active");
    pencilTool.classList.remove("active");
    
    eraserTool.style.backgroundColor = ""; // Reset eraser background color
    neonPenTool.style.backgroundColor = ""; // Reset neon-pen background color
    pencilTool.style.backgroundColor = ""; // Reset pencil background color
    canvas.style.cursor = "default";
    dropdown.classList.toggle('show');

    // Close dropdown when clicking outside
    document.addEventListener('click', function closeDropdown(e) {
        if (!e.target.matches('#shapesTool') && !e.target.matches('.shape-option')) {
            dropdown.classList.remove('show');
            shapesTool.classList.remove("active");
            document.removeEventListener('click', closeDropdown);
            
            
        }
    });
}

// Listen to color picker changes to update the pencil tool background color
brushColorPicker.addEventListener("input", () => {
    if (isPencilActive) {
        updateToolIconBackground(pencilTool, brushColorPicker.value); // Update pencil icon color
        canvas.style.cursor = `url('${getPencilCursor(brushColorPicker.value)}') 0 24, auto`;

    }
});

const defaultColors = [
    '#000000', // Black
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00'  // Yellow
];

const colorPickerIcon = document.getElementById('colorPickerIcon');
const brushColor = document.getElementById('brushColor');
const colorPalette = document.getElementById('colorPalette');

// Create custom color picker button
const customPickerSwatch = document.createElement('div');
customPickerSwatch.className = 'color-swatch custom-picker';
customPickerSwatch.addEventListener('click', () => {
    brushColor.click();
});

// Create color swatches
defaultColors.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;

    swatch.addEventListener('click', () => {
        brushColor.value = color;
        brushColor.dispatchEvent(new Event('input'));
        updateSelectedSwatch(color);
        colorPickerIcon.style.backgroundColor = color;
    });

    colorPalette.appendChild(swatch);
});

// Add custom color picker swatch at the end
colorPalette.appendChild(customPickerSwatch);

// Toggle color palette
colorPickerIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    colorPalette.classList.toggle('show');
});

// Close palette when clicking outside
document.addEventListener('click', (e) => {
    if (!colorPickerIcon.contains(e.target) && !colorPalette.contains(e.target)) {
        colorPalette.classList.remove('show');
    }
});

// Update selected swatch
function updateSelectedSwatch(color) {
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        if (swatch.classList.contains('custom-picker')) return;
        const swatchColor = rgb2hex(swatch.style.backgroundColor).toUpperCase();
        swatch.classList.toggle('selected', swatchColor === color.toUpperCase());
    });
}

// Handle color picker changes
brushColor.addEventListener('input', () => {
    const selectedColor = brushColor.value;
    colorPickerIcon.style.backgroundColor = selectedColor;
    updateSelectedSwatch(selectedColor);

    if (isPencilActive) {
        updateToolIconBackground(pencilTool, selectedColor);
        canvas.style.cursor = `url('${getPencilCursor(selectedColor)}') 0 24, auto`;
    }
});

// Initialize with default color
colorPickerIcon.style.backgroundColor = brushColor.value;

// Helper function to convert RGB to HEX
function rgb2hex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#000000';
    return '#' + rgbValues.map(x => {
        const hex = parseInt(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

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

// Function to toggle the background selector dropdown
function toggleBackgroundSelector() {
    const dropdown = document.getElementById('backgroundDropdown');
    dropdown.style.display = (dropdown.style.display === 'none' || dropdown.style.display === '') ? 'flex' : 'none';
}

// Function to close the background selector dropdown
function closeBackgroundSelector(event) {
    const dropdown = document.getElementById('backgroundDropdown');
    // Check if the click target is outside the dropdown and the set background tool
    if (dropdown.style.display === 'flex' &&
        !dropdown.contains(event.target) &&
        event.target.id !== 'setBackgroundTool') {
        dropdown.style.display = 'none'; // Close the dropdown
        setBackgroundTool.classList.remove("active");
    }
}


canvas.addEventListener('click', closeBackgroundSelector);

// Optional: To close the dropdown when clicking outside of it
document.addEventListener('click', closeBackgroundSelector);



setBackgroundTool.addEventListener("click", () => {

    const dropdown = document.getElementById('backgroundDropdown');

    if (dropdown.style.display === 'flex') {
        setBackgroundTool.classList.add("active");

    }
    else {
        setBackgroundTool.classList.remove("active");

    }

});


undoTool.addEventListener("mousedown", () => {
    // Add 'active' class to simulate a button press
    undoTool.classList.add("active");

    undo();
});

undoTool.addEventListener("mouseup", () => {
    // Remove 'active' class when mouse button is released
    undoTool.classList.remove("active");
});

// Optional: Also handle mouseleave to ensure the button is deactivated
// if the user releases the mouse button outside of the image
undoTool.addEventListener("mouseleave", () => {
    undoTool.classList.remove("active");
});

redoTool.addEventListener("mousedown", () => {
    // Add 'active' class to simulate a button press
    redoTool.classList.add("active");

    redo();
});

redoTool.addEventListener("mouseup", () => {
    // Remove 'active' class when mouse button is released
    redoTool.classList.remove("active");
});

// Optional: Also handle mouseleave to ensure the button is deactivated
// if the user releases the mouse button outside of the image
redoTool.addEventListener("mouseleave", () => {
    redoTool.classList.remove("active");
});


let isCurrentlyDownloading = false; // Global flag to track ongoing downloads


function exportAsImage(format) {
    // Check if canvas is empty
    if (strokes.length === 0) {
        alert("The canvas is empty! Please draw something before downloading.");
        return;
    }

    // Check if there's already a download in progress
    if (isCurrentlyDownloading) {
        alert("Please wait for the current download to complete before starting another one.");
        return;
    }

    isCurrentlyDownloading = true;
    console.log(`exportAs${format.toUpperCase()} function called`);

    // Force a redraw of the WebGL canvas
    draw();
    if (typeof draw_neon === 'function') {
        draw_neon();
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = gl.canvas.width;
    tempCanvas.height = gl.canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Read pixels from WebGL context
    const pixels = new Uint8Array(gl.canvas.width * gl.canvas.height * 4);
    gl.readPixels(
        0,
        0,
        gl.canvas.width,
        gl.canvas.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels
    );

    // Create ImageData object
    const imageData = new ImageData(
        new Uint8ClampedArray(pixels),
        gl.canvas.width,
        gl.canvas.height
    );

    // Put the WebGL pixels on the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);

    // Flip the WebGL content vertically (WebGL Y-coordinate is inverted)
    tempCtx.save();
    tempCtx.scale(1, 1);
    tempCtx.drawImage(gl.canvas, 0, 0);
    tempCtx.restore();

    // Create a download link
    const link = document.createElement("a");
    link.download = `whiteboard.${format}`;

    try {
        switch (format.toLowerCase()) {
            case "png":
                link.href = tempCanvas.toDataURL("image/png", 1.0);
                break;
            case "jpeg":
            case "jpg":
                link.href = tempCanvas.toDataURL("image/jpeg", 1.0);
                break;
            case "svg":
                const svgCanvas = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                svgCanvas.setAttribute("width", tempCanvas.width);
                svgCanvas.setAttribute("height", tempCanvas.height);

                const foreignObject = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
                foreignObject.setAttribute("width", tempCanvas.width);
                foreignObject.setAttribute("height", tempCanvas.height);
                foreignObject.setAttribute("transform", `scale(1, -1) translate(0, -${tempCanvas.height})`);

                const canvasData = tempCanvas.toDataURL("image/png");
                foreignObject.innerHTML = `<img src="${canvasData}" width="${tempCanvas.width}" height="${tempCanvas.height}" />`;
                svgCanvas.appendChild(foreignObject);

                const svgBlob = new Blob([new XMLSerializer().serializeToString(svgCanvas)], { type: "image/svg+xml;charset=utf-8" });
                link.href = URL.createObjectURL(svgBlob);
                break;
            case "pdf":
                // Create new jsPDF instance
                const pdf = new jspdf.jsPDF({
                    orientation: "landscape",
                    unit: "px",
                    format: [tempCanvas.width, tempCanvas.height]
                });

                // Flip the temporary canvas vertically
                const flippedCanvas = document.createElement("canvas");
                flippedCanvas.width = tempCanvas.width;
                flippedCanvas.height = tempCanvas.height;
                const flippedCtx = flippedCanvas.getContext("2d");

                flippedCtx.fillStyle = "#FFFFFF";
                flippedCtx.fillRect(0, 0, flippedCanvas.width, flippedCanvas.height);

                flippedCtx.translate(0, tempCanvas.height);
                flippedCtx.scale(1, -1);
                flippedCtx.drawImage(tempCanvas, 0, 0);

                const canvasDataURL = flippedCanvas.toDataURL("image/jpeg", 1.0);

                const imgProps = pdf.getImageProperties(canvasDataURL);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);

                pdf.addImage(
                    canvasDataURL,
                    "JPEG",
                    0,
                    0,
                    imgProps.width * ratio,
                    imgProps.height * ratio
                );

                pdf.save("whiteboard.pdf");
                break;
            default:
                console.error("Invalid format specified");
                isCurrentlyDownloading = false;
                return;
        }

        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log(`Download as ${format} triggered`);
    } catch (error) {
        console.error("Error during export:", error);
        alert("An error occurred while downloading the file. Please try again.");
    } finally {
        // Reset the downloading flag after a short delay to prevent rapid consecutive downloads
        setTimeout(() => {
            isCurrentlyDownloading = false;
        }, 1000);
    }
}

document.addEventListener("DOMContentLoaded", (event) => {
    const exportButton = document.getElementById("exportButton");
    if (exportButton) {
        console.log("Export button found");

        exportButton.addEventListener("click", () => {
            const exportDropdown = document.createElement("div");
            exportDropdown.classList.add("export-dropdown");

            const exportOptions = [
                { label: "PNG", format: "png" },
                { label: "SVG", format: "svg" },
                { label: "JPEG", format: "jpeg" },
                { label: "PDF", format: "pdf" },
            ];

            exportOptions.forEach((option) => {
                const optionElement = document.createElement("div");
                optionElement.classList.add("export-option");
                optionElement.textContent = option.label;
                optionElement.addEventListener("click", () => {
                    exportAsImage(option.format);
                });
                exportDropdown.appendChild(optionElement);
            });

            exportButton.parentNode.appendChild(exportDropdown);
            exportDropdown.classList.add("show");
        });
    } else {
        console.log("Export button not found");
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const toolContainers = document.querySelectorAll('.tool-container');

    toolContainers.forEach(container => {
        let timeoutId;
        const tooltip = container.querySelector('.tooltip');

        container.addEventListener('mouseenter', () => {
            // Clear any existing timeout
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            // Reset the animation
            tooltip.style.animation = 'none';
            tooltip.offsetHeight; // Trigger reflow
            tooltip.style.animation = 'showHideTooltip 1s ease-in-out forwards';

            // Set timeout to hide tooltip
            timeoutId = setTimeout(() => {
                tooltip.style.visibility = 'hidden';
                tooltip.style.opacity = '0';
            }, 500);
        });

        container.addEventListener('mouseleave', () => {
            // Clear the timeout when mouse leaves
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        });
    });
})

// Get references to the elements
const exportButton = document.getElementById('exportButton');
const exportDropdown = document.querySelector('.export-dropdown');

// Toggle dropdown when clicking the export button
exportButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent this click from being caught by the document listener
    exportDropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!exportButton.contains(e.target) && !exportDropdown.contains(e.target)) {
        exportDropdown.classList.remove('show');
    }
});

// Close dropdown after clicking an option
const exportOptions = document.querySelectorAll('.export-option');
exportOptions.forEach(option => {
    option.addEventListener('click', () => {
        exportDropdown.classList.remove('show');
    });
});
// Dark mode toggle functionality
const body = document.body;
const lightModeToggle = document.getElementById('lightModeTool');
const darkModeToggle = document.getElementById('darkModeTool');

function enableDarkMode() {
    body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
    lightModeToggle.style.display = 'inline-block'; // Show light mode icon in dark mode
    darkModeToggle.style.display = 'none';
}

function disableDarkMode() {
    body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', null);
    lightModeToggle.style.display = 'none';
    darkModeToggle.style.display = 'inline-block'; // Show dark mode icon in light mode
}

// Check for saved user preference
if (localStorage.getItem('darkMode') === 'enabled') {
    enableDarkMode();
} else {
    disableDarkMode();
}

darkModeToggle.addEventListener('click', () => {
    enableDarkMode();
    socket.send(JSON.stringify({ type: 'modeChange', darkMode: true }));
});

lightModeToggle.addEventListener('click', () => {
    disableDarkMode();
    socket.send(JSON.stringify({ type: 'modeChange', darkMode: false }));
});

// Function to update WebGL clear color based on mode
function updateClearColor() {
    if (body.classList.contains('dark-mode')) {
        gl.clearColor(0.133, 0.133, 0.133, 1.0); // Dark grey for dark mode
    } else {
        gl.clearColor(0.961, 0.961, 0.961, 1.0); // Light grey for light mode
    }
    draw(); // Redraw the canvas with the new background color
}

// Update clear color when toggling dark mode
darkModeToggle.addEventListener('click', updateClearColor);
lightModeToggle.addEventListener('click', updateClearColor);

// Initial clear color setup
updateClearColor();

