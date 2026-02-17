// ========================================
// 3D CUBE WITH WEBGL
// ========================================
function init3DCube() {
    const canvas = document.getElementById('cubeCanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        console.log('WebGL not supported');
        return;
    }

    // Vertex shader
    const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec2 aTextureCoord;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying highp vec2 vTextureCoord;

        void main() {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vTextureCoord = aTextureCoord;
        }
    `;

    // Fragment shader
    const fsSource = `
        varying highp vec2 vTextureCoord;
        uniform sampler2D uSampler;

        void main() {
            gl_FragColor = texture2D(uSampler, vTextureCoord);
        }
    `;

    // Compile shaders
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fsSource, gl.FRAGMENT_SHADER);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(shaderProgram));
        return;
    }

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
        },
    };

    // Cube vertices with texture coordinates
    const positions = [
        // Front
        -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
        // Back
        -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
        // Top
        -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
        // Bottom
        -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
        // Right
         1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
        // Left
        -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1,
    ];

    const textureCoords = [
        // Front
        0, 0,  1, 0,  1, 1,  0, 1,
        // Back
        0, 0,  1, 0,  1, 1,  0, 1,
        // Top
        0, 0,  1, 0,  1, 1,  0, 1,
        // Bottom
        0, 0,  1, 0,  1, 1,  0, 1,
        // Right
        0, 0,  1, 0,  1, 1,  0, 1,
        // Left
        0, 0,  1, 0,  1, 1,  0, 1,
    ];

    const indices = [
        0,  1,  2,      0,  2,  3,    // front
        4,  5,  6,      4,  6,  7,    // back
        8,  9,  10,     8,  10, 11,   // top
        12, 13, 14,     12, 14, 15,   // bottom
        16, 17, 18,     16, 18, 19,   // right
        20, 21, 22,     20, 22, 23,   // left
    ];

    // Create buffers
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // Matrix utilities
    function createMat4() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    function perspective(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, (2 * far * near) * nf, 0
        ]);
    }

    function translate(m, x, y, z) {
        const result = new Float32Array(m);
        result[12] = m[0] * x + m[4] * y + m[8] * z + m[12];
        result[13] = m[1] * x + m[5] * y + m[9] * z + m[13];
        result[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
        result[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
        return result;
    }

    function rotateX(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const result = new Float32Array(m);
        result[4] = m[4] * c + m[8] * s;
        result[5] = m[5] * c + m[9] * s;
        result[6] = m[6] * c + m[10] * s;
        result[7] = m[7] * c + m[11] * s;
        result[8] = m[8] * c - m[4] * s;
        result[9] = m[9] * c - m[5] * s;
        result[10] = m[10] * c - m[6] * s;
        result[11] = m[11] * c - m[7] * s;
        return result;
    }

    function rotateY(m, angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const result = new Float32Array(m);
        result[0] = m[0] * c - m[8] * s;
        result[1] = m[1] * c - m[9] * s;
        result[2] = m[2] * c - m[10] * s;
        result[3] = m[3] * c - m[11] * s;
        result[8] = m[0] * s + m[8] * c;
        result[9] = m[1] * s + m[9] * c;
        result[10] = m[2] * s + m[10] * c;
        result[11] = m[3] * s + m[11] * c;
        return result;
    }

    // Create texture and load image first
    const texture = gl.createTexture();
    const image = new Image();

    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Start rendering only after image loads
        startRendering();
    };

    image.src = 'images/mark-jenkins.jpg';

    let rotation = 0;
    let isRendering = false;

    function render() {
        if (!isRendering) return;

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        const projectionMatrix = perspective(45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);

        let modelViewMatrix = createMat4();
        modelViewMatrix = translate(modelViewMatrix, 0, 0, -6);
        modelViewMatrix = rotateX(modelViewMatrix, rotation * 0.5);
        modelViewMatrix = rotateY(modelViewMatrix, rotation);

        gl.useProgram(programInfo.program);

        // Position
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

        // Texture
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        gl.vertexAttribPointer(programInfo.attribLocations.textureCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);

        // Indices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // Uniforms
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        // Texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

        // Draw
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

        rotation += 0.01;
        requestAnimationFrame(render);
    }

    function startRendering() {
        isRendering = true;
        render();
    }
}
