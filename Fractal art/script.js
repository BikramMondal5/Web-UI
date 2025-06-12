// --- Scene, Camera, and Renderer Setup ---
let scene, camera, renderer;
let particleSystem, particleGeometry;
const particleCount = 50000; // Number of particles
let uniforms;

let mouseX = 0, mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Initialize the scene
function init() {
    scene = new THREE.Scene();

    // Setup camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 2.5;

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // --- Particle System ---
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color = new THREE.Color();

    // Initialize particle positions randomly
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 4;
        positions[i3 + 1] = (Math.random() - 0.5) * 4;
        positions[i3 + 2] = (Math.random() - 0.5) * 4;

        // Initial color
        color.setHSL(Math.random(), 0.7, 0.7);
        colors[i3] = color.r;
        colors[i3 + 1] = color.g;
        colors[i3 + 2] = color.b;

        sizes[i] = Math.random() * 0.05 + 0.01;
    }

    particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // --- Shader Material for Fractal Logic ---
    // The logic is implemented in GLSL (OpenGL Shading Language) for performance.
    // This is a simplified Mandelbox-inspired formula.
    uniforms = {
        time: { value: 1.0 },
        colorA: { value: new THREE.Color(0x7F00FF) }, // Purple
        colorB: { value: new THREE.Color(0x00BFFF) }  // Deep Sky Blue
    };

    const vertexShader = `
        uniform float time;
        attribute float size;
        varying vec3 vColor;

        // A function to create some noise
        float rand(vec2 co){
            return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        void main() {
            vColor = color; // Pass the color attribute to the fragment shader
            vec3 pos = position;

            // --- Fractal Transformation (Mandelbox inspired) ---
            float scale = 2.0;
            float minRadius2 = 0.5;
            float fixedRadius2 = 1.0;
            float timeFactor = sin(time * 0.2) * 0.2 + 1.0;

            // Iterate to create fractal detail
            for (int i = 0; i < 5; i++) {
                // Box fold
                pos.xyz = clamp(pos.xyz, -1.0, 1.0) * 2.0 - pos.xyz;

                // Sphere fold
                float r2 = dot(pos.xyz, pos.xyz);
                if (r2 < minRadius2) {
                    float temp = (fixedRadius2 / minRadius2);
                    pos.xyz *= temp;
                } else if (r2 < fixedRadius2) {
                    float temp = (fixedRadius2 / r2);
                    pos.xyz *= temp;
                }

                // Scale and shift
                pos.xyz = pos.xyz * scale + position * timeFactor;
            }

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = `
        uniform vec3 colorA;
        uniform vec3 colorB;
        varying vec3 vColor;

        void main() {
             // Create a nice circular gradient on each particle
            float strength = distance(gl_PointCoord, vec2(0.5));
            if (strength > 0.5) {
                discard; // make it a circle
            }
            // Mix colors based on the original particle color and uniforms
            gl_FragColor = vec4(mix(colorA, colorB, vColor.r), 1.0 - strength * 2.0);
        }
    `;

    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true,
        vertexColors: true
    });

    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // --- Event Listeners ---
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mousemove', onDocumentMouseMove, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);
    document.addEventListener('touchend', onDocumentTouchEnd, false);
}

// --- Event Handlers ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseDown(event) {
    isMouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function onDocumentMouseMove(event) {
    if (!isMouseDown) return;
    mouseX = event.clientX;
    mouseY = event.clientY;
    targetRotationY += (mouseX - lastMouseX) * 0.01;
    targetRotationX += (mouseY - lastMouseY) * 0.01;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
}

function onDocumentMouseUp() {
    isMouseDown = false;
}

// Touch events for mobile
function onDocumentTouchStart(event) {
    if (event.touches.length === 1) {
        event.preventDefault();
        isMouseDown = true;
        lastMouseX = event.touches[0].pageX;
        lastMouseY = event.touches[0].pageY;
    }
}

function onDocumentTouchMove(event) {
    if (event.touches.length === 1) {
        event.preventDefault();
        mouseX = event.touches[0].pageX;
        mouseY = event.touches[0].pageY;
        targetRotationY += (mouseX - lastMouseX) * 0.01;
        targetRotationX += (mouseY - lastMouseY) * 0.01;
        lastMouseX = mouseX;
        lastMouseY = mouseY;
    }
}

function onDocumentTouchEnd(event) {
    isMouseDown = false;
}


// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;
    uniforms.time.value = time;

    // Smoothly interpolate rotation
    particleSystem.rotation.x += (targetRotationX - particleSystem.rotation.x) * 0.05;
    particleSystem.rotation.y += (targetRotationY - particleSystem.rotation.y) * 0.05;

    // If not being dragged, add a slow, continuous rotation
    if (!isMouseDown) {
        targetRotationY += 0.001;
    }

    // Update colors over time for a dynamic feel
    const hueA = (time * 0.02) % 1;
    const hueB = (hueA + 0.3) % 1;
    uniforms.colorA.value.setHSL(hueA, 0.7, 0.6);
    uniforms.colorB.value.setHSL(hueB, 0.7, 0.6);


    renderer.render(scene, camera);
}

// --- Start everything ---
window.onload = function () {
    init();
    animate();
};