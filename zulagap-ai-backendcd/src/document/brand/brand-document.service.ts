import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentService } from '../document.service';
import { extractTextFromFile } from '../utilles/extractTextFromFile';
import { VectorStoreService } from '../vectorstore/vectorstore.service'; // 변경: 서비스 import

function parseJson(value: any) {
  if (!value) return undefined;
  try {
    return typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return value;
  }
}

@Injectable()
export class BrandDocumentService {
  constructor(
    private prisma: PrismaService,
    private documentService: DocumentService,
    private vectorStoreService: VectorStoreService, // ← 의존성 주입
  ) {}

  // 브랜드별 문서 목록 조회
  async findAllByBrand(brandId: string) {
    try {
      console.log('[BrandDocumentService] findAllByBrand 호출:', brandId);
      return await this.prisma.document.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (e) {
      console.error('[BrandDocumentService] findAllByBrand 오류:', e);
      throw e;
    }
  }

  // 브랜드별 문서 생성
  async createForBrand(brandId: string, data: any) {
    try {
      const { file, title, content, metadata, source, relations, embedding } = data;
      if (!file || !title) {
        throw new Error('file 또는 title이 없습니다.');
      }

      // 1. 파일에서 텍스트 추출 (content가 없으면)
      let docContent = content ?? '';
      if (!docContent && file) {
        try {
          docContent = await extractTextFromFile(file);
        } catch (e) {
          console.warn('[BrandDocumentService] 파일 텍스트 추출 실패:', e);
        }
      }

      // 2. 문서 저장
      const document = await this.prisma.document.create({
        data: {
          title,
          content: docContent,
          brandId,
          size: file.size,
          mimetype: file.mimetype,
          source: source ?? undefined,
          metadata: parseJson(metadata),
          relations: parseJson(relations),
          embedding: parseJson(embedding),
          isBrandOnly: true,
          isTeamOnly: false,
          isAgentOnly: false,
        }
      });

      // 3. 청크/임베딩/벡터스토어 저장
      if (docContent) {
        await this.vectorStoreService.processAndStoreTextToVectorStore(docContent, {
          documentId: document.id,
          brandId,
          title,
        });
      }

      // 문서 저장 후 청크 재생성
      await this.documentService.regenChunks(document.id);

      return document;
    } catch (e) {
      console.error('[BrandDocumentService] createForBrand 오류:', e);
      throw e;
    }
  }

  // 브랜드별 문서 삭제
  async removeFromBrand(brandId: string, documentId: string) {
    try {
      console.log('[BrandDocumentService] removeFromBrand 호출:', { brandId, documentId });
      return await this.prisma.document.deleteMany({
        where: { id: documentId, brandId },
      });
    } catch (e) {
      console.error('[BrandDocumentService] removeFromBrand 오류:', e);
      throw e;
    }
  }

  // 브랜드별 RAG 문서 목록 (예시)
  async getBrandRagDocs(brandId: string) {
    try {
      console.log('[BrandDocumentService] getBrandRagDocs 호출:', brandId);
      const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
      if (!brand?.ragDocs) return [];
      return await this.prisma.document.findMany({
        where: { id: { in: brand.ragDocs } },
      });
    } catch (e) {
      console.error('[BrandDocumentService] getBrandRagDocs 오류:', e);
      throw e;
    }
  }
}