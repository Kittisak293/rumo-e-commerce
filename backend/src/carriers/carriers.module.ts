import { Module } from '@nestjs/common';
import { CarriersService } from './carriers.service';
import { CarriersController } from './carriers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrier } from './entities/carrier.entity';
import { Shipment } from 'src/shipments/entities/shipment.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Carrier, Shipment]), AuthModule],
  controllers: [CarriersController],
  providers: [CarriersService],
})
export class CarriersModule {}
