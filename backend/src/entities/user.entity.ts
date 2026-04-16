import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Result } from './result.entity';
import { UserProgress } from './user-progress.entity';
import { Assessment } from './assessment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ length: 120 })
  university: string;

  @Column({ length: 180 })
  career: string;

  @Column({ type: 'smallint' })
  semester: number;

  @Column({ length: 10, nullable: true })
  avatar: string;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'int', default: 0 })
  xp: number;

  @Column({ type: 'int', default: 0 })
  streak: number;

  @Column({ type: 'jsonb', default: () => `'{"notifications":true,"emailDigest":false,"publicProfile":true,"darkMode":false}'` })
  settings: {
    notifications: boolean;
    emailDigest: boolean;
    publicProfile: boolean;
    darkMode: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Result, (r) => r.user)
  results: Result[];

  @OneToMany(() => UserProgress, (p) => p.user)
  progress: UserProgress[];

  @OneToMany(() => Assessment, (a) => a.user)
  assessments: Assessment[];
}
