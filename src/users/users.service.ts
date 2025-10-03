import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
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
    return await this.usersRepository.find();
  }

  async findOne(id: number) {
    return await this.usersRepository.findOne({ where: { id: id } });
  }

  async findOneByEmail(email: string) {
    const user = await this.usersRepository.findOneOrFail({
      where: { email: email },
    });
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      const hash = await bcrypt.hash(updateUserDto.password, 10);
      const user = this.usersRepository.create({
        email: updateUserDto.email,
        name: updateUserDto.name,
        passwordHash: hash,
        age: updateUserDto.age,
      });

      return await this.usersRepository.update(id, user);
    }
  }

  async remove(id: number) {
    return await this.usersRepository.softDelete(id);
  }
}
