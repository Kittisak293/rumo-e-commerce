import { Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(createAddressDto: CreateAddressDto) {
    if (createAddressDto.isDefault) {
      await this.addressRepo.update(
        { user: { id: createAddressDto.userId }, isDefault: true },
        { isDefault: false },
      );
    }

    const address = this.addressRepo.create(createAddressDto);
    const user = await this.usersRepo.findOneOrFail({
      where: { id: createAddressDto.userId },
    });
    address.user = user;
    const saved = await this.addressRepo.save(address);

    const hasDefault = await this.addressRepo.exists({
      where: { user: { id: createAddressDto.userId }, isDefault: true },
    });
    if (!hasDefault) {
      saved.isDefault = true;
      await this.addressRepo.save(saved);
    }

    return saved;
  }

  async findAll(): Promise<Address[]> {
    return this.addressRepo.find({
      order: { id: 'DESC' },
      relations: ['user'],
    });
  }

  async findOne(id: number): Promise<Address> {
    const addr = await this.addressRepo.findOneOrFail({
      where: { id },
      relations: ['user'],
    });
    return addr;
  }

  async findByUser(userId: number): Promise<Address[]> {
    return this.addressRepo.find({
      where: { user: { id: userId } },
      order: { isDefault: 'DESC', id: 'DESC' },
    });
  }

  async update(
    id: number,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.addressRepo.findOneOrFail({ where: { id } });
    const userId = address.user.id;

    if (updateAddressDto.isDefault) {
      await this.addressRepo.update(
        { user: { id: userId }, isDefault: true },
        { isDefault: false },
      );
    }
    await this.addressRepo.update(id, address);
    return await this.addressRepo.findOneOrFail({ where: { id: id } });
  }

  async remove(id: number) {
    const address = await this.addressRepo.findOneOrFail({
      where: { id },
      relations: ['user'],
    });

    if (address.isDefault) {
      const another = await this.addressRepo.findOne({
        where: { user: { id: address.user.id } },
        order: { id: 'DESC' },
      });
      if (another) {
        another.isDefault = true;
        await this.addressRepo.save(another);
      }
    }

    await this.addressRepo.softDelete(id);
    return address;
  }
}
