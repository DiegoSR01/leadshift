import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Module } from './module.entity';

@Entity('scenarios')
export class Scenario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  context: string;

  @Column({ type: 'text' })
  situation: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'jsonb' })
  options: {
    id: string;
    text: string;
    style: string | null;
  }[];

  @Column({ length: 10 })
  bestAnswer: string;

  @Column({ length: 10, nullable: true })
  secondAnswer: string;

  @Column({ type: 'jsonb' })
  feedback: Record<
    string,
    {
      score: number;
      type: 'excellent' | 'good' | 'warning' | 'error';
      title: string;
      text: string;
    }
  >;

  @Column({ type: 'text', nullable: true })
  theory: string;

  @Column({ type: 'int', default: 50 })
  xpReward: number;

  @Column({ length: 20, default: 'Básico' })
  level: string;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  /** Maturity level of the follower in Hersey-Blanchard model (M1-M4) */
  @Column({ length: 5, nullable: true })
  maturityLevel: string;

  @ManyToOne(() => Module, (m) => m.scenarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: Module;
}
