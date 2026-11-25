import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fcfa } from './lib.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO = path.join(__dirname, 'logo.jpg');
const GOLD = '#B8902A';
const INK = '#111111';
const GREY = '#6B6B6B';

const methodLabel = { card: 'Carte bancaire', flooz: 'Flooz (Moov Money)', mixx: 'Mixx by Yas', international: 'Paiement international' };

// Attestation électronique : numéro unique, QR code de vérification, signature électronique, logo PERFEKT
export async function certificatePdf(res, { number, name, course, score, issuedAt, signature, verifyUrl, hours }) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="attestation-${number}.pdf"`);
  doc.pipe(res);
  const W = doc.page.width, H = doc.page.height;

  doc.rect(0, 0, W, H).fill('#FFFFFF');
  doc.lineWidth(1.2).strokeColor(GOLD).rect(24, 24, W - 48, H - 48).stroke();
  doc.lineWidth(0.4).rect(32, 32, W - 64, H - 64).stroke();

  doc.image(LOGO, W / 2 - 55, 48, { width: 110 });

  doc.fillColor(GOLD).font('Helvetica').fontSize(10).text('PERFEKT ACADEMY', 0, 165, { width: W, align: 'center', characterSpacing: 4 });
  doc.fillColor(INK).font('Times-Roman').fontSize(40).text('Attestation de réussite', 0, 185, { width: W, align: 'center' });
  doc.fillColor(GREY).font('Helvetica').fontSize(12).text('Nous certifions que', 0, 245, { width: W, align: 'center' });
  doc.fillColor(INK).font('Times-Bold').fontSize(32).text(name, 0, 268, { width: W, align: 'center' });
  doc.moveTo(W / 2 - 170, 310).lineTo(W / 2 + 170, 310).lineWidth(0.6).strokeColor(GOLD).stroke();
  doc.fillColor(GREY).font('Helvetica').fontSize(12)
    .text('a suivi avec succès la formation', 0, 325, { width: W, align: 'center' });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text(course, 60, 347, { width: W - 120, align: 'center' });
  doc.fillColor(GREY).font('Helvetica').fontSize(11)
    .text(`Score à l'examen final : ${score} %${hours ? `   ·   Durée : ${hours} h` : ''}   ·   Délivrée le ${new Date(issuedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 0, 380, { width: W, align: 'center' });

  // Signature électronique
  const sx = 90, sy = H - 150;
  doc.fillColor(INK).font('Times-Italic').fontSize(22).text('Perfekt Agency', sx, sy);
  doc.moveTo(sx, sy + 32).lineTo(sx + 200, sy + 32).lineWidth(0.5).strokeColor(INK).stroke();
  doc.fillColor(GREY).font('Helvetica').fontSize(9).text('La Direction — PERFEKT AGENCY', sx, sy + 38);
  doc.fontSize(7).text(`Signature électronique : ${signature}`, sx, sy + 52, { width: 260 });

  // QR code de vérification
  const qr = await QRCode.toBuffer(verifyUrl, { margin: 0, width: 220, color: { dark: '#111111', light: '#FFFFFF' } });
  doc.image(qr, W - 190, H - 165, { width: 95 });
  doc.fillColor(GREY).font('Helvetica').fontSize(8).text('Vérifier l’authenticité', W - 205, H - 64, { width: 125, align: 'center' });

  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(10).text(`N° ${number}`, 0, H - 64, { width: W, align: 'center' });
  doc.end();
}

export function invoicePdf(res, { order, user, course }) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="facture-${order.reference}.pdf"`);
  doc.pipe(res);
  const W = doc.page.width;

  doc.image(LOGO, 50, 40, { width: 80 });
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(22).text(order.status === 'paid' ? 'FACTURE / REÇU' : 'FACTURE PRO FORMA', 250, 60, { width: W - 300, align: 'right' });
  doc.font('Helvetica').fontSize(10).fillColor(GREY)
    .text(`Référence : ${order.reference}`, 250, 92, { width: W - 300, align: 'right' })
    .text(`Date : ${new Date(order.paid_at || order.created_at).toLocaleDateString('fr-FR')}`, { width: W - 300, align: 'right' })
    .text(`Statut : ${order.status === 'paid' ? 'Payée' : order.status}`, { width: W - 300, align: 'right' });

  doc.moveTo(50, 150).lineTo(W - 50, 150).strokeColor(GOLD).lineWidth(1).stroke();
  doc.fillColor(GOLD).font('Helvetica-Bold').fontSize(9).text('ÉMETTEUR', 50, 170).text('CLIENT', 320, 170);
  doc.fillColor(INK).font('Helvetica').fontSize(10)
    .text('PERFEKT AGENCY\nPERFEKT Academy\nLomé, Togo', 50, 186)
    .text(`${user.name}\n${user.email}${user.phone ? '\n' + user.phone : ''}`, 320, 186);

  const y = 270;
  doc.rect(50, y, W - 100, 26).fill('#F5F3EE');
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(10).text('Désignation', 60, y + 8).text('Montant', W - 200, y + 8, { width: 140, align: 'right' });
  doc.font('Helvetica').text(`Formation en ligne — ${course.title}`, 60, y + 40, { width: 330 })
    .text(fcfa(order.original_amount), W - 200, y + 40, { width: 140, align: 'right' });
  let yy = y + 70;
  if (order.coupon_code) {
    doc.fillColor(GREY).text(`Remise (code ${order.coupon_code})`, 60, yy).text('- ' + fcfa(order.original_amount - order.amount), W - 200, yy, { width: 140, align: 'right' });
    yy += 24;
  }
  doc.moveTo(50, yy + 6).lineTo(W - 50, yy + 6).strokeColor('#DDDDDD').lineWidth(0.5).stroke();
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(13).text('Total TTC', 60, yy + 18).text(fcfa(order.amount), W - 220, yy + 18, { width: 160, align: 'right' });
  doc.font('Helvetica').fontSize(10).fillColor(GREY).text(`Moyen de paiement : ${methodLabel[order.method] || order.method}`, 60, yy + 50);

  doc.fontSize(8).fillColor(GREY).text('Merci pour votre confiance. Document généré automatiquement par la plateforme PERFEKT Academy.', 50, 760, { width: W - 100, align: 'center' });
  doc.end();
}
