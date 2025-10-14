import { Injectable } from '@nestjs/common';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Carrier } from './entities/carrier.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CarriersService {
  constructor(
    @InjectRepository(Carrier)
    private readonly carriersRepo: Repository<Carrier>,
  ) {}

  async create(createCarrierDto: CreateCarrierDto) {
    return await this.carriersRepo.save(createCarrierDto);
  }

  async findAll() {
    return await this.carriersRepo.find();
  }

  async findOne(id: number) {
    return await this.carriersRepo.findOne({ where: { id: id } });
  }

  async update(id: number, updateCarrierDto: UpdateCarrierDto) {
    await this.carriersRepo.update(id, updateCarrierDto);
    return await this.carriersRepo.findOne({ where: { id: id } });
  }

  async remove(id: number) {
    const carrier = await this.carriersRepo.findOne({
      where: { id: id },
    });
    await this.carriersRepo.softDelete(id);
    return carrier;
  }
}
