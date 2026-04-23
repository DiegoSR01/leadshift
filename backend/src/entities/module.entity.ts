import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Scenario } from './scenario.entity';
import { Exercise } from './exercise.entity';

@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({ length: 50 })
  icon: string;

  @Column({ type: 'varchar', length: 30 })
  type: 'leadership' | 'oral' | 'written' | 'teamwork';

  @Column({ length: 100, nullable: true })
  color: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', default: () => `'[]'` })
  skills: string[];

  @Column({ type: 'int', default: 45 })
  duration: number;

  @Column({ length: 20, default: 'Básico' })
  levelLabel: string;

  @Column({ type: 'boolean', default: false })
  locked: boolean;

  @Column({ length: 10, nullable: true })
  badge: string;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @OneToMany(() => Scenario, (s) => s.module)
  scenarios: Scenario[];

  @OneToMany(() => Exercise, (e) => e.module)
  exercises: Exercise[];
}
