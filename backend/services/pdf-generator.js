const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const INVOICE_TYPE_LABELS = { 0: 'Standard', 1: 'Multipay', 2: 'Donation' };
const TOKEN_TYPE_LABELS = { 0: 'ETH', 1: 'USDC' };

function shortenAddress(addr) {
    if (!addr || addr.length < 12) return addr || 'N/A';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

async function generateInvoicePDF(invoice) {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });

    const pageWidth = doc.page.width;
    const marginLeft = 60;
    const marginRight = 60;
    const contentWidth = pageWidth - marginLeft - marginRight;

    // --- Header ---
    doc.fontSize(28).font('Helvetica-Bold').fillColor('#000000').text('BlindPay', marginLeft, 60);
    doc.fontSize(10).font('Helvetica').fillColor('#666666').text('Privacy-First Payment Receipt', marginLeft, 95);

    // Divider
    doc.moveTo(marginLeft, 120).lineTo(pageWidth - marginRight, 120).strokeColor('#cccccc').lineWidth(1).stroke();

    // --- Invoice Details ---
    let y = 140;
    const labelX = marginLeft;
    const valueX = marginLeft + 160;

    const drawRow = (label, value) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333').text(label, labelX, y);
        doc.fontSize(10).font('Helvetica').fillColor('#000000').text(value || 'N/A', valueX, y, { width: contentWidth - 160 });
        y += 22;
    };

    drawRow('Invoice Hash:', invoice.invoice_hash || 'N/A');
    drawRow('Status:', (invoice.status || 'PENDING').toUpperCase());
    drawRow('Merchant:', shortenAddress(invoice.merchant_address));
    drawRow('Salt:', invoice.salt || 'N/A');
    drawRow('Token Type:', TOKEN_TYPE_LABELS[invoice.token_type] || 'ETH');
    drawRow('Invoice Type:', INVOICE_TYPE_LABELS[invoice.invoice_type] || 'Standard');

    // Timestamps
    y += 10;
    doc.moveTo(marginLeft, y).lineTo(pageWidth - marginRight, y).strokeColor('#eeeeee').lineWidth(0.5).stroke();
    y += 15;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('Timestamps', marginLeft, y);
    y += 20;

    drawRow('Created:', invoice.created_at ? new Date(invoice.created_at).toLocaleString() : 'N/A');
    drawRow('Settled:', invoice.updated_at && invoice.status === 'SETTLED' ? new Date(invoice.updated_at).toLocaleString() : 'N/A');

    // --- Transaction IDs ---
    const txIds = invoice.payment_tx_ids || [];
    if (txIds.length > 0) {
        y += 10;
        doc.moveTo(marginLeft, y).lineTo(pageWidth - marginRight, y).strokeColor('#eeeeee').lineWidth(0.5).stroke();
        y += 15;

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('Transaction IDs', marginLeft, y);
        y += 20;

        txIds.forEach((txId, idx) => {
            doc.fontSize(9).font('Helvetica').fillColor('#000000').text(`${idx + 1}. ${txId}`, marginLeft, y, { width: contentWidth });
            y += 16;
        });
    }

    // --- QR Code ---
    if (invoice.salt) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const paymentLink = `${frontendUrl}/pay?salt=${invoice.salt}`;

        try {
            const qrDataUrl = await QRCode.toDataURL(paymentLink, { width: 140, margin: 1 });
            const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

            y += 20;
            doc.moveTo(marginLeft, y).lineTo(pageWidth - marginRight, y).strokeColor('#eeeeee').lineWidth(0.5).stroke();
            y += 15;

            doc.fontSize(11).font('Helvetica-Bold').fillColor('#333333').text('Payment QR Code', marginLeft, y);
            y += 10;

            doc.image(qrBuffer, marginLeft, y, { width: 120, height: 120 });
            doc.fontSize(8).font('Helvetica').fillColor('#888888').text(paymentLink, marginLeft + 135, y + 50, { width: contentWidth - 135 });
            y += 130;
        } catch (err) {
            console.error('QR code generation failed:', err);
        }
    }

    // --- Footer ---
    const footerY = doc.page.height - 80;
    doc.moveTo(marginLeft, footerY).lineTo(pageWidth - marginRight, footerY).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.fontSize(8).font('Helvetica').fillColor('#999999').text(
        'Secured by STRK20 private payments on Starknet',
        marginLeft, footerY + 12,
        { width: contentWidth, align: 'center' }
    );
    doc.fontSize(7).font('Helvetica').fillColor('#bbbbbb').text(
        `Generated on ${new Date().toLocaleString()}`,
        marginLeft, footerY + 28,
        { width: contentWidth, align: 'center' }
    );

    return doc;
}

module.exports = { generateInvoicePDF };
