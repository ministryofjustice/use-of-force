import { full } from '../../config/incident'
import { UseOfForceDraftReport } from '../../data/UseOfForceReport'
import validation from '../validation'

export enum SectionStatus {
  NOT_STARTED = 'NOT_STARTED',
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
}

const getStatus = (validationSpec, sectionValues) => {
  if (!sectionValues) {
    return SectionStatus.NOT_STARTED
  }

  return validation.isValid(validationSpec.schema, sectionValues) ? SectionStatus.COMPLETE : SectionStatus.INCOMPLETE
}

export const check = (report: UseOfForceDraftReport): { complete: boolean } => {
  const result = Object.keys(full).reduce(
    (previous, key) => ({ ...previous, [key]: getStatus(full[key], report[key]) }),
    {}
  )

  const complete = !Object.values(result).some(value => value !== SectionStatus.COMPLETE)
  return { ...result, complete }
}

export const isReportComplete = (report: UseOfForceDraftReport): boolean => check(report).complete
