import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

/** XP thresholds per level */
const LEVELS = [
  { level: 1, name: 'Principiante', xpNeeded: 0 },
  { level: 2, name: 'Explorador', xpNeeded: 300 },
  { level: 3, name: 'Practicante', xpNeeded: 700 },
  { level: 4, name: 'Líder en Formación', xpNeeded: 1200 },
  { level: 5, name: 'Comunicador Efectivo', xpNeeded: 1900 },
  { level: 6, name: 'Estratega', xpNeeded: 2800 },
  { level: 7, name: 'Mentor', xpNeeded: 4000 },
  { level: 8, name: 'Maestro', xpNeeded: 5500 },
];

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  async findById(id: string) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.repo.save(user);
  }

  async addXp(userId: string, amount: number) {
    const user = await this.findById(userId);
    user.xp += amount;
    // Level up
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (user.xp >= LEVELS[i].xpNeeded) {
        user.level = LEVELS[i].level;
        break;
      }
    }
    return this.repo.save(user);
  }

  async incrementStreak(userId: string) {
    const user = await this.findById(userId);
    user.streak += 1;
    return this.repo.save(user);
  }

  getLevelInfo(xp: number) {
    let current = LEVELS[0];
    let next = LEVELS[1];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xpNeeded) {
        current = LEVELS[i];
        next = LEVELS[i + 1] || LEVELS[i];
        break;
      }
    }
    return {
      level: current.level,
      name: current.name,
      currentXp: xp,
      nextLevelXp: next.xpNeeded,
      progress: next.xpNeeded > current.xpNeeded
        ? Math.round(((xp - current.xpNeeded) / (next.xpNeeded - current.xpNeeded)) * 100)
        : 100,
    };
  }
}
