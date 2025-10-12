import { Shipment } from 'src/shipments/entities/shipment.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

@Entity()
export class ShipmentEvent {
  @PrimaryColumn()
  id: number;

  @ManyToOne(() => Shipment, (shipment) => shipment.shipmentEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column()
  status: string;

  @Column()
  description: string;

  @Column()
  location: string;
}
