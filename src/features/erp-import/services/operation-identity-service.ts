export interface OperationIdentityInput {
  workOrderId: string;
  operationNumber: number;
  taskCode: string;
}

/** Unique autorité de construction des identités métier d'opération. */
export class OperationIdentityService {
  createStableId(input: OperationIdentityInput): string {
    return [input.workOrderId, input.operationNumber, input.taskCode]
      .map((value) => String(value).trim())
      .join("::");
  }

  createOperationId(stableId: string, occurrence: number): string {
    return occurrence <= 1 ? stableId : `${stableId}::${occurrence}`;
  }
}

export const operationIdentityService = new OperationIdentityService();
