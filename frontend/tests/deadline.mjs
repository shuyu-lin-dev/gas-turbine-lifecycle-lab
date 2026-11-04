export async function withinDeadline(operation, deadline, message) {
  const remaining = deadline - performance.now()
  if (!Number.isFinite(remaining) || remaining <= 0) throw new Error(message)
  let timer
  try {
    return await Promise.race([
      Promise.resolve().then(operation),
      new Promise((resolve, reject) => { timer = setTimeout(() => reject(new Error(message)), remaining) }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
