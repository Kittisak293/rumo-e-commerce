import { Shipment } from 'src/shipments/entities/shipment.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
