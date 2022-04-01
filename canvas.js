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
var startedSystem = false
var vertexShaderObject;
var fragmentShaderObject;
var shaderProgramObject;

var vaoSqaure;
var vaoTriangle;
var vboPosition;
var vboTexture;
var textureIndex = 0;

var mvpUniform;
var uniform_texture0_sampler;

var perspectiveProjectionMatrix;

var cube1Texture, cube2Texture;
var textures = [
    {"image": "1.jpg", "face": "front"}, {"image": "2.jpg", "face": "back"}, {"image": "3.jpg", "face": "left"}, {"image": "4.jpg", "face": "right"},
    {"image": "5.jpg", "face": "front"},{"image": "10.jpg", "face": "left"}, {"image": "6.jpg", "face": "back"},{"image": "7.jpg", "face": "left"},{"image": "8.jpg", "face": "right"},
    {"image": "9.jpg", "face": "front"},{"image": "11.gif", "face": "back"},
]
const texturesData = []
var angleCube=0.0;
var startScene = false

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
    sounds = document.getElementById("myAudio")
    sounds.onplay = function() {
        console.log("started")
        startedSystem = true
        toggleFullScreen();
    };
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

function increaseIndex(value) {
    var total = (textureIndex+value+3)
    console.log("Current, New Total", textureIndex, total)
    if (total < texturesData.length) {
        textureIndex = textureIndex + value;
        console.log(textureIndex)
    }
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
        
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
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
    
    texturesData.push(getColorTextured("front"))
    texturesData.push(getColorTextured("back"))
    texturesData.push(getColorTextured("left"))
    texturesData.push(getColorTextured("right"))
    textures.forEach(function(value) {
        texturesData.push(getTextAndCords(value.image, value.face))
    });

    // set clear color
     gl.clearColor(143.0/255.0, 148.0/255.0, 149.0/255.0, 1.0);
    
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
        canvas.width = window.innerWidth-300;
        canvas.height = window.innerHeight-300;
    }
    else
    {
        canvas.width = canvas_original_width;
        canvas.height = canvas_original_height;
    }
   
    // set the viewport to match
    gl.viewport(0, 0, canvas.width, canvas.height);
    mat4.perspective(perspectiveProjectionMatrix,45.0, parseFloat(canvas.width) / parseFloat(canvas.height), .001, 100.0);
}

function getTextAndCords(image, index) {
    var cubeTexture = gl.createTexture();
    cubeTexture.image = new Image();
    cubeTexture.image.src = image;
    cubeTexture.image.onload = function ()
    {
        gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeTexture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };

    var position
    switch(index)
    {
        case "front":
            position = [8, 4]
            break;
        case "back":
            position = [12, 4]
            break;
        case "left":
            position = [16, 4]
            break;
        case "right":
            position = [20, 4]
            break;
    }

    return {texture: cubeTexture, cords: position }
}

function getColorTextured(index) {
    whiteTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, whiteTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 64, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(makeWhiteImage()));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    var position
    switch(index)
    {
        case "front":
            position = [8, 4]
            break;
        case "back":
            position = [12, 4]
            break;
        case "left":
            position = [16, 4]
            break;
        case "right":
            position = [20, 4]
            break;
    }

    return {texture: whiteTexture, cords: position }
}

function makeWhiteImage() {
    var i, j, c, heightIndex, widthIndex, postion;
    var checkImageWidth, checkImageHeight;
    var checkImage;

    checkImageWidth = 64;
    checkImageHeight = 64;
    checkImage = [checkImageWidth * checkImageWidth];

    for (i = 0; i < checkImageHeight; i++)
	{
		heightIndex = i * checkImageWidth * 4;
        for (j = 0; j < checkImageWidth; j++)
		{
			widthIndex = j * 4;
			postion = heightIndex + widthIndex;

			c = 255;

			checkImage[postion + 0] = c;
			checkImage[postion + 1] = c;
			checkImage[postion + 2] = c;
			checkImage[postion + 3] = 255;
		}
    }
    
    return checkImage;
}

toggle = false
x=0.0
y=-2.5
z=-5.0
aa=0
ss=0.8450000000000009
dd=1

yLimit1=-0.11000000000003118
yLimit2=0.5650000000000004
zLimit=0.03699999999967128
ssLimit1=-0.3590000000000001

function draw()
{
    // code
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(startedSystem == false) {
        requestAnimationFrame(draw, canvas);
        return
    }

    gl.useProgram(shaderProgramObject);
    
    // square
    modelViewMatrix = mat4.create();
    var lookAtMatrix = mat4.create();
    let eye = vec3.fromValues(aa, ss, dd);
    let center = vec3.fromValues(0,0,0);
    let up = vec3.fromValues(0,1,0);
    mat4.lookAt(lookAtMatrix, eye, center, up);

    mat4.translate(modelViewMatrix, modelViewMatrix, [x, y, z]);
    //mat4.rotateX(modelViewMatrix ,modelViewMatrix, degToRad(angleCube));
    mat4.rotateY(modelViewMatrix ,modelViewMatrix, degToRad(angleCube));
    //mat4.rotateZ(modelViewMatrix ,modelViewMatrix, degToRad(angleCube));
    mat4.multiply(modelViewMatrix, lookAtMatrix, modelViewMatrix);
    mat4.multiply(modelViewMatrix, perspectiveProjectionMatrix, modelViewMatrix);
    gl.uniformMatrix4fv(mvpUniform, false, modelViewMatrix);

    gl.bindVertexArray(vaoSqaure);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    gl.drawArrays(gl.TRIANGLE_FAN, 4, 4);

    gl.bindTexture(gl.TEXTURE_2D, texturesData[textureIndex+3].texture);
    gl.uniform1i(uniform_texture0_sampler, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, texturesData[textureIndex+3].cords[0], texturesData[textureIndex+3].cords[1]);

    gl.bindTexture(gl.TEXTURE_2D, texturesData[textureIndex+2].texture);
    gl.uniform1i(uniform_texture0_sampler, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, texturesData[textureIndex+2].cords[0], texturesData[textureIndex+2].cords[1]);

    gl.bindTexture(gl.TEXTURE_2D, texturesData[textureIndex+1].texture);
    gl.uniform1i(uniform_texture0_sampler, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, texturesData[textureIndex+1].cords[0], texturesData[textureIndex+1].cords[1]);

    gl.bindTexture(gl.TEXTURE_2D, texturesData[textureIndex+0].texture);
    gl.uniform1i(uniform_texture0_sampler, 0);
    gl.drawArrays(gl.TRIANGLE_FAN, texturesData[textureIndex+0].cords[0], texturesData[textureIndex+0].cords[1]);

    angleCube = angleCube + 0.155;
    if(angleCube >= 360.0)
        angleCube = angleCube-360.0;

    if (z >= zLimit && !startScene) {
        startScene = true
        angleCube = 0.0
        increaseIndex(4)
        setInterval(function() {
            increaseIndex(1)
        }, 1000*10);
    }

    if (z <= zLimit)
        z = z + 0.002
    if (y <= yLimit1)
        y = y + 0.001
    if(y >= yLimit1 && y <= yLimit2 && startScene) {
        y = y + 0.002
    }

    if(ss >= ssLimit1 && startScene) {
        ss=ss-0.003
    }

    gl.bindVertexArray(null);
    gl.useProgram(null);
    
    //console.log("x, y, z", x, y, z)
    //console.log("a, s, d", aa, ss, dd)
    // animation loop
    requestAnimationFrame(draw, canvas);
}

function uninitialize()
{

    if(texturesData)
    {
        texturesData.forEach(function(data, index) {
            if (!data) {
                return
            } 
            gl.deleteTexture(texturesData[index].texture);
            texturesData[index].texture = 0;    
        })
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

        case 65://x
            t = toggle ? 0.005 : -0.005;
            aa = aa + t;
            break;

        case 83://y
            t = toggle ? 0.005 : -0.005;
            ss = ss + t;
            break;

        case 68://z
            t = toggle ? 0.005 : -0.005;
            dd = dd + t;
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