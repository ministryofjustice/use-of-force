const sanitiseError = (error: any) => {
  if (error.response) {
    return {
      status: error.response.status,
      statusText: error.response.statusText,
      headers: error.response.headers,
      stack: error.stack,
      data: error.response.body,
      message: error.message,
    }
  }
  if (error.request) {
    // request is too big and best skipped
    return {
      code: error.code,
      stack: error.stack,
      message: error.message,
    }
  }
  return {
    stack: error.stack,
    message: error.message,
  }
}

export default sanitiseError
