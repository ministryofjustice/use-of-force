// This is the order in which changes will be displayed in the 'what changed, changed from, changed to' columns of
// /{incidentId}/view-incident?tab=edit-history page. Not setting this order will mean the view will follow the order in the DB which is very random.

// just add more to the same list for the other pages. Don't create a new array.

export default ['incidentDate', 'agencyId', 'incidentLocation', 'plannedUseOfForce', 'authorisedBy', 'witnesses']
