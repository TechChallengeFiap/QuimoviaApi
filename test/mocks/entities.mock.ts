import {
  ChemicalShipment,
  type CreateChemicalShipmentData,
} from '@/modules/chemical-shipment/domain/entities/chemical-shipment.entity.js';
import {
  Inspection,
  type CreateInspectionData,
} from '@/modules/inspection/domain/entities/inspection.entity.js';
import { InspectionRequirement } from '@/modules/inspection/domain/enums/inspection-requirement.enum.js';
import { InspectionScope } from '@/modules/inspection/domain/enums/inspection-scope.enum.js';
import {
  Session,
  type StartSessionData,
} from '@/modules/user/domain/entities/session.entity.js';
import {
  User,
  type CreateUserData,
} from '@/modules/user/domain/entities/user.entity.js';
import { UserRole } from '@/modules/user/domain/enums/user-role.enum.js';

/**
 * Fábricas de entidades válidas para os testes.
 *
 * Cada uma recebe apenas os campos que o teste precisa controlar; os demais
 * recebem valores válidos. Assim, um campo novo numa entidade muda só a
 * fábrica, e não cada teste que precisa de uma entidade qualquer.
 */
export function buildUser(override: Partial<CreateUserData> = {}): User {
  return User.create({
    name: 'Maria Silva',
    email: 'maria@quimovia.com',
    passwordHash: 'hash:S3nhaForte!',
    role: UserRole.PORT_OPERATOR,
    ...override,
  });
}

export function buildSession(
  override: Partial<StartSessionData> = {},
): Session {
  return Session.start({
    userId: 'user-001',
    durationInSeconds: 3600,
    ...override,
  });
}

export function buildInspection(
  override: Partial<CreateInspectionData> = {},
): Inspection {
  return Inspection.create({
    cargoId: 'cargo-001',
    compositionVersion: 1,
    scope: InspectionScope.CARGO,
    inspectorId: 'fiscal-001',
    requirements: [InspectionRequirement.NO_LEAKAGE],
    ...override,
  });
}

export function buildChemicalShipment(
  override: Partial<CreateChemicalShipmentData> = {},
): ChemicalShipment {
  return ChemicalShipment.create({
    productId: 'prod-001',
    responsibleUserId: 'user-001',
    documentsIds: 'doc-001',
    ...override,
  });
}
