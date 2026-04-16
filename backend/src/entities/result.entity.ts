import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('results')
export class Result {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  /** ID of the module, scenario or exercise */
  @Column({ type: 'uuid' })
  referenceId: string;

  /** 'scenario' | 'oral' | 'written' */
  @Column({ length: 20 })
  referenceType: string;

  @Column({ type: 'int' })
  score: number;

  @Column({ type: 'int', default: 0 })
  xpEarned: number;

  @Column({ type: 'int', default: 1 })
  attempt: number;

  @Column({ length: 10, nullable: true })
  selectedOption: string;

  /**
   * JSONB – stores detailed NLP / evaluation feedback:
   * { criteriaScores: [...], recommendations: [...], issues: [...] }
   */
  @Column({ type: 'jsonb', nullable: true })
  feedback: Record<string, any>;

  @CreateDateColumn()
  completedAt: Date;

  @ManyToOne(() => User, (u) => u.results, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
