import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('assessments')
export class Assessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  /** 'pretest' | 'postest' */
  @Column({ type: 'varchar', length: 10 })
  type: 'pretest' | 'postest';

  /**
   * JSONB with skill scores, e.g.:
   * { "liderazgo": 45, "comOral": 40, "escritura": 52, "equipos": 60, "sintesis": 38, "resolucion": 48 }
   */
  @Column({ type: 'jsonb' })
  scores: Record<string, number>;

  @CreateDateColumn()
  completedAt: Date;

  @ManyToOne(() => User, (u) => u.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
