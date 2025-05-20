import { AddAnother } from './add-another'

export default () => {
  $(document).ready(function () {
    new AddAnother($('.add-another-evidence'), '.remove-button-container')
  })
}
