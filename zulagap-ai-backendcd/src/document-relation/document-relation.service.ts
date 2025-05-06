import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentRelationDto } from './dto/create-document-relation.dto';
import { UpdateDocumentRelationDto } from './dto/update-document-relation.dto';

@Injectable()
export class DocumentRelationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    fromId: string;
    toId: string;
    type: string;
    prompt?: string;
    seq?: number;
    brandId: string;
    agentId?: string;
    teamId?: string;
    workflowId?: string;
    nodeId?: string;
  }) {
    console.log('[BACK] DocumentRelationsService.create data:', data);

    // 필수값 검증
    if (!data.fromId || !data.toId || !data.type || !data.brandId) {
      console.error('[BACK] 필수값 누락:', data);
      throw new BadRequestException('필수값(fromId, toId, type, brandId)이 누락되었습니다.');
    }

    // (선택) 실제 문서/브랜드 존재 여부 확인
    // const fromDoc = await this.prisma.document.findUnique({ where: { id: data.fromId } });
    // const toDoc = await this.prisma.document.findUnique({ where: { id: data.toId } });
    // const brand = await this.prisma.brand.findUnique({ where: { id: data.brandId } });
    // if (!fromDoc || !toDoc || !brand) {
    //   throw new BadRequestException('fromId, toId, brandId 중 존재하지 않는 값이 있습니다.');
    // }

    try {
      const result = await this.prisma.documentRelation.create({
        data: {
          fromId: data.fromId,
          toId: data.toId,
          type: data.type,
          prompt: data.prompt,
          seq: data.seq,
          brandId: data.brandId,
          agentId: data.agentId,
          teamId: data.teamId,
          workflowId: data.workflowId,
          nodeId: data.nodeId,
        }
      });
      console.log('[BACK] DocumentRelationsService.create result:', result);
      if (!result || !result.id) {
        throw new Error('관계 저장 실패: Prisma에서 반환된 id가 없습니다.');
      }
      return result;
    } catch (e: any) {
      console.error('[BACK] DocumentRelationsService.create error:', e);
      throw new BadRequestException('[BACK] 관계 저장 실패: ' + (e?.message || e));
    }
  }

  async findAll() {
    return await this.prisma.documentRelation.findMany();
  }

  async findOne(id: string) {
    const relation = await this.prisma.documentRelation.findUnique({ where: { id } });
    if (!relation) throw new NotFoundException('관계가 존재하지 않습니다.');
    return relation;
  }

  async findByDocumentId(documentId: string) {
    return await this.prisma.documentRelation.findMany({
      where: {
        OR: [{ fromId: documentId }, { toId: documentId }],
      },
    });
  }

  async update(id: string, data: UpdateDocumentRelationDto) {
    try {
      const updated = await this.prisma.documentRelation.update({ where: { id }, data });
      return updated;
    } catch (error) {
      throw new NotFoundException('수정할 관계가 존재하지 않습니다.');
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.documentRelation.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException('삭제할 관계가 존재하지 않습니다.');
    }
  }

  async removeByDocumentId(documentId: string) {
    return this.prisma.documentRelation.deleteMany({
      where: {
        OR: [
          { fromId: documentId },
          { toId: documentId }
        ]
      }
    });
  }

  async findOneWithRagDocs(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { documents: true },
    });
    if (!brand) throw new NotFoundException('브랜드가 존재하지 않습니다.');
    return {
      ...brand,
      documents: (brand.documents ?? []).map(doc => ({
        ...doc,
        title: doc.title ?? doc.id,
        guide: typeof doc.metadata === 'object' && doc.metadata !== null && 'guide' in doc.metadata
          ? (doc.metadata as any).guide
          : '',
      })),
    };
  }

  async findDocumentWithRelations(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
      include: {
        relationsFrom: true,
        relationsTo: true,
      },
    });
  }
}
