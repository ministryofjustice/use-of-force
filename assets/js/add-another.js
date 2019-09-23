/**
 * Based on the "Add Another" Component from https://github.com/hmcts/frontend
 */

if (typeof Array.prototype.forEach != 'function') {
  Array.prototype.forEach = function(callback) {
    for (var i = 0; i < this.length; i++) {
      callback.apply(this, [this[i], i, this])
    }
  }
}

AddAnother = function(container, removeContainerSelector) {
  this.container = $(container)
  this.removeContainerSelector = removeContainerSelector

  this.onAddButtonClick = function(e) {
    var item = this.getNewItem()
    this.updateAttributes(this.getItems().length, item)
    this.resetItem(item)
    var firstItem = this.getItems().first()
    if (!this.hasRemoveButton(firstItem)) {
      this.createRemoveButton(firstItem)
    }
    this.getItems()
      .last()
      .after(item)
    item
      .find('input, textarea, select')
      .first()
      .focus()
    e.preventDefault()
  }

  this.hasRemoveButton = function(item) {
    return item.find('.add-another__remove-button').length
  }

  this.getItems = function() {
    return this.container.find('.add-another__item')
  }

  this.getNewItem = function() {
    var item = this.getItems()
      .first()
      .clone()
    if (!this.hasRemoveButton(item)) {
      this.createRemoveButton(item)
    }
    return item
  }

  this.updateAttributes = function(index, item) {
    item.find('[data-name]').each(function(i, el) {
      el.name = $(el)
        .attr('data-name')
        .replace(/%index%/, index)
      el.id = $(el)
        .attr('data-id')
        .replace(/%index%/, index)
      ;($(el).prevAll('label')[0] || $(el).parents('label')[0] || $(el).nextAll('label')[0]).htmlFor = el.id
    })
  }

  this.createRemoveButton = function(item) {
    item
      .find(this.removeContainerSelector)
      .append(
        '<button type="button" class="govuk-button govuk-button--secondary add-another__remove-button govuk-!-margin-left-3">Remove</button>'
      )
  }

  this.resetItem = function(item) {
    item.find('[data-name], [data-id]').each(function(index, el) {
      if (el.type == 'checkbox' || el.type == 'radio') {
        el.checked = false
      } else {
        el.value = ''
      }
    })
    item.find('.govuk-error-message').remove()
    var classesToReset = ['govuk-form-group--error', 'govuk-input--error', 'govuk-textarea--error']
    classesToReset.forEach(function(c) {
      item.find('.' + c).removeClass(c)
    })
  }

  this.onRemoveButtonClick = function(e) {
    $(e.currentTarget)
      .parents('.add-another__item')
      .remove()
    var items = this.getItems()
    if (items.length === 1) {
      items.find('.add-another__remove-button').remove()
    }
    items.each(
      $.proxy(function(index, el) {
        this.updateAttributes(index, $(el))
      }, this)
    )
    this.focusHeading()
    e.preventDefault()
  }

  this.focusHeading = function() {
    this.container.find('.add-another__heading').focus()
  }

  this.container.on('click', '.add-another__add-button', $.proxy(this, 'onAddButtonClick'))
  this.container.on('click', '.add-another__remove-button', $.proxy(this, 'onRemoveButtonClick'))
}
