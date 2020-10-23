var activeCaseloadId = document.head.querySelector('meta[name=active-caseload]').content
var userId = document.head.querySelector('meta[name=user-id]').content
var googleTagManagerEnvironment = document.head.querySelector('meta[name=google-tag-manager-env]').content
var googleTagManagerContainerId = document.head.querySelector('meta[name=google-tag-manager-container]').content

dataLayer = [{ activeCaseloadId, userId }]

//Google Tag Manager
;(function (w, d, s, l, i) {
  w[l] = w[l] || []
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' })
  var f = d.getElementsByTagName(s)[0],
    j = d.createElement(s),
    dl = l != 'dataLayer' ? '&l=' + l : ''
  j.async = true
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl + googleTagManagerEnvironment
  f.parentNode.insertBefore(j, f)
})(window, document, 'script', 'dataLayer', googleTagManagerContainerId)

//End Google Tag Manager
