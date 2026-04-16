import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Module } from './module.entity';

@Entity('exercises')
export class Exercise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({ length: 200 })
  title: string;

  /** 'oral' | 'written' */
  @Column({ length: 20 })
  exerciseType: string;

  @Column({ length: 60, nullable: true })
  subType: string;

  @Column({ length: 20, default: 'Intermedio' })
  difficulty: string;

  @Column({ type: 'int', nullable: true })
  wordLimitMin: number;

  @Column({ type: 'int', nullable: true })
  wordLimitMax: number;

  @Column({ type: 'int', nullable: true })
  timeLimit: number;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @Column({ type: 'text', nullable: true })
  sourceText: string;

  @Column({ type: 'text', nullable: true })
  prompt: string;

  @Column({ type: 'text', nullable: true })
  placeholder: string;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  criteria: {
    id: string;
    label: string;
    weight: number;
    description?: string;
  }[];

  @Column({ type: 'jsonb', default: () => `'[]'` })
  tips: string[];

  @Column({ type: 'int', default: 50 })
  xpReward: number;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @ManyToOne(() => Module, (m) => m.exercises, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: Module;
}
