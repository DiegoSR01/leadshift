import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Module } from './module.entity';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({ type: 'int', default: 0 })
  completedItems: number;

  @Column({ type: 'int', default: 0 })
  totalItems: number;

  @Column({ type: 'float', default: 0 })
  avgScore: number;

  @Column({ type: 'int', default: 0 })
  bestScore: number;

  @Column({ type: 'int', default: 0 })
  timeSpentMinutes: number;

  @Column({ length: 30, default: 'En curso' })
  status: string;

  @CreateDateColumn()
  startedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (u) => u.progress, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Module, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: Module;
}
