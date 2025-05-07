import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: { 
    name: string; 
    identity?: any; 
    documents?: string[]; 
    ragDocs?: string[]; 
    docGuides?: { [docId: string]: string };
    relations?: any[];
  }) {
    this.logger.log(`브랜드 생성 시작: ${JSON.stringify(data)}`);
    const { documents, ragDocs, identity, docGuides, relations, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. 브랜드 생성
      this.logger.log('1. 브랜드 DB 생성');
      const brand = await tx.brand.create({
        data: {
          ...rest,
          identity: { mission: identity?.mission || '' },
          ragDocs: ragDocs ?? [],
          // ★ documents relation 연결
          documents: data.documents && data.documents.length > 0
            ? { connect: data.documents.map(id => ({ id })) }
            : undefined,
        },
      });

      // 2. 문서 연결
      if (documents && documents.length > 0) {
        this.logger.log(`2. 문서 연결: ${documents.join(',')}`);
        await tx.document.updateMany({
          where: { id: { in: documents } },
          data: { brandId: brand.id },
        });
      }

      // 3. 문서별 가이드라인(metadata) 반영
      this.logger.log(`3. 문서별 가이드라인 반영: ${JSON.stringify(docGuides)}`);
      if (docGuides && documents && documents.length > 0) {
        for (const [docId, guide] of Object.entries(docGuides)) {
          this.logger.log(`Updating doc: ${docId} with guide: ${guide}`);
          if (documents.includes(docId)) {
            const doc = await tx.document.findUnique({ where: { id: docId } });
            if (!doc) {
              this.logger.warn(`문서 없음: ${docId}`);
              continue;
            }
            const prevMeta = typeof doc?.metadata === 'object' && doc.metadata !== null ? doc.metadata : {};
            await tx.document.update({
              where: { id: docId },
              data: { metadata: { ...prevMeta, guide } },
            });
          }
        }
      }

      // 4. 문서 관계 반영 (중복/유효성 체크)
      if (relations && Array.isArray(relations)) {
        this.logger.log(`4. 문서 관계 반영: ${JSON.stringify(relations)}`);
        for (const rel of relations) {
          // fromId, toId가 실제 문서인지 체크
          const fromExists = await tx.document.findUnique({ where: { id: rel.fromId } });
          const toExists = await tx.document.findUnique({ where: { id: rel.toId } });
          if (!fromExists || !toExists) {
            this.logger.warn(`관계 문서 없음: fromId=${rel.fromId}, toId=${rel.toId}`);
            continue;
          }

          // brandId undefined 방지
          if (!brand.id) {
            this.logger.error('brandId is required for DocumentRelation');
            throw new Error('brandId is required for DocumentRelation');
          }

          // 중복 방지 (unique index 추천)
          const exists = await tx.documentRelation.findFirst({
            where: {
              fromId: rel.fromId,
              toId: rel.toId,
              type: rel.type,
              brandId: brand.id,
            },
          });
          if (!exists) {
            await tx.documentRelation.create({
              data: {
                fromId: rel.fromId,
                toId: rel.toId,
                type: rel.type,
                prompt: rel.prompt,
                seq: rel.seq,
                brandId: brand.id, // 반드시 string
              },
            });
          }
        }
      }

      this.logger.log(`브랜드 생성 완료: id=${brand.id}`);
      return brand;
    });
  }

  async findAll() {
    return this.prisma.brand.findMany({
      include: { documents: true },
    });
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { documents: true },
    });
    this.logger.log('findUnique 결과:', brand);
    return brand;
  }

  async update(id: string, data: { 
    name?: string; 
    identity?: any; 
    documents?: string[]; 
    ragDocs?: string[];
    docGuides?: { [docId: string]: string };
    relations?: any[];
  }) {
    const { documents, ragDocs, identity, docGuides, relations, ...rest } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. 브랜드 정보 업데이트
      const brand = await tx.brand.update({
        where: { id },
        data: {
          ...rest,
          identity: { mission: identity?.mission || '' },
          ...(ragDocs ? { ragDocs } : {}),
        },
      });

      // 2. 문서 연결 업데이트
      if (documents && documents.length > 0) {
        await tx.document.updateMany({
          where: { brandId: id },
          data: { brandId: null },
        });
        await tx.document.updateMany({
          where: { id: { in: documents } },
          data: { brandId: id },
        });
      }

      // 3. 문서별 가이드라인(metadata) 업데이트
      if (docGuides && documents && documents.length > 0) {
        for (const [docId, guide] of Object.entries(docGuides)) {
          if (documents.includes(docId)) {
            const doc = await tx.document.findUnique({ where: { id: docId } });
            const prevMeta = typeof doc?.metadata === 'object' && doc.metadata !== null ? doc.metadata : {};
            await tx.document.update({
              where: { id: docId },
              data: { metadata: { ...prevMeta, guide } },
            });
          }
        }
      }

      // 4. 문서 관계 업데이트 (선택한 문서만 삭제 후 재생성)
      if (relations && Array.isArray(relations)) {
        // 수정 대상 문서 id 목록 추출
        const docIds = Array.from(new Set(relations.map(r => r.fromId)));

        // 1. 해당 문서들의 기존 관계만 삭제
        await tx.documentRelation.deleteMany({
          where: {
            brandId: id,
            fromId: { in: docIds },
          },
        });

        // 2. 새 관계 일괄 추가 (createMany)
        if (relations.length > 0) {
          const data = relations.map((rel: any) => ({
            fromId: rel.fromId,
            toId: rel.toId,
            type: rel.type,
            prompt: rel.prompt,
            seq: rel.seq,
            brandId: id,
          }));
          await tx.documentRelation.createMany({ data });
        }

        // 3. relations 필드 동기화
        for (const docId of docIds) {
          const relsForDoc = relations.filter(r => r.fromId === docId);
          await tx.document.update({
            where: { id: docId, brandId: id },
            data: { relations: relsForDoc },
          });
        }
      }

      return brand;
    });
  }

  async remove(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    try {
      // 1. 브랜드에 연결된 문서 id 목록 조회
      const documents = await this.prisma.document.findMany({
        where: { brandId: id },
        select: { id: true },
      });
      const docIds = documents.map(doc => doc.id);

      // 2. 각 문서의 청크, 문서관계, 기타 참조 데이터 먼저 삭제
      if (docIds.length > 0) {
        await this.prisma.documentChunk.deleteMany({
          where: { documentId: { in: docIds } },
        });
        await this.prisma.documentRelation.deleteMany({
          where: {
            OR: [
              { fromId: { in: docIds } },
              { toId: { in: docIds } },
            ],
          },
        });
        await this.prisma.document.deleteMany({
          where: { id: { in: docIds } },
        });
      }

      // 3. 브랜드 삭제
      return await this.prisma.brand.delete({ where: { id } });
    } catch (e) {
      this.logger.error('브랜드 삭제 중 오류', e);
      throw new InternalServerErrorException(e?.message || e);
    }
  }

  async addRagDoc(brandId: string, docId: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new Error('Brand not found');
    const ragDocs = Array.from(new Set([...(brand.ragDocs || []), docId]));
    return this.prisma.brand.update({
      where: { id: brandId },
      data: { ragDocs },
    });
  }

  async findAllWithRagDocs() {
    const brands = await this.prisma.brand.findMany({
      include: { documents: true },
    });
    // ... ragDocs 처리 ...
    // brands가 null/undefined일 경우 빈 배열 반환
    if (!Array.isArray(brands)) return [];
    // ...이하 동일...
    return brands.map(brand => ({
      ...brand,
      documents: brand.documents.map(doc => ({
        ...doc,
        metadata: typeof doc.metadata === 'object' && doc.metadata !== null ? doc.metadata : {},
        guide:
          typeof doc.metadata === 'object' &&
          doc.metadata !== null &&
          'guide' in doc.metadata
            ? (doc.metadata as any).guide
            : '',
      })),
      identity: {
        ...(typeof brand.identity === 'object' && brand.identity !== null ? brand.identity : {}),
        docGuides:
          typeof brand.identity === 'object' &&
          brand.identity !== null &&
          'docGuides' in brand.identity &&
          typeof (brand.identity as any).docGuides === 'object' &&
          (brand.identity as any).docGuides !== null
            ? (brand.identity as any).docGuides
            : {},
      },
    }));
  }

  async findOneWithRagDocs(id: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      include: { documents: true }, // ← 반드시 명시!
    });
    if (!brand) {
      throw new NotFoundException('브랜드를 찾을 수 없습니다.');
    }
    return brand;
  }

  async getDocumentDetailWithChunks(brandId: string, docId: string) {
    this.logger.log(`문서 상세+청크 조회: brandId=${brandId}, docId=${docId}`);
    const doc = await this.prisma.document.findUnique({
      where: { id: docId, brandId },
      include: { chunks: true },
    });
    if (!doc) {
      this.logger.warn(`문서 또는 브랜드를 찾을 수 없음: brandId=${brandId}, docId=${docId}`);
    }
    return doc;
  }

  async getRagDocs(id: string) {
    this.logger.log(`브랜드 ragDocs 조회: id=${id}`);
    const brand = await this.prisma.brand.findUnique({
      where: { id },
      select: { ragDocs: true },
    });
    if (!brand) {
      this.logger.error('Brand not found');
      throw new Error('Brand not found');
    }
    return brand.ragDocs;
  }

  async updateRagDocs(id: string, ragDocs: string[]) {
    this.logger.log(`브랜드 ragDocs 업데이트: id=${id}, ragDocs=${JSON.stringify(ragDocs)}`);
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      this.logger.error('Brand not found');
      throw new Error('Brand not found');
    }
    return this.prisma.brand.update({
      where: { id },
      data: { ragDocs },
    });
  }
}