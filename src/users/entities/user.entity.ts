import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'customer'],
    default: 'customer',
  })
  role: 'admin' | 'customer';

  @Column()
  name: string;

  @Column()
  age: number;
}
