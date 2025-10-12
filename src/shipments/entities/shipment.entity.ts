import { Order } from 'src/orders/entities/order.entity';
import { ShipmentEvent } from 'src/shipment_events/entities/shipment_event.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

@Entity()
export class Shipment {
  @PrimaryColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.shipments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @OneToMany(() => ShipmentEvent, (shipmentEvent) => shipmentEvent.order, {
    onDelete: 'CASCADE',
  })
  shipmentEvents: ShipmentEvent[];

  //   @Column()
  //   carrier: string;

  @Column({ unique: true })
  trackingNumber: string;

  @Column()
  status: string;

  @Column()
  lastLocation: string;

  @Column()
  estimatedDeliveryAt: string;
}
