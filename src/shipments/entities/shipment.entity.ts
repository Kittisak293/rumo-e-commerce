import { Carrier } from 'src/carriers/entities/carrier.entity';
import { Order } from 'src/orders/entities/order.entity';
import { ShipmentEvent } from 'src/shipment_events/entities/shipment_event.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Shipment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.shipments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Carrier, (carrier) => carrier.shipments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'carrier_id' })
  carrier: Carrier;

  @OneToMany(() => ShipmentEvent, (shipmentEvent) => shipmentEvent.shipment, {
    onDelete: 'CASCADE',
  })
  shipmentEvents: ShipmentEvent[];

  @Column()
  status: string;

  @Column()
  lastLocation: string;

  @Column()
  estimatedDeliveryAt: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
