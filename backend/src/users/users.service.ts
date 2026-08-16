import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

const PUBLIC_USER_SELECT = [
  'id',
  'email',
  'name',
  'role',
  'age',
  'emailVerified',
  'createdAt',
] as const;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hash = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      email: createUserDto.email,
      name: createUserDto.name,
      passwordHash: hash,
      role: 'customer',
      age: createUserDto.age,
    });
    return await this.usersRepository.save(user);
  }

  async findAll() {
    return await this.usersRepository.find({
      select: [...PUBLIC_USER_SELECT],
    });
  }

  async findOne(id: number) {
    return await this.usersRepository.findOne({
      where: { id: id },
      select: [...PUBLIC_USER_SELECT],
    });
  }

  async findOneByEmail(email: string) {
    const user = await this.usersRepository.findOneOrFail({
      where: { email: email },
    });
    return user;
  }

  /**
   * Auth-facing lookup: returns null instead of throwing.
   *
   * findOneByEmail throws EntityNotFoundError, which Nest maps to a 500 while a
   * wrong password returns 401 — that status difference tells an attacker which
   * addresses have accounts. Auth must not be able to leak that.
   */
  async findOneByEmailForAuth(email: string): Promise<User | null> {
    // Only trimmed, not lower-cased: existing rows were stored with whatever
    // casing they registered with, and SQLite compares strings case-sensitively.
    return await this.usersRepository.findOne({
      where: { email: email.trim() },
    });
  }

  async markEmailVerified(id: number): Promise<void> {
    await this.usersRepository.update(id, { emailVerified: true });
  }

  /**
   * Narrow write for the password-reset flow. Kept separate from update() so a
   * reset can never touch email, role or any other column.
   */
  async updatePasswordHash(id: number, passwordHash: string): Promise<void> {
    await this.usersRepository.update(id, { passwordHash });
  }

  /**
   * `role` is never accepted here — it never reaches the DTO (whitelisted
   * out by ValidationPipe since CreateUserDto has no `role` field) and is
   * changed exclusively through `updateRole`, which carries the
   * last-admin/self-change safety checks. Only writes the fields actually
   * sent, and always returns the updated row (previously returned
   * `undefined` and did nothing when `password` was omitted).
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const patch: Partial<User> = {};
    if (updateUserDto.email !== undefined) patch.email = updateUserDto.email;
    if (updateUserDto.name !== undefined) patch.name = updateUserDto.name;
    if (updateUserDto.age !== undefined) patch.age = updateUserDto.age;
    if (updateUserDto.password) {
      patch.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (Object.keys(patch).length > 0) {
      await this.usersRepository.update(id, patch);
    }

    return await this.findOne(id);
  }

  /**
   * The only path allowed to change `role`. Two safety checks live here
   * (not in the controller/UI) because the API is reachable directly:
   *  - an admin cannot change their own role, in either direction
   *  - the last remaining (non-deleted) admin cannot be demoted
   * The count-then-write is wrapped in one transaction with a row lock on
   * the target so two concurrent demotions can't both pass the count check
   * and leave zero admins.
   */
  async updateRole(
    actorId: number,
    targetId: number,
    nextRole: 'admin' | 'customer',
  ) {
    if (actorId === targetId) {
      throw new ForbiddenException('Admins cannot change their own role');
    }

    return await this.dataSource.transaction(async (manager) => {
      const target = await manager.findOne(User, {
        where: { id: targetId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!target) {
        throw new NotFoundException('User not found');
      }

      if (target.role === nextRole) {
        return await manager.findOne(User, {
          where: { id: targetId },
          select: [...PUBLIC_USER_SELECT],
        });
      }

      if (target.role === 'admin' && nextRole === 'customer') {
        const adminCount = await manager.count(User, {
          where: { role: 'admin' },
        });
        if (adminCount <= 1) {
          throw new ConflictException('Cannot remove the last admin');
        }
      }

      await manager.update(User, targetId, { role: nextRole });

      return await manager.findOne(User, {
        where: { id: targetId },
        select: [...PUBLIC_USER_SELECT],
      });
    });
  }

  async remove(id: number) {
    return await this.usersRepository.softDelete(id);
  }
}
