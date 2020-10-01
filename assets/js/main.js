$(document).ready(function () {
  $('.js-submitLink').click(e => {
    e.preventDefault()
    var form = $('form')
    var value = $(e.target).attr('data-value')

    var input = $('<input>').attr('type', 'hidden').attr('name', 'submitType').val(value)
    form.append(input)
    form.submit()
  })

  $('.print-link').click(function () {
    window.print()
  })

  $('.date-input').each(function (index, element) {
    const disableFutureDates = Boolean($(element).attr('disable-future-dates'))
    const disablePastDates = Boolean($(element).attr('disable-past-dates'))
    const maxDate = disableFutureDates ? '0' : undefined
    const minDate = disablePastDates ? '0' : undefined
    const dateFormat = $(element).attr('date-format') || 'd M yy'

    $(element).datepicker({
      dateFormat,
      showOtherMonths: true,
      selectOtherMonths: true,
      maxDate: maxDate,
      minDate: minDate,
    })
  })
})
