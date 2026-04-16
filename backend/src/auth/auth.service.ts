import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('El correo ya está registrado');

    const hash = await bcrypt.hash(dto.password, 12);
    const initials = dto.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const user = this.userRepo.create({
      ...dto,
      password: hash,
      avatar: initials,
    });
    await this.userRepo.save(user);

    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'name', 'email', 'password', 'university', 'career', 'semester', 'avatar', 'level', 'xp', 'streak', 'settings', 'createdAt'],
    });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.signToken(user);
    return { user: this.sanitize(user), token };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    return this.sanitize(user);
  }

  private signToken(user: User) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  private sanitize(user: User) {
    const { password, ...safe } = user as any;
    return safe;
  }
}
