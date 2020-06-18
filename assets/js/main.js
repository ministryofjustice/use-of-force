$(document).ready(function() {
  $('.js-submitLink').click(e => {
    e.preventDefault()
    var form = $('form')
    var value = $(e.target).attr('data-value')

    var input = $('<input>')
      .attr('type', 'hidden')
      .attr('name', 'submitType')
      .val(value)
    form.append(input)
    form.submit()
  })
})
