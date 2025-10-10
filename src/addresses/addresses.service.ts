import { Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './entities/address.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  async create(createAddressDto: CreateAddressDto) {
    if (createAddressDto.isDefault) {
      await this.addressRepo.update(
        { user: { id: createAddressDto.userId }, isDefault: true },
        { isDefault: false },
      );
    }

    const address = this.addressRepo.create(createAddressDto);
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
    return this.addressRepo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number): Promise<Address> {
    const addr = await this.addressRepo.findOneOrFail({ where: { id } });
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
    const address = await this.addressRepo.findOneOrFail({ where: { id } });
    const userId = address.user.id;

    await this.addressRepo.delete(id);

    if (address.isDefault) {
      const another = await this.addressRepo.findOne({
        where: { user: { id: userId } },
        order: { id: 'DESC' },
      });
      if (another) {
        another.isDefault = true;
        await this.addressRepo.save(another);
      }
    }
    return address;
  }
}
