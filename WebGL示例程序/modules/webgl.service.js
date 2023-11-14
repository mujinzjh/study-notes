// 错误信息表
const ERROR_MESSAGE = {
    FAILED_CREATE_SHADER: 'Failed to create shader.',
    FAILED_CREATE_PROGRAM: 'Failed to create program.',
    FAILED_LOCATE_ATTRIBUTE: 'Failed to locate attribute.',
    FAILED_LOCATE_UNIFORM: 'Failed to locate uniform.',
    NO_CANVAS_ELEMENT: 'No canvas element found.',
    FAILED_GET_WEBGL_CONTEXT: 'Failed to get webgl context.'
}

const CANVAS_TAG_NAME = 'CANVAS';

/**
 * 编译着色器
 * @param {WebGLRenderingContext} gl 
 * @param {number} type 
 * @param {string} source 
 * @returns {WebGLShader}
 */
const compileShader = (gl, type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!status) {
        throw new Error(gl.getShaderInfoLog(shader).toString());
    }
    return shader;
};

/**
 * uniform赋值函数映射
 * @param {WebGLRenderingContext} gl 
 * @returns {Map<'float'|'int'|'vec3'|'matrix4', (location: number, value: number | number[]) => void>}
 */
const setUniformMap = gl => new Map([
    ['float', (location, value) => gl.uniform1f(location, value)],
    ['int', (location, value) => gl.uniform1i(location, value)],
    ['vec3', (location, value) => gl.uniform3fv(location, value)],
    ['matrix4', (location, value) => gl.uniformMatrix4fv(location, false, value)]
]);

export class WebGLService {

    /**
     * 获取WebGL上下文
     * @param {string} selector 
     * @returns {WebGLRenderingContext}
     */
    static getContext(selector) {
        const element = document.querySelector(selector);
        if (!element || element.tagName.toUpperCase() !== CANVAS_TAG_NAME) {
            throw new Error(ERROR_MESSAGE.NO_CANVAS_ELEMENT);
        }
        const gl = element.getContext('webgl');
        if (!gl) {
            throw new Error(ERROR_MESSAGE.FAILED_GET_WEBGL_CONTEXT);
        }
        return gl;
    }

    /**
     * 获取着色器程序
     * @param {WebGLRenderingContext} gl 
     * @param {string} vs 
     * @param {string} fs 
     * @returns {WebGLProgram}
     */
    static getProgram(gl, vs, fs) {
        const vShader = compileShader(gl, gl.VERTEX_SHADER, vs);
        const fShader = compileShader(gl, gl.FRAGMENT_SHADER, fs);
        const program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);
        const status = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!status) {
            throw new Error(gl.getProgramInfoLog(program).toString());
        }
        return program;
    }

    /**
     * 设置attribute变量, 本教程只是用ARRAY_BUFFER类型
     * @param {WebGLRenderingContext} gl 
     * @param {WebGLProgram} program 
     * @param {string} name 
     * @param {Float32Array} value 
     * @param {number} size 
     */
    static setAttribute(gl, program, name, value, size) {
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, value, gl.STATIC_DRAW);
        const pointer = gl.getAttribLocation(program, name);
        if (!~pointer) {
            throw new Error(ERROR_MESSAGE.FAILED_LOCATE_ATTRIBUTE);
        }
        gl.vertexAttribPointer(pointer, size, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(pointer);
    }

    /**
     * 设置uniform值
     * @param {WebGLRenderingContext} gl 
     * @param {WebGLProgram} program 
     * @param {string} name 
     * @param {number[]} value 
     * @param {'float'|'int'|'vec3'|'matrix4'} type 
     */
    static setUniform(gl, program, name, value, type) {
        const pointer = gl.getUniformLocation(program, name);
        if (!pointer) {
            throw new Error(ERROR_MESSAGE.FAILED_LOCATE_UNIFORM);
        }
        const setFun = setUniformMap(gl).get(type);
        setFun(pointer, value);
    }

    /**
     * 重置canvas尺寸
     * @param {WebGLRenderingContext} gl 
     * @param {number} width 
     * @param {number} height 
     */
    static resizeCanvas(gl, width, height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, width, height);
    }
}