import { Carrier } from 'src/carriers/entities/carrier.entity';
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
}
