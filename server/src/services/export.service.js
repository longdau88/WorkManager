import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from 'docx';
import PDFDocument from 'pdfkit';
import { syncService } from './sync.service.js';

function rows(data) {
    return (data.tasks || []).map(task => [task.title || '', task.status || '', `${task.progress || 0}%`, task.dueDate || '', task.assignee || '']);
}

export const exportService = {
    async data(user) { return syncService.getBootstrapData(user); },
    async docx(user) {
        const data = await this.data(user);
        const tableRows = [new TableRow({ children: ['Công việc', 'Trạng thái', 'Tiến độ', 'Hạn', 'Người thực hiện'].map(text => new TableCell({ children: [new Paragraph({ text, bold: true })] })) }), ...rows(data).map(row => new TableRow({ children: row.map(text => new TableCell({ children: [new Paragraph(String(text))] })) }))];
        const document = new Document({ sections: [{ children: [new Paragraph({ text: 'Báo cáo WorkManager', heading: HeadingLevel.TITLE }), new Paragraph(`Tạo lúc: ${new Date().toLocaleString('vi-VN')}`), new Table({ rows: tableRows })] }] });
        return Packer.toBuffer(document);
    },
    async pdf(user) {
        const data = await this.data(user);
        return new Promise((resolve, reject) => {
            const chunks = []; const pdf = new PDFDocument({ margin: 40 });
            pdf.on('data', chunk => chunks.push(chunk)); pdf.on('end', () => resolve(Buffer.concat(chunks))); pdf.on('error', reject);
            pdf.fontSize(20).text('Báo cáo WorkManager').moveDown().fontSize(10).text(`Tạo lúc: ${new Date().toLocaleString('vi-VN')}`).moveDown();
            rows(data).forEach((row, index) => pdf.fontSize(10).text(`${index + 1}. ${row.join(' | ')}`));
            pdf.end();
        });
    }
};