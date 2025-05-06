import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as Tesseract from 'tesseract.js';
import * as xlsx from 'xlsx';
import officeParser from 'officeparser';

export async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  console.log(`[extractTextFromFile] 파일명: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size}`);
  if (file.mimetype === 'application/pdf') {
    const data = await pdfParse(file.buffer);
    return data.text;
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  } else if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf-8');
  } else if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg'
  ) {
    const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng+kor');
    return text;
  } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    let text = '';
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      text += xlsx.utils.sheet_to_csv(sheet);
    });
    return text;
  } else if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    file.originalname.toLowerCase().endsWith('.pptx')
  ) {
    try {
      const config = {};
      const data = await officeParser.parseOfficeAsync(file.buffer, config);
      return data;
    } catch (err) {
      throw new Error('PPTX 파일 텍스트 추출 실패: ' + err);
    }
  } else if (
    file.mimetype === 'application/vnd.ms-powerpoint' ||
    file.originalname.toLowerCase().endsWith('.ppt')
  ) {
    throw new Error('PPT(97-2003) 파일은 현재 지원하지 않습니다. PPTX 파일로 변환 후 업로드해 주세요.');
  } else {
    throw new Error('지원하지 않는 파일 형식입니다.');
  }
}