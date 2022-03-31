// global variables
var canvas = null;
var gl = null; // webgl context
var bFullscreen = false;
var canvas_original_width;
var canvas_original_height;

const WebGLMacros = // when whole 'WebGLMacros' is 'const', all inside it are automatically 'const'
{
VDG_ATTRIBUTE_VERTEX:0,
VDG_ATTRIBUTE_COLOR:1,
VDG_ATTRIBUTE_NORMAL:2,
VDG_ATTRIBUTE_TEXTURE0:3,
};

var vertexShaderObject;
var fragmentShaderObject;
var shaderProgramObject;

var vaoSqaure;
var vaoTriangle;
var vboPosition;
var vboTexture;

var mvpUniform;
var uniform_texture0_sampler;
var uniform_texture1_sampler;

var perspectiveProjectionMatrix;

var pyramidTexture;
var cube1Texture, cube2Texture;

var anglePyramid =0.0;
var angleCube=0.0;

// To start animation : To have requestAnimationFrame() to be called "cross-browser" compatible
var requestAnimationFrame =
window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame;

// To stop animation : To have cancelAnimationFrame() to be called "cross-browser" compatible
var cancelAnimationFrame =
window.cancelAnimationFrame ||
window.webkitCancelRequestAnimationFrame || window.webkitCancelAnimationFrame ||
window.mozCancelRequestAnimationFrame || window.mozCancelAnimationFrame ||
window.oCancelRequestAnimationFrame || window.oCancelAnimationFrame ||
window.msCancelRequestAnimationFrame || window.msCancelAnimationFrame;

// onload function
function main()
{
    // get <canvas> element
    canvas = document.getElementById("amc");
    if(!canvas) {
        console.error("Obtaining Canvas Failed\n");
        return;
    } 
    console.log("Obtaining Canvas Succeeded\n");
    

    canvas_original_width = canvas.width;
    canvas_original_height = canvas.height;
    
    // register keyboard's keydown event handler
    window.addEventListener("keydown", keyDown, false);
    window.addEventListener("click", mouseDown, false);
    window.addEventListener("resize", resize, false);

    // initialize WebGL
    init();
    
    // start drawing here as warming-up
    resize();
    draw();
}

function init()
{
    // code
    // get WebGL 2.0 context
    gl = canvas.getContext("webgl2");
    if(gl == null) // failed to get context
    {
        console.error("Failed to get the rendering context for WebGL");
        return;
    } 
    console.log("obtained context successfully");
    
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    
    // vertex shader
    var vertexShaderSourceCode =
    "#version 300 es" +
    "\n" +
    "in vec4 vPosition;" +
    "in vec2 vTexture0_Coord;" +
    "out vec2 out_texture0_coord;" +
    "uniform mat4 u_mvp_matrix;" +
    "void main(void)"+
    "{"+
        "gl_Position = u_mvp_matrix * vPosition;"+
        "out_texture0_coord = vTexture0_Coord;" +
    "}";
    vertexShaderObject = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShaderObject, vertexShaderSourceCode);
    gl.compileShader(vertexShaderObject);
    if(gl.getShaderParameter(vertexShaderObject, gl.COMPILE_STATUS) == false)
    {
        var error = gl.getShaderInfoLog(vertexShaderObject);
        if(error.length > 0)
        {
            alert(error);
            uninitialize();
        }
    }
    
    // fragment shader
    var fragmentShaderSourceCode =
    "#version 300 es"+
    "\n"+
    "precision highp float;"+
    "in vec2 out_texture0_coord;" +
    "uniform highp sampler2D u_texture0_sampler;" +
    "out vec4 FragColor;"+
    "void main(void)"+
    "{"+
        "FragColor = texture(u_texture0_sampler, out_texture0_coord);"+
    "}";
    fragmentShaderObject = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderObject, fragmentShaderSourceCode);
    gl.compileShader(fragmentShaderObject);
    if(gl.getShaderParameter(fragmentShaderObject, gl.COMPILE_STATUS) == false)
    {
        var error = gl.getShaderInfoLog(fragmentShaderObject);
        if(error.length > 0)
        {
            alert(error);
            uninitialize();
        }
    }
    
    // shader program
    shaderProgramObject=gl.createProgram();
    gl.attachShader(shaderProgramObject, vertexShaderObject);
    gl.attachShader(shaderProgramObject, fragmentShaderObject);
    
    // pre-link binding of shader program object with vertex shader attributes
    gl.bindAttribLocation(shaderProgramObject, WebGLMacros.VDG_ATTRIBUTE_VERTEX, "vPosition");
    gl.bindAttribLocation(shaderProgramObject, WebGLMacros.VDG_ATTRIBUTE_TEXTURE0, "vTexture0_Coord");

    // linking
    gl.linkProgram(shaderProgramObject);
    if (!gl.getProgramParameter(shaderProgramObject, gl.LINK_STATUS))
    {
        var error=gl.getProgramInfoLog(shaderProgramObject);
        if(error.length > 0)
        {
            alert(error);
            uninitialize();
        }
    }

    // get MVP uniform location
    mvpUniform = gl.getUniformLocation(shaderProgramObject, "u_mvp_matrix");
    uniform_texture0_sampler = gl.getUniformLocation(shaderProgramObject,"u_texture0_sampler");
    uniform_texture1_sampler = gl.getUniformLocation(shaderProgramObject,"u_texture1_sampler");
    
    // vertices, colors, shader attribs, vbo, vao initializations
    var squareVertices = new Float32Array([
        1.0, 1.0, -1.0, // TOP
        - 1.0, 1.0, -1.0,
        - 1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,

        1.0, -1.0, -1.0, // bottom
        - 1.0, -1.0, -1.0,
        - 1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,

        1.0, 1.0, 1.0, // front
        - 1.0, 1.0, 1.0,
        - 1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,

        1.0, 1.0, -1.0, // back
        - 1.0, 1.0, -1.0,
        - 1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,

        1.0, 1.0, -1.0, // right
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, -1.0, -1.0,

        -1.0, 1.0, -1.0, // left
        - 1.0, 1.0, 1.0,
        - 1.0, -1.0, 1.0,
        - 1.0, -1.0, -1.0
    ]);

    vaoSqaure = gl.createVertexArray();
    gl.bindVertexArray(vaoSqaure);
    
    vboPosition = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vboPosition);
    gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(WebGLMacros.VDG_ATTRIBUTE_VERTEX,
                           3, 
                           gl.FLOAT,
                           false, 0 ,0);
    gl.enableVertexAttribArray(WebGLMacros.VDG_ATTRIBUTE_VERTEX);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
   
    // vertices, colors, shader attribs, vbo, vao initializations
    var squareTextureCords = new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
        
        0.0, 0.0,
        0.0, 0.0,
        0.0, 0.0,
        0.0, 0.0,

        0.0, 1.0,
        1.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,

        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        
        1.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ]);
    
    vboTexture = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vboTexture);
    gl.bufferData(gl.ARRAY_BUFFER, squareTextureCords, gl.STATIC_DRAW);
    gl.vertexAttribPointer(WebGLMacros.VDG_ATTRIBUTE_TEXTURE0,
                            2, 
                            gl.FLOAT,
                            false, 0 ,0);
    gl.enableVertexAttribArray(WebGLMacros.VDG_ATTRIBUTE_TEXTURE0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindVertexArray(null);   
    
    cube1Texture = gl.createTexture();
    cube1Texture.image = new Image();
    cube1Texture.image.src = "1.jpg";
    cube1Texture.image.onload = function ()
    {
        gl.bindTexture(gl.TEXTURE_2D, cube1Texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cube1Texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };

    cube2Texture = gl.createTexture();
    cube2Texture.image = new Image();
    cube2Texture.image.src = "2.png";
    cube2Texture.image.onload = function ()
    {
        gl.bindTexture(gl.TEXTURE_2D, cube2Texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cube2Texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };

    // set clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // black
    
    // Depth test will always be enabled
    gl.enable(gl.DEPTH_TEST);
    
    // We will always cull back faces for better performance
    //gl.enable(gl.CULL_FACE);
    
    // initialize projection matrix
    perspectiveProjectionMatrix = mat4.create();
}

function resize()
{
    // code
    if(bFullscreen == true)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    else
    {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }
   
    // set the viewport to match
    gl.viewport(0, 0, canvas.width, canvas.height);
    mat4.perspective(perspectiveProjectionMatrix, 45.0, parseFloat(canvas.width) / parseFloat(canvas.height), .001,10);
}

x=0.0
y=0.0
z=-5.0
toggle = false


a = 0
s = 0
d = 0
w = 0

function draw()
{
    // code
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(shaderProgramObject);
    
    // square
    modelViewMatrix = mat4.create();
    modelViewProjectionMatrix = mat4.create();
    var lookAtMatrix=mat4.create();
    let eye=vec3.fromValues(0,0,1);
    let center=vec3.fromValues(-1,0,0);
    let up=vec3.fromValues(0,-0.5,0);
    mat4.lookAt(lookAtMatrix,eye,center,up);

    mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, z]);
    //mat4.rotateX(modelViewMatrix ,modelViewMatrix, degToRad(angleCube));
    mat4.rotateY(modelViewMatrix ,modelViewMatrix, degToRad(angleCube));
    //mat4.rotateZ(modelViewMatrix ,modelViewMatrix, degToRad(angleCube));
    mat4.multiply(modelViewProjectionMatrix,lookAtMatrix, modelViewMatrix);
    mat4.multiply(modelViewProjectionMatrix, perspectiveProjectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(mvpUniform, false, modelViewProjectionMatrix);

    gl.bindVertexArray(vaoSqaure);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);

    gl.bindTexture(gl.TEXTURE_2D, cube1Texture);
    gl.uniform1i(uniform_texture0_sampler, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, 8, 4);

    gl.bindTexture(gl.TEXTURE_2D, cube2Texture);
    gl.uniform1i(uniform_texture0_sampler, 0);
    gl.bindVertexArray(vaoSqaure);
    gl.drawArrays(gl.TRIANGLE_FAN, 12, 4);

    gl.bindVertexArray(null);
    
    gl.useProgram(null);
    
    angleCube = angleCube+0.05;
    if(angleCube >= 360.0)
        angleCube = angleCube-360.0;
    
    if (z < -1)
        z = z + 0.002
    
    // animation loop
    requestAnimationFrame(draw, canvas);
}

function uninitialize()
{
    if(pyramidTexture)
    {
        gl.deleteTexture(pyramidTexture);
        pyramidTexture = 0;
    } 

    if(cube1Texture)
    {
        gl.deleteTexture(cube1Texture);
        cube1Texture = 0;
    } 
    
    // code
    if(vaoTriangle)
    {
        gl.deleteVertexArray(vaoTriangle);
        vaoTriangle = null;
    }

    if(vaoSqaure)
    {
        gl.deleteVertexArray(vaoSqaure);
        vaoSqaure = null;
    }
    
    if(vboPosition)
    {
        gl.deleteBuffer(vboPosition);
        vboPosition = null;
    }

    if(vboTexture)
    {
        gl.deleteBuffer(vboTexture);
        vboTexture = null;
    }

    if(shaderProgramObject)
    {
        if(fragmentShaderObject)
        {
            gl.detachShader(shaderProgramObject, fragmentShaderObject);
            gl.deleteShader(fragmentShaderObject);
            fragmentShaderObject = null;
        }
        
        if(vertexShaderObject)
        {
            gl.detachShader(shaderProgramObject, vertexShaderObject);
            gl.deleteShader(vertexShaderObject);
            vertexShaderObject = null;
        }
        
        gl.deleteProgram(shaderProgramObject);
        shaderProgramObject = null;
    }
}

function toggleFullScreen()
{
    // code
    var fullscreen_element =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement ||
    null;

    // if not fullscreen
    if(fullscreen_element == null)
    {
        if(canvas.requestFullscreen)
            canvas.requestFullscreen();
        else if(canvas.mozRequestFullScreen)
            canvas.mozRequestFullScreen();
        else if(canvas.webkitRequestFullscreen)
            canvas.webkitRequestFullscreen();
        else if(canvas.msRequestFullscreen)
            canvas.msRequestFullscreen();
        bFullscreen = true;
    }
    else // if already fullscreen
    {
        if(document.exitFullscreen)
            document.exitFullscreen();
        else if(document.mozCancelFullScreen)
            document.mozCancelFullScreen();
        else if(document.webkitExitFullscreen)
            document.webkitExitFullscreen();
        else if(document.msExitFullscreen)
            document.msExitFullscreen();
        bFullscreen=false;
    }
}

function keyDown(event)
{
    // code
    switch(event.keyCode)
    {
        case 27: // Escape
            // uninitialize
            uninitialize();
            // close our application's tab
            window.close(); // may not work in Firefox but works in Safari and chrome
            break;
        case 70: // for 'F' or 'f'
            toggleFullScreen();
            break;
        
        case 84: 
            toggle = !toggle 
            break;

        case 88://x
            t = toggle ? 0.005 : -0.005;
            x = x + t;
            break;

        case 89://y
            t = toggle ? 0.005 : -0.005;
            y = y + t;
            break;

        case 90://z
            t = toggle ? 0.005 : -0.005;
            z = z + t;
            break;
    }
}

function mouseDown()
{
    // code
}

function degToRad(degrees)
{
    // code
    return(degrees * Math.PI / 180);
}