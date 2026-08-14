import { Shipment } from 'src/shipments/entities/shipment.entity';
import { ShipmentStatus } from 'src/shipments/shipment-status.enum';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ShipmentEvent {
  // Generated, not @PrimaryColumn: the create DTO never carried an `id`, so
  // every insert went in with a null primary key.
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Shipment, (shipment) => shipment.shipmentEvents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column({ type: 'varchar' })
  status: ShipmentStatus;

  @Column({ type: 'varchar' })
  description: string;

  // Nullable: not every event happens somewhere physical — the "payment
  // confirmed" entry that opens the timeline has no branch attached to it.
  @Column({ type: 'varchar', nullable: true })
  location: string | null;

  // When the event happened, as reported by the carrier — distinct from
  // `created_at`, which is when we recorded it. The timeline sorts on this;
  // backfilled events would otherwise all collapse onto their import time.
  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
