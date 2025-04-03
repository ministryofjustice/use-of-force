import { AddAnother } from "./add-another"

export default () => {
   $(document).ready(function () {
    new AddAnother($('.add-another-witness'), '.remove-button-container')
 })
}