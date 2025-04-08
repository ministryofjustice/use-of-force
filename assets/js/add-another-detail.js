import { AddAnother } from './add-another'

export default () => {
  $(document).ready(function () {
    new AddAnother($('.add-another-body-worn-camera'), '.remove-button-container')
    new AddAnother($('.add-another-weapons-observed'), '.remove-button-container')
  })
}
