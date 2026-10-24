import type { ShipmentDocumentationChecker } from '@/modules/document-compliance/public/index.js';

export class ShipmentDocumentationCheckerMock
  implements ShipmentDocumentationChecker
{
  private readonly documented = new Set<string>();

  markAsDocumented(shipmentId: string): void {
    this.documented.add(shipmentId.toLowerCase());
  }

  markAsUndocumented(shipmentId: string): void {
    this.documented.delete(shipmentId.toLowerCase());
  }

  clear(): void {
    this.documented.clear();
  }

  async hasRequiredDocumentation(shipmentId: string): Promise<boolean> {
    return this.documented.has(shipmentId.toLowerCase());
  }
}
