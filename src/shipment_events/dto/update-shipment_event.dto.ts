import { PartialType } from '@nestjs/swagger';
import { CreateShipmentEventDto } from './create-shipment_event.dto';

export class UpdateShipmentEventDto extends PartialType(CreateShipmentEventDto) {}
