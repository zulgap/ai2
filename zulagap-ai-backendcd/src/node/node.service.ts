import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';

@Injectable()
export class NodeService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateNodeDto) {
    return this.prisma.node.create({ data: dto });
  }

  findAll() {
    return this.prisma.node.findMany();
  }

  findOne(id: string) {
    return this.prisma.node.findUnique({ where: { id } });
  }

  update(id: string, dto: UpdateNodeDto) {
    return this.prisma.node.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.node.delete({ where: { id } });
  }
}