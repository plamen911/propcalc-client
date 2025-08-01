export const isSolarByEstateTypeApplicable = estateTypeId => estateTypeId.toString() === '4';

export const getSolarClauseId = () => 3;

export const isClauseWithCheckbox = clauseId => [6, 14, 15, 16].includes(+clauseId);
