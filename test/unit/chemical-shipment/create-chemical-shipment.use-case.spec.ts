import { CreateChemicalShipmentUseCase } from "@/modules/chemical-shipment/application/use-cases/chemical-shipment/create-chemical-shipment.use-case.ts";
import { ChemicalShipmentMock } from "../../mocks/chemical-shipment.mock.ts"
import { StatusShipment } from "@/generated/prisma/enums.ts";

describe('CreateChemicalShipmentUseCase', () => {
    let chemicalShipments: ChemicalShipmentMock;
    let useCase: CreateChemicalShipmentUseCase;

    beforeEach(() => {
        chemicalShipments = new ChemicalShipmentMock();
        useCase = new CreateChemicalShipmentUseCase(chemicalShipments);
    })

    it('cria uma carga química com status inicial ANALYZING', async () => {
        const input = {
            productId: 'prod-001',
            responsibleUserId: 'user-001',
            documentsIds: 'doc-001',
        };

        const chemicalShipment = await useCase.execute(input);

        expect(chemicalShipment.status).toBe(StatusShipment.ANALYZING);
        expect(await chemicalShipments.findById(chemicalShipment.id)).not.toBeNull();
    });

    it('deve rejeitar um productId invalido', async() => {
        const input = {
            productId: '',
            responsibleUserId: 'user-001',
            documentsIds: 'doc-001',
        }

        await expect(useCase.execute(input)).rejects.toThrow('O productId não pode estar vazio');
    })

    it('deve rejeitar um responsibleUserId invalido', async() => {
        const input = {
            productId: 'prod-001',
            responsibleUserId: '',
            documentsIds: 'doc-001',
        }

        await expect(useCase.execute(input)).rejects.toThrow('O responsibleUserId não pode estar vazio');
    })

    it('deve rejeitar um documentsIds invalido', async() => {
        const input = {
            productId: 'prod-001',
            responsibleUserId: 'user-001',
            documentsIds: '',
        }

        await expect(useCase.execute(input)).rejects.toThrow('O documentsIds não pode estar vazio');
    })

})