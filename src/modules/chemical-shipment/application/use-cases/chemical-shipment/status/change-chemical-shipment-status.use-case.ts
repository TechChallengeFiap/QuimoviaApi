import { Inject, Injectable } from '@nestjs/common';
import type { ChemicalShipment } from '@/modules/chemical-shipment/domain/entities/chemical-shipment/chemical-shipment.entity.js';
import { StatusShipment } from '@/modules/chemical-shipment/domain/value-objects/chemical-shipment/status-shipment.vo.js';
import { BusinessRuleError } from '@/shared/domain/errors/domain.error.js';
import type { ChemicalShipmentActionActor } from '../create-chemical-shipment.use-case.js';
import { StartShipmentAnalysisUseCase } from './start-shipment-analysis.use-case.js';
import { SendShipmentToInspectionUseCase } from './send-shipment-to-inspection.use-case.js';
import { ReleaseChemicalShipmentUseCase } from './release-chemical-shipment.use-case.js';
import { BlockChemicalShipmentUseCase } from './block-chemical-shipment.use-case.js';
import { StartShipmentTransitUseCase } from './start-shipment-transit.use-case.js';
import { CompleteChemicalShipmentUseCase } from './complete-chemical-shipment.use-case.js';
import { CancelChemicalShipmentUseCase } from './cancel-chemical-shipment.use-case.js';

@Injectable()
export class ChangeChemicalShipmentStatusUseCase {
  constructor(
    @Inject(StartShipmentAnalysisUseCase)
    private readonly startAnalysisUseCase: StartShipmentAnalysisUseCase,
    @Inject(SendShipmentToInspectionUseCase)
    private readonly sendToInspectionUseCase: SendShipmentToInspectionUseCase,
    @Inject(ReleaseChemicalShipmentUseCase)
    private readonly releaseUseCase: ReleaseChemicalShipmentUseCase,
    @Inject(BlockChemicalShipmentUseCase)
    private readonly blockUseCase: BlockChemicalShipmentUseCase,
    @Inject(StartShipmentTransitUseCase)
    private readonly startTransitUseCase: StartShipmentTransitUseCase,
    @Inject(CompleteChemicalShipmentUseCase)
    private readonly completeUseCase: CompleteChemicalShipmentUseCase,
    @Inject(CancelChemicalShipmentUseCase)
    private readonly cancelUseCase: CancelChemicalShipmentUseCase,
  ) {}

  async execute(
    id: string,
    target: StatusShipment,
    actor?: ChemicalShipmentActionActor | null,
  ): Promise<ChemicalShipment> {
    switch (target) {
      case StatusShipment.ANALYZING:
        return this.startAnalysisUseCase.execute(id, actor);
      case StatusShipment.INSPECTION:
        return this.sendToInspectionUseCase.execute(id, actor);
      case StatusShipment.APPROVED:
        return this.releaseUseCase.execute(id, actor);
      case StatusShipment.REPROVED:
        return this.blockUseCase.execute(id, actor);
      case StatusShipment.IN_TRANSIT:
        return this.startTransitUseCase.execute(id, actor);
      case StatusShipment.COMPLETED:
        return this.completeUseCase.execute(id, actor);
      case StatusShipment.CANCELLED:
        return this.cancelUseCase.execute(id, actor);
      default:
        throw new BusinessRuleError(
          `Não é permitida transição direta para o status "${target}".`,
        );
    }
  }
}
