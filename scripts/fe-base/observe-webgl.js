// 观察实际 GPU 调用，保持原参数、返回值和渲染行为。
(() => {
  const names = new WeakMap();
  const programs = new WeakMap();
  const states = new Map();
  let nextProgram = 0;
  const state = gl => {
    let value = states.get(gl.canvas);
    if (!value) {
      value = {canvas: gl.canvas, draws: 0, programs: {}, frameDraws: [], currentFrameDraws: 0};
      states.set(gl.canvas, value);
    }
    return value;
  };
  const prototype = WebGL2RenderingContext.prototype;
  const getLocation = prototype.getUniformLocation;
  prototype.getUniformLocation = function(program, name) {
    const location = getLocation.call(this, program, name);
    if (!programs.has(program)) programs.set(program, ++nextProgram);
    if (location) names.set(location, {name, program: programs.get(program)});
    return location;
  };
  const matrix = prototype.uniformMatrix4fv;
  prototype.uniformMatrix4fv = function(location, transpose, values, ...rest) {
    const result = matrix.call(this, location, transpose, values, ...rest);
    const metadata = names.get(location);
    if (metadata && ['viewMatrix', 'projectionMatrix'].includes(metadata.name)) {
      const data = state(this);
      data.programs[metadata.program] ??= {};
      data.programs[metadata.program][metadata.name] = Array.from(values);
    }
    return result;
  };
  const useProgram = prototype.useProgram;
  prototype.useProgram = function(program) {
    const result = useProgram.call(this, program);
    state(this).activeProgram = program;
    return result;
  };
  for (const method of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
    const original = prototype[method];
    prototype[method] = function(...args) {
      const result = original.apply(this, args);
      if (args[method.startsWith('drawArrays') ? 2 : 1] > 0) {
        const data = state(this);
        data.draws++;
        data.currentFrameDraws++;
        const id = programs.get(data.activeProgram);
        if (data.programs[id]) data.programs[id].lastDraw = data.draws;
      }
      return result;
    };
  }
  const frame = () => {
    for (const data of states.values()) {
      if (data.currentFrameDraws) {
        data.frameDraws.push(data.currentFrameDraws);
        if (data.frameDraws.length > 20) data.frameDraws.shift();
        data.currentFrameDraws = 0;
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  window.__feBaseObserve = selector => {
    const data = states.get(document.querySelector(selector));
    if (!data) return null;
    // 主场景透视相机 near=.1/far=120；其他 shadow、AO 相机不作为主镜头。
    const candidates = Object.entries(data.programs).filter(([, value]) => {
      const p = value.projectionMatrix;
      const expectedDepth = selector === '#scene' ? 0.20016680567139283 : 0.04000444493832648;
      return value.viewMatrix && p && Math.abs(p[11] + 1) < 1e-6
        && Math.abs(p[14] + expectedDepth) < 1e-5;
    }).sort((a, b) => (b[1].lastDraw ?? 0) - (a[1].lastDraw ?? 0));
    return {draws: data.draws, frameDraws: data.frameDraws.slice(),
      programs: data.programs, main: candidates.map(([id, value]) => ({id, matrix: value.viewMatrix}))};
  };
  window.__feBaseResetFrames = selector => {
    const data = states.get(document.querySelector(selector));
    if (!data) throw new Error('缺少真实 GPU 观察数据');
    data.frameDraws = [];
    data.currentFrameDraws = 0;
  };
})();
