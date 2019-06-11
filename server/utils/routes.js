module.exports = {
  getPathFor,
}

function getPathFor({ data, config }) {
  const { nextPath } = config

  if (!nextPath.decisions) {
    return nextPath.path
  }

  if (Array.isArray(nextPath.decisions)) {
    return determinePathFromDecisions({ decisions: nextPath.decisions, data }) || nextPath.path
  }

  return getPathFromAnswer({ nextPath: nextPath.decisions, data })
}

function getPathFromAnswer({ nextPath, data }) {
  const decidingValue = data[nextPath.discriminator]
  return nextPath[decidingValue]
}

function determinePathFromDecisions({ decisions, data }) {
  return decisions.reduce((path, pathConfig) => path || getPathFromAnswer({ nextPath: pathConfig, data }), null)
}
