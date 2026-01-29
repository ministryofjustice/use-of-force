// eslint-disable-next-line consistent-return
module.exports = fn => (req, res, next) => {
  if (typeof fn !== 'function') {
    return next()
  }
  Promise.resolve(fn(req, res, next)).catch(next)
}
