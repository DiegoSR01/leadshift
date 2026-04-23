import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 10, nullable: true })
  icon: string;

  @Column({ type: 'text', nullable: true })
  condition: string;
}

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  achievementId: string;

  @CreateDateColumn()
  earnedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Achievement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievementId' })
  achievement: Achievement;
}
