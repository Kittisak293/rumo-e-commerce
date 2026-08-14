import { Carrier } from 'src/carriers/entities/carrier.entity';
import { Order } from 'src/orders/entities/order.entity';
import { ShipmentEvent } from 'src/shipment_events/entities/shipment_event.entity';
import { ShipmentStatus } from '../shipment-status.enum';
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

  // Nullable: rows created before this column existed have none, and
  // `synchronize` can't backfill a NOT NULL default on an ALTER TABLE.
  // Explicit type: TypeORM can't infer a native column type from a
  // `string | null` union design type (same issue as `User.age`).
  @Column({ name: 'tracking_number', type: 'varchar', nullable: true })
  trackingNumber: string | null;

  @Column({ type: 'varchar', default: ShipmentStatus.PENDING })
  status: ShipmentStatus;

  // Nullable: a shipment exists the moment the seller hands it over, which is
  // before the carrier has scanned it anywhere. The DTO already marks both of
  // these optional — the entity used to disagree and every insert that omitted
  // them failed on the NOT NULL constraint.
  @Column({ name: 'last_location', type: 'varchar', nullable: true })
  lastLocation: string | null;

  // Explicit name + type: a bare `@Column()` on a `string` design type gave us
  // a camelCase *varchar* column, so the ETA could never be compared or sorted
  // as a date (see CLAUDE.md on declaring column types explicitly).
  @Column({
    name: 'estimated_delivery_at',
    type: 'timestamptz',
    nullable: true,
  })
  estimatedDeliveryAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
