// 只观察真实窗口消息、监听器和GPU调用，保持原参数、返回值及浏览器行为。
(() => {
  const data = { href: location.href, messageListeners: 0, messageEvents: 0, messages: [], frames: 0, deletedResources: 0, lostContexts: 0,
    draws: 0, emissiveDraws: {}, completedFrames: 0, lastRenderedFrame: null, previousRenderedFrame: null,
    sends: [], resources: { deleteBuffer: 0, deleteTexture: 0, deleteProgram: 0, deleteFramebuffer: 0, deleteRenderbuffer: 0 } }
  window.__feiObserve = data
  if (window === window.top) window.__feiDocuments = [data]
  else if (document.referrer && new URL(document.referrer).origin === location.origin) window.top.__feiDocuments?.push(data)
  const add = window.addEventListener.bind(window)
  const remove = window.removeEventListener.bind(window)
  const listeners = new Set()
  window.addEventListener = function(type, listener, options) {
    const result = add(type, listener, options)
    if (type === 'message') { listeners.add(listener); data.messageListeners = listeners.size }
    return result
  }
  window.removeEventListener = function(type, listener, options) {
    const result = remove(type, listener, options)
    if (type === 'message') { listeners.delete(listener); data.messageListeners = listeners.size }
    return result
  }
  add('message', event => {
    data.messageEvents++
    if (!event.data || typeof event.data.type !== 'string') return
    data.messages.push({ data: event.data, origin: event.origin, trusted: event.isTrusted,
      source: event.source === window.parent ? 'parent' : event.source === document.querySelector('iframe')?.contentWindow ? 'viewer' : 'other' })
  })
  const post = Window.prototype.postMessage
  Window.prototype.postMessage = function(value, target, ...rest) {
    data.sends.push({ data: value, targetOrigin: typeof target === 'string' ? target : target?.targetOrigin })
    return post.call(this, value, target, ...rest)
  }
  const animation = window.requestAnimationFrame.bind(window)
  let activeFrame = null
  window.requestAnimationFrame = callback => animation(time => {
    data.frames++
    const previous = activeFrame
    const frame = { draws: 0, emissiveDraws: {}, time }
    activeFrame = frame
    let completed = false
    try {
      callback(time)
      completed = true
    } finally {
      activeFrame = previous
      if (completed && frame.draws > 0) {
        data.previousRenderedFrame = data.lastRenderedFrame
        data.lastRenderedFrame = { ...frame, sequence: ++data.completedFrames }
      }
    }
  })
  const locations = new WeakMap(), states = new WeakMap()
  const state = gl => {
    if (!states.has(gl)) {
      states.set(gl, { program: null, colors: new Map() })
      gl.canvas.addEventListener('webglcontextlost', () => data.lostContexts++)
    }
    return states.get(gl)
  }
  const proto = WebGL2RenderingContext.prototype
  const get = proto.getUniformLocation
  proto.getUniformLocation = function(program, name) {
    const location = get.call(this, program, name)
    if (location) locations.set(location, { program, name })
    return location
  }
  const use = proto.useProgram
  proto.useProgram = function(program) {
    const result = use.call(this, program)
    state(this).program = program
    return result
  }
  for (const method of ['uniform3f', 'uniform3fv']) {
    const original = proto[method]
    proto[method] = function(...args) {
      const result = original.apply(this, args)
      const location = locations.get(args[0])
      if (location?.name === 'emissive') state(this).colors.set(location.program, method === 'uniform3f' ? args.slice(1, 4) : Array.from(args[1]).slice(0, 3))
      return result
    }
  }
  for (const method of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced']) {
    const original = proto[method]
    proto[method] = function(...args) {
      const result = original.apply(this, args)
      if (args[method.startsWith('drawArrays') ? 2 : 1] > 0) {
        data.draws++
        if (activeFrame && this.canvas.id === 'scene') activeFrame.draws++
        const current = state(this), color = current.colors.get(current.program)
        if (color) {
          const key = color.map(value => value.toFixed(8)).join(',')
          data.emissiveDraws[key] = (data.emissiveDraws[key] ?? 0) + 1
          if (activeFrame && this.canvas.id === 'scene') activeFrame.emissiveDraws[key] = (activeFrame.emissiveDraws[key] ?? 0) + 1
        }
      }
      return result
    }
  }
  for (const method of ['deleteBuffer', 'deleteTexture', 'deleteProgram', 'deleteFramebuffer', 'deleteRenderbuffer']) {
    const original = proto[method]
    proto[method] = function(value) {
      const result = original.call(this, value)
      if (value) { data.deletedResources++; data.resources[method]++ }
      return result
    }
  }
})()
