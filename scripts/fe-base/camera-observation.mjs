export function cameraChangedAfterInput({selector, reference, operation, afterInput}) {
  if (!Number.isInteger(afterInput)) throw new Error('需要操作前的实际输入序号');
  if (!['rotate', 'zoom-in', 'zoom-out'].includes(operation)) throw new Error('未知镜头操作');
  const value = window.__feBaseObserve(selector);
  const camera = value?.main[0];
  if (!camera) return false;
  const input = value.inputEvents.findLast(event => event.sequence > afterInput
    && event.canvasId === value.canvasId && event.trusted && event.completed
    && (operation === 'rotate' ? event.type === 'pointermove' && event.buttons === 1
      : event.type === 'wheel' && event.deltaY === (operation === 'zoom-in' ? -600 : 600)
        && event.defaultPrevented));
  if (!input || !(camera.viewUpload > input.viewUploadsAtInput
    && camera.lastDraw > input.drawsAtInput && camera.lastDraw > camera.viewUploadedAtDraw)) return false;
  const matrix = camera.matrix;
  if (operation === 'rotate') {
    return [0, 1, 2, 4, 5, 6, 8, 9, 10].some(index => Math.abs(matrix[index] - reference[index]) > 1e-5);
  }
  const current = Math.hypot(...matrix.slice(12, 15));
  const previous = Math.hypot(...reference.slice(12, 15));
  if (operation === 'zoom-in') return current < previous - .01;
  if (operation === 'zoom-out') return current > previous + .01;
  throw new Error('未知镜头操作');
}
