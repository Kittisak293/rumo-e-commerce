import { Entity, PrimaryColumn, CreateDateColumn } from 'typeorm';

// Dedup log for Stripe webhook delivery — Stripe retries at-least-once, so
// the same event.id can arrive more than once.
@Entity()
export class ProcessedEvent {
  @PrimaryColumn({ type: 'varchar', name: 'event_id' })
  eventId: string;

  @CreateDateColumn({ name: 'processed_at' })
  processedAt: Date;
}
