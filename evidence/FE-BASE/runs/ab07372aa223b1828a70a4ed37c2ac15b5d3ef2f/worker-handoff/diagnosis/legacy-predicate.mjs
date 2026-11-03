export function cameraChangedAfterInput({selector, reference, operation}) {
  const value = window.__feBaseObserve(selector);
  const matrix = value?.main[0]?.matrix;
  if (!matrix) return false;
  if (operation === 'rotate') {
    return [0, 1, 2, 4, 5, 6, 8, 9, 10].some(index => Math.abs(matrix[index] - reference[index]) > 1e-5);
  }
  const current = Math.hypot(...matrix.slice(12, 15));
  const previous = Math.hypot(...reference.slice(12, 15));
  if (operation === 'zoom-in') return current < previous - .01;
  if (operation === 'zoom-out') return current > previous + .01;
  throw new Error('未知镜头操作');
}
