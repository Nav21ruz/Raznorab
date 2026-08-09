export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function asyncRoute(handler) {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}
