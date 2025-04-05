import { PartialType } from '@nestjs/mapped-types'; 
import { CreateEventDto } from './create-event.dto';

// PartialType makes all properties of CreateEventDto optional
export class UpdateEventDto extends PartialType(CreateEventDto) {}