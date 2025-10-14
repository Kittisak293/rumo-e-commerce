import { Shipment } from 'src/shipments/entities/shipment.entity';
import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Carrier {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column({ length: 32, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  website?: string;

  @Column({ name: 'tracking_url_template', length: 255, nullable: true })
  trackingUrlTemplate?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Shipment, (shipment) => shipment.carrier, {
    onDelete: 'CASCADE',
  })
  shipments: Shipment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
