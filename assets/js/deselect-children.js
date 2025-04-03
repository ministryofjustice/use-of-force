export default () => {
  $(document).ready(function () {
    document.querySelectorAll('[id^=parent-]').forEach(parent => {
      parent.addEventListener('change', deselectChildrenOnUncheck)
    })
  })
}

function deselectChildrenOnUncheck(e) {
  const parent = e.srcElement
  if (!parent.checked) {
    document.querySelectorAll(`[id^=child-${parent.value}__]`).forEach(child => (child.checked = false))
  }
}
