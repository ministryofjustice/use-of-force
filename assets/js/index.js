import * as govukFrontend from 'govuk-frontend'
import * as mojFrontend from '@ministryofjustice/frontend'
import main from './main'
import addAnotherWitness from './add-another-witness'
import addAnotherDetail from './add-another-detail'
import addAnotherEvidence from './add-another-evidence'
import addAnotherStaff from './add-another-staff'
import deselectChildren from './deselect-children'
import sortableSearchResults from './sortable-search-results'

govukFrontend.initAll()
mojFrontend.initAll()
addAnotherWitness()
addAnotherDetail()
addAnotherEvidence()
addAnotherStaff()
deselectChildren()
sortableSearchResults()
main()
