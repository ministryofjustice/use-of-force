import { AddAnother } from "./add-another"

export default () => {
    $(document).ready(function () {
      new AddAnother($('.add-another-staff-needing-medical-attention'), '.remove-button-container')
   })
  }
