import { PartialType } from '@nestjs/swagger';
import { CreateProductDocumentDto } from './create-product-document.dto.js';

export class UpdateProductDocumentDto extends PartialType(
  CreateProductDocumentDto,
  {
    skipNullProperties: false,
  },
) {}
