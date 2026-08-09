import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let repo: {
    findOne: jest.Mock;
    findOneOrFail: jest.Mock;
    update: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    softDelete: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn().mockResolvedValue(null),
      findOneOrFail: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      create: jest.fn((x) => x),
      save: jest.fn((x) => Promise.resolve({ id: 7, ...x })),
      find: jest.fn().mockResolvedValue([]),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('findOneByEmailForAuth', () => {
    it('returns null rather than throwing, so auth cannot leak a 500', async () => {
      await expect(
        service.findOneByEmailForAuth('nobody@example.com'),
      ).resolves.toBeNull();
      expect(repo.findOneOrFail).not.toHaveBeenCalled();
    });

    it('trims the address but preserves its casing', async () => {
      await service.findOneByEmailForAuth('  User@Example.com  ');
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { email: 'User@Example.com' },
      });
    });
  });

  describe('markEmailVerified', () => {
    it('flips only the emailVerified column', async () => {
      await service.markEmailVerified(7);
      expect(repo.update).toHaveBeenCalledWith(7, { emailVerified: true });
    });
  });

  describe('updatePasswordHash', () => {
    it('writes only the hash, never email or role', async () => {
      await service.updatePasswordHash(7, 'new-hash');
      expect(repo.update).toHaveBeenCalledWith(7, {
        passwordHash: 'new-hash',
      });
    });
  });

  describe('create', () => {
    it('stores a bcrypt hash rather than the raw password', async () => {
      await service.create({
        email: 'new@example.com',
        name: 'New',
        password: 'password123',
        age: 20,
      });

      const saved = repo.save.mock.calls[0][0] as Record<string, string>;
      expect(saved.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(JSON.stringify(saved)).not.toContain('password123');
    });

    it('never lets a caller pick their own role', async () => {
      await service.create({
        email: 'new@example.com',
        name: 'New',
        password: 'password123',
        age: 20,
        role: 'admin',
      } as never);

      const saved = repo.save.mock.calls[0][0] as Record<string, string>;
      expect(saved.role).toBe('customer');
    });
  });
});
