export function pageFailureGuard(record) {
  let rejectFailure
  const failure = new Promise((resolve, reject) => { rejectFailure = reject })
  const watched = new WeakSet()
  const fail = error => {
    record.errors.push(String(error))
    rejectFailure(error)
  }
  return {
    watch(page) {
      if (watched.has(page)) return
      watched.add(page)
      page.on('pageerror', fail)
      page.on('crash', () => fail(new Error('浏览器页面发生崩溃')))
    },
    run(verify) {
      return Promise.race([Promise.resolve().then(verify), failure])
    },
  }
}
