import type React from 'react';
import { useState } from 'react';
import { Printer, Download, Loader2, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AgreementDraft } from '../../../lib/agreementBuilder/types';
import { generateAgreementPdf } from '../../../lib/agreementPdf';

interface Props {
  draft: AgreementDraft;
}

function formatIndianDate(dateStr: string): string {
  if (!dateStr) return '____________________';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function convert(num: number): string {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  }
  return convert(Math.round(n)) + ' Only';
}

function parseDeliverables(text: string): { deliverable: string; timeline: string }[] {
  return text.split('\n').filter((l) => l.trim()).map((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      return { deliverable: line.slice(0, colonIdx).replace(/^[•\-\s]+/, '').trim(), timeline: line.slice(colonIdx + 1).trim() };
    }
    return { deliverable: line.replace(/^[•\-\s]+/, '').trim(), timeline: '' };
  });
}

const THEMES = {
  bw: { primary: '#111111', accent: '#333333', headerBg: '#111111', titleBg: '#f5f5f5', border: '#cccccc', rowAlt: '#f0f0f0', text: '#1a1a1a', subtext: '#555555', lightBg: '#e8e8e8' },
  navy: { primary: '#1a3a6c', accent: '#2d5aa0', headerBg: '#1a3a6c', titleBg: '#dde8ff', border: '#a5b8e8', rowAlt: '#eef3ff', text: '#0f1f3d', subtext: '#2d4a8a', lightBg: '#dde8ff' },
  slate: { primary: '#1e293b', accent: '#475569', headerBg: '#1e293b', titleBg: '#e8edf5', border: '#94a3b8', rowAlt: '#f1f5f9', text: '#0f172a', subtext: '#475569', lightBg: '#e2e8f0' },
  'corporate-green': { primary: '#14532d', accent: '#166534', headerBg: '#14532d', titleBg: '#dcfce7', border: '#86efac', rowAlt: '#d1fae5', text: '#052e16', subtext: '#15803d', lightBg: '#bbf7d0' },
};

const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

interface AgreementDocProps {
  draft: AgreementDraft;
}

function AgreementDocument({ draft }: AgreementDocProps) {
  const theme = THEMES[draft.pdfTheme as keyof typeof THEMES] || THEMES.bw;

  const subtotal = draft.services.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalGst = draft.includeGst ? draft.services.reduce((sum, s) => sum + (s.amount * (s.gstRate || 0)) / 100, 0) : 0;
  const grandTotal = subtotal + totalGst;

  const deliverableRows = parseDeliverables(draft.deliverables || '');
  const hasTableDeliverables = deliverableRows.length > 0 && !!deliverableRows[0].timeline;

  let sectionNum = 0;
  const nextSection = () => ++sectionNum;

  const cellPad: React.CSSProperties = { padding: '8px 12px' };
  const thStyle: React.CSSProperties = { padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#ffffff' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 10, border: `1px solid ${theme.border}` };

  const SectionHeader = ({ title }: { title: string }) => {
    const num = nextSection();
    return (
      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: theme.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{num}</div>
          <div style={{ flex: 1, borderBottom: `2px solid ${theme.primary}`, paddingBottom: 4 }}>
            <h2 style={{ fontSize: 10, fontWeight: 800, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{title}</h2>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        background: '#ffffff',
        color: theme.text,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        fontSize: 10,
        lineHeight: 1.6,
        width: '100%',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      } as React.CSSProperties}
    >
      <div style={{ background: theme.headerBg, padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' } as React.CSSProperties}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {draft.companyLogo ? (
            <img src={draft.companyLogo} alt="logo" style={{ maxHeight: 64, maxWidth: 200, objectFit: 'contain' }} crossOrigin="anonymous" />
          ) : (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{draft.companyProfile.companyName || 'COMPANY NAME'}</div>
              {draft.companyProfile.cin && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>CIN: {draft.companyProfile.cin}</div>}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', fontSize: 8, lineHeight: 1.9, color: 'rgba(255,255,255,0.85)' }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 9 }}>{draft.companyProfile.companyName.toUpperCase()}</div>
          {draft.companyProfile.address && <div>{draft.companyProfile.address}</div>}
          {draft.companyProfile.phone && <div>Tel: {draft.companyProfile.phone}</div>}
          {draft.companyProfile.email && <div>Email: {draft.companyProfile.email}</div>}
          {draft.companyProfile.website && <div>Web: {draft.companyProfile.website}</div>}
          {draft.companyProfile.gstin && <div>GSTIN: {draft.companyProfile.gstin}</div>}
        </div>
      </div>

      <div style={{ background: theme.titleBg, borderBottom: `3px solid ${theme.primary}`, padding: '16px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: 8, color: theme.subtext, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 5 }}>
          {draft.agreementType.toUpperCase()}
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 900, color: theme.text, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
          {draft.agreementTitle || 'AGREEMENT'}
        </h1>
        {draft.agreementSubtitle && (
          <p style={{ fontSize: 10, fontStyle: 'italic', color: theme.subtext, marginTop: 4, marginBottom: 0 }}>{draft.agreementSubtitle}</p>
        )}
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap' }}>
          {draft.agreementNumber && (
            <div style={{ fontSize: 9, color: theme.subtext }}>
              <span style={{ fontWeight: 600 }}>Agreement No.:</span> {draft.agreementNumber}
            </div>
          )}
          <div style={{ fontSize: 9, color: theme.subtext }}>
            <span style={{ fontWeight: 600 }}>Date:</span> {formatIndianDate(draft.agreementDate)}
          </div>
          {draft.placeOfExecution && (
            <div style={{ fontSize: 9, color: theme.subtext }}>
              <span style={{ fontWeight: 600 }}>Place:</span> {draft.placeOfExecution}
            </div>
          )}
          {draft.validityPeriod && (
            <div style={{ fontSize: 9, color: theme.subtext }}>
              <span style={{ fontWeight: 600 }}>Validity:</span> {draft.validityPeriod}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 28px 36px' }}>
        <div style={{ background: theme.lightBg, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', marginBottom: 4, fontSize: 10, lineHeight: 1.7 }}>
          This <strong>{draft.agreementType}</strong> ("Agreement") is entered into on <strong>{formatIndianDate(draft.agreementDate)}</strong>
          {draft.placeOfExecution && <> at <strong>{draft.placeOfExecution}</strong></>} by and between:
        </div>

        <SectionHeader title="Parties to the Agreement" />
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: theme.primary }}>
              <th style={{ ...thStyle, width: 120 }}>Role</th>
              <th style={thStyle}>Entity Details</th>
              <th style={{ ...thStyle, width: 150 }}>Signatory</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${theme.border}`, background: '#fff' }}>
              <td style={{ ...cellPad, fontWeight: 700, color: theme.primary, verticalAlign: 'top', fontSize: 9 }}>
                Party 1<br />
                <span style={{ fontWeight: 400, color: theme.subtext }}>Service Provider</span>
              </td>
              <td style={{ ...cellPad, verticalAlign: 'top' }}>
                <div style={{ fontWeight: 700 }}>{draft.companyProfile.companyName}</div>
                {draft.companyProfile.address && <div style={{ color: theme.subtext, fontSize: 9 }}>{draft.companyProfile.address}</div>}
                <div style={{ fontSize: 9, color: theme.subtext, marginTop: 2 }}>
                  {draft.companyProfile.email && <span>Email: {draft.companyProfile.email}</span>}
                  {draft.companyProfile.phone && <span style={{ marginLeft: 8 }}>Tel: {draft.companyProfile.phone}</span>}
                </div>
                {draft.companyProfile.gstin && <div style={{ fontSize: 9, color: theme.subtext }}>GSTIN: {draft.companyProfile.gstin}</div>}
                {draft.companyProfile.pan && <div style={{ fontSize: 9, color: theme.subtext }}>PAN: {draft.companyProfile.pan}</div>}
                {draft.companyProfile.cin && <div style={{ fontSize: 9, color: theme.subtext }}>CIN: {draft.companyProfile.cin}</div>}
              </td>
              <td style={{ ...cellPad, verticalAlign: 'top' }}>
                <div style={{ fontWeight: 700 }}>{draft.companyProfile.signatoryName}</div>
                {draft.companyProfile.designation && <div style={{ color: theme.subtext, fontSize: 9 }}>{draft.companyProfile.designation}</div>}
              </td>
            </tr>
            <tr style={{ background: theme.rowAlt }}>
              <td style={{ ...cellPad, fontWeight: 700, color: theme.primary, verticalAlign: 'top', fontSize: 9 }}>
                Party 2<br />
                <span style={{ fontWeight: 400, color: theme.subtext }}>Client</span>
              </td>
              <td style={{ ...cellPad, verticalAlign: 'top' }}>
                <div style={{ fontWeight: 700 }}>{draft.client.clientName || 'CLIENT NAME'}</div>
                {draft.client.companyName && <div style={{ fontWeight: 600 }}>{draft.client.companyName}</div>}
                {draft.client.address && <div style={{ color: theme.subtext, fontSize: 9 }}>{draft.client.address}</div>}
                <div style={{ fontSize: 9, color: theme.subtext, marginTop: 2 }}>
                  {draft.client.email && <span>Email: {draft.client.email}</span>}
                  {draft.client.phone && <span style={{ marginLeft: 8 }}>Tel: {draft.client.phone}</span>}
                </div>
                {draft.client.gstin && <div style={{ fontSize: 9, color: theme.subtext }}>GSTIN: {draft.client.gstin}</div>}
                {draft.client.pan && <div style={{ fontSize: 9, color: theme.subtext }}>PAN: {draft.client.pan}</div>}
                {draft.customFields.map((f) => {
                  const val = draft.client.customFieldValues[f.id];
                  if (!val) return null;
                  return <div key={f.id} style={{ fontSize: 9, color: theme.subtext }}>{f.label}: {val}</div>;
                })}
              </td>
              <td style={{ ...cellPad, verticalAlign: 'top' }}>
                <div style={{ fontWeight: 700 }}>{draft.client.signatoryName || draft.client.clientName}</div>
                {draft.client.designation && <div style={{ color: theme.subtext, fontSize: 9 }}>{draft.client.designation}</div>}
              </td>
            </tr>
          </tbody>
        </table>

        {draft.scopeOfWork && (
          <>
            <SectionHeader title="Scope of Work" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.scopeOfWork}</div>
          </>
        )}

        {draft.deliverables && (
          <>
            <SectionHeader title="Deliverables & Timeline" />
            {hasTableDeliverables ? (
              <table style={tableStyle}>
                <thead>
                  <tr style={{ background: theme.primary }}>
                    <th style={{ ...thStyle, width: 36 }}>#</th>
                    <th style={thStyle}>Deliverable</th>
                    <th style={{ ...thStyle, width: 190 }}>Timeline / Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {deliverableRows.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 1 ? theme.rowAlt : '#fff', borderBottom: `1px solid ${theme.border}` }}>
                      <td style={{ ...cellPad, textAlign: 'center', color: theme.subtext, fontWeight: 600 }}>{i + 1}</td>
                      <td style={cellPad}>{r.deliverable}</td>
                      <td style={{ ...cellPad, color: theme.subtext }}>{r.timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.deliverables}</div>
            )}
          </>
        )}

        <SectionHeader title="Pricing & Financial Terms" />
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: theme.primary }}>
              <th style={{ ...thStyle, width: 28 }}>#</th>
              <th style={thStyle}>Service / Item</th>
              <th style={thStyle}>Description</th>
              <th style={{ ...thStyle, textAlign: 'center', width: 44 }}>Qty</th>
              <th style={{ ...thStyle, textAlign: 'right', width: 76 }}>Rate</th>
              {draft.includeGst && <th style={{ ...thStyle, textAlign: 'center', width: 52 }}>GST %</th>}
              {draft.includeGst && <th style={{ ...thStyle, textAlign: 'right', width: 72 }}>GST Amt</th>}
              <th style={{ ...thStyle, textAlign: 'right', width: 84 }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {draft.services.filter((s) => s.service).map((s, i) => {
              const gstAmt = draft.includeGst ? (s.amount * s.gstRate) / 100 : 0;
              return (
                <tr key={s.id} style={{ background: i % 2 === 1 ? theme.rowAlt : '#fff', borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ ...cellPad, textAlign: 'center', color: theme.subtext }}>{i + 1}</td>
                  <td style={{ ...cellPad, fontWeight: 600 }}>{s.service}</td>
                  <td style={{ ...cellPad, color: theme.subtext, fontSize: 9 }}>{s.description}</td>
                  <td style={{ ...cellPad, textAlign: 'center', color: theme.subtext }}>{s.quantity} {s.unit}</td>
                  <td style={{ ...cellPad, textAlign: 'right' }}>₹{fmt(s.rate)}</td>
                  {draft.includeGst && <td style={{ ...cellPad, textAlign: 'center', color: theme.subtext }}>{s.gstRate}%</td>}
                  {draft.includeGst && <td style={{ ...cellPad, textAlign: 'right', color: theme.subtext }}>₹{fmt(Math.round(gstAmt))}</td>}
                  <td style={{ ...cellPad, textAlign: 'right', fontWeight: 600 }}>₹{fmt(draft.includeGst ? Math.round(s.amount + gstAmt) : s.amount)}</td>
                </tr>
              );
            })}
            {draft.includeGst && (
              <tr style={{ background: theme.lightBg, borderBottom: `1px solid ${theme.border}` }}>
                <td colSpan={5} style={{ ...cellPad, textAlign: 'right', fontWeight: 600, fontSize: 9 }}>Subtotal (excl. GST)</td>
                <td colSpan={2} style={{ ...cellPad, textAlign: 'right', fontWeight: 600 }}>₹{fmt(subtotal)}</td>
                <td style={{ ...cellPad, textAlign: 'right', fontWeight: 600 }}>₹{fmt(subtotal)}</td>
              </tr>
            )}
            {draft.includeGst && (
              <tr style={{ background: theme.lightBg, borderBottom: `1px solid ${theme.border}` }}>
                <td colSpan={5} style={{ ...cellPad, textAlign: 'right', fontWeight: 600, fontSize: 9 }}>Total GST</td>
                <td colSpan={2} style={{ ...cellPad, textAlign: 'right', fontWeight: 600 }}>₹{fmt(Math.round(totalGst))}</td>
                <td style={{ ...cellPad, textAlign: 'right', fontWeight: 600 }}>₹{fmt(Math.round(totalGst))}</td>
              </tr>
            )}
            <tr style={{ background: theme.primary }}>
              <td colSpan={draft.includeGst ? 7 : 5} style={{ ...cellPad, textAlign: 'right', fontWeight: 800, fontSize: 11, color: '#fff' }}>
                TOTAL CONSIDERATION {draft.includeGst ? '(incl. GST)' : ''}
              </td>
              <td style={{ ...cellPad, textAlign: 'right', fontWeight: 800, fontSize: 12, color: '#fff' }}>₹{fmt(Math.round(grandTotal))}</td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: 6, padding: '8px 12px', background: theme.lightBg, borderRadius: 4, border: `1px solid ${theme.border}`, fontSize: 9 }}>
          <strong>Amount in Words:</strong> Indian Rupees {numberToWords(Math.round(grandTotal))}
        </div>

        {draft.paymentMilestones.length > 0 && (
          <>
            <div style={{ marginTop: 16, marginBottom: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: theme.primary }}>Payment Schedule:</p>
            </div>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: theme.accent }}>
                  <th style={{ ...thStyle, width: 28 }}>#</th>
                  <th style={thStyle}>Milestone</th>
                  <th style={{ ...thStyle, textAlign: 'center', width: 60 }}>%</th>
                  <th style={{ ...thStyle, textAlign: 'right', width: 100 }}>Amount (₹)</th>
                  <th style={{ ...thStyle, width: 150 }}>Due On</th>
                </tr>
              </thead>
              <tbody>
                {draft.paymentMilestones.map((m, i) => (
                  <tr key={m.id} style={{ background: i % 2 === 1 ? theme.rowAlt : '#fff', borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ ...cellPad, textAlign: 'center', color: theme.subtext }}>{i + 1}</td>
                    <td style={cellPad}>{m.label}</td>
                    <td style={{ ...cellPad, textAlign: 'center' }}>{m.percentage}%</td>
                    <td style={{ ...cellPad, textAlign: 'right', fontWeight: 600 }}>₹{fmt(m.amount)}</td>
                    <td style={{ ...cellPad, color: theme.subtext }}>{m.dueOn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {draft.paymentTerms && (
          <>
            <SectionHeader title="Payment Terms & Conditions" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.paymentTerms}</div>
          </>
        )}

        {draft.showBankDetails && (draft.companyProfile.bankName || draft.companyProfile.bankAccount) && (
          <>
            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: theme.primary, textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: `1px solid ${theme.border}`, paddingBottom: 4 }}>Bank Details for Payment</p>
            </div>
            <table style={tableStyle}>
              <tbody>
                {[
                  ['Bank Name', draft.companyProfile.bankName],
                  ['Account Name', draft.companyProfile.companyName],
                  ['Account Number', draft.companyProfile.bankAccount],
                  ['IFSC Code', draft.companyProfile.bankIfsc],
                  ['Branch', draft.companyProfile.bankBranch],
                ].filter(([, v]) => v).map(([k, v], i) => (
                  <tr key={k} style={{ background: i % 2 === 1 ? theme.rowAlt : '#fff', borderBottom: `1px solid ${theme.border}` }}>
                    <td style={{ ...cellPad, fontWeight: 600, width: 180, color: theme.subtext }}>{k}</td>
                    <td style={cellPad}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {draft.specialConditions && (
          <>
            <SectionHeader title="Special Conditions & Compliance" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.specialConditions}</div>
          </>
        )}

        {draft.terminationClause && (
          <>
            <SectionHeader title="Termination" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.terminationClause}</div>
          </>
        )}

        {draft.confidentiality && (
          <>
            <SectionHeader title="Confidentiality & Non-Disclosure" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.confidentiality}</div>
          </>
        )}

        {draft.intellectualProperty && (
          <>
            <SectionHeader title="Intellectual Property Rights" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.intellectualProperty}</div>
          </>
        )}

        {draft.limitationOfLiability && (
          <>
            <SectionHeader title="Limitation of Liability" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.limitationOfLiability}</div>
          </>
        )}

        {draft.warranty && (
          <>
            <SectionHeader title="Warranties & Representations" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.warranty}</div>
          </>
        )}

        {draft.disputeResolution && (
          <>
            <SectionHeader title="Dispute Resolution" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.disputeResolution}</div>
          </>
        )}

        {draft.forcemajeure && (
          <>
            <SectionHeader title="Force Majeure" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.forcemajeure}</div>
          </>
        )}

        {draft.governingLaw && (
          <>
            <SectionHeader title="Governing Law & Jurisdiction" />
            <div style={{ lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>
              This Agreement shall be governed by and construed in accordance with the {draft.governingLaw}. Any disputes arising hereunder shall be subject to the exclusive jurisdiction of the courts in the jurisdiction specified herein.
            </div>
          </>
        )}

        {draft.amendment && (
          <>
            <SectionHeader title="Amendment, Notices & Entire Agreement" />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', fontSize: 10 }}>{draft.amendment}</div>
          </>
        )}

        <SectionHeader title="Execution & Signatures" />
        <div style={{ border: `1px solid ${theme.border}`, borderRadius: 5, padding: '12px 16px', background: '#fff', marginBottom: 14, fontSize: 10, lineHeight: 1.7 }}>
          IN WITNESS WHEREOF, the parties hereto have executed this {draft.agreementType} as of the date first written above. Each party represents and warrants that the person signing below has the authority to bind such party to this Agreement.
        </div>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: theme.primary }}>
              <th style={{ ...thStyle, width: '50%' }}>For and on behalf of Service Provider</th>
              <th style={thStyle}>For and on behalf of Client</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '18px 16px', verticalAlign: 'top', borderBottom: `1px solid ${theme.border}`, borderRight: `1px solid ${theme.border}`, width: '50%' }}>
                <p style={{ fontWeight: 700, marginBottom: 2, fontSize: 11 }}>{draft.companyProfile.companyName}</p>
                {draft.companyProfile.gstin && <p style={{ fontSize: 8, color: theme.subtext, marginBottom: 10 }}>GSTIN: {draft.companyProfile.gstin}</p>}
                <div style={{ minHeight: 48, display: 'flex', alignItems: 'flex-end' }}>
                  {draft.providerSignature ? (
                    <img src={draft.providerSignature} alt="Provider signature" style={{ maxHeight: 40, objectFit: 'contain' }} crossOrigin="anonymous" />
                  ) : (
                    <div style={{ borderBottom: `1.5px solid ${theme.accent}`, width: '75%' }} />
                  )}
                </div>
                <p style={{ fontSize: 9, color: theme.subtext, marginTop: 3 }}>Authorised Signature</p>
                <p style={{ fontSize: 10, fontWeight: 600, marginTop: 5 }}>{draft.companyProfile.signatoryName}</p>
                {draft.companyProfile.designation && <p style={{ fontSize: 9, color: theme.subtext }}>{draft.companyProfile.designation}</p>}
                <p style={{ fontSize: 9, color: theme.subtext, marginTop: 3 }}>Date: {formatIndianDate(draft.agreementDate)}</p>
                {draft.companyProfile.address && <p style={{ fontSize: 8, color: theme.subtext, marginTop: 2 }}>Place: {draft.companyProfile.address.split(',').slice(-2).join(',').trim()}</p>}
              </td>
              <td style={{ padding: '18px 16px', verticalAlign: 'top', borderBottom: `1px solid ${theme.border}` }}>
                <p style={{ fontWeight: 700, marginBottom: 2, fontSize: 11 }}>{draft.client.clientName || 'CLIENT NAME'}</p>
                {draft.client.companyName && <p style={{ fontSize: 9, color: theme.subtext }}>{draft.client.companyName}</p>}
                {draft.client.gstin && <p style={{ fontSize: 8, color: theme.subtext, marginBottom: 10 }}>GSTIN: {draft.client.gstin}</p>}
                <div style={{ minHeight: 48, display: 'flex', alignItems: 'flex-end' }}>
                  {draft.clientSignature ? (
                    <img src={draft.clientSignature} alt="Client signature" style={{ maxHeight: 40, objectFit: 'contain' }} crossOrigin="anonymous" />
                  ) : (
                    <div style={{ borderBottom: `1.5px solid ${theme.accent}`, width: '75%' }} />
                  )}
                </div>
                <p style={{ fontSize: 9, color: theme.subtext, marginTop: 3 }}>Authorised Signature</p>
                <p style={{ fontSize: 10, fontWeight: 600, marginTop: 5 }}>{draft.client.signatoryName || draft.client.clientName}</p>
                {draft.client.designation && <p style={{ fontSize: 9, color: theme.subtext }}>{draft.client.designation}</p>}
                <p style={{ fontSize: 9, color: theme.subtext, marginTop: 3 }}>Date: ____________________</p>
                {draft.client.address && <p style={{ fontSize: 8, color: theme.subtext, marginTop: 2 }}>Place: {draft.client.address.split(',').slice(-2).join(',').trim()}</p>}
              </td>
            </tr>
          </tbody>
        </table>

        {(draft.witnessName1 || draft.witnessName2) && (
          <table style={{ ...tableStyle, marginTop: 10 }}>
            <thead>
              <tr style={{ background: theme.lightBg }}>
                <th style={{ ...thStyle, color: theme.subtext, width: '50%' }}>Witness 1</th>
                <th style={{ ...thStyle, color: theme.subtext }}>Witness 2</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '14px 16px', borderRight: `1px solid ${theme.border}`, verticalAlign: 'top' }}>
                  <div style={{ borderBottom: `1px solid ${theme.accent}`, width: '70%', marginTop: 28, marginBottom: 5 }} />
                  <p style={{ fontSize: 9, color: theme.subtext }}>Signature</p>
                  <p style={{ fontSize: 10, fontWeight: 600, marginTop: 5 }}>{draft.witnessName1 || '____________________'}</p>
                  <p style={{ fontSize: 9, color: theme.subtext, marginTop: 3 }}>Date: ____________________</p>
                </td>
                <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                  <div style={{ borderBottom: `1px solid ${theme.accent}`, width: '70%', marginTop: 28, marginBottom: 5 }} />
                  <p style={{ fontSize: 9, color: theme.subtext }}>Signature</p>
                  <p style={{ fontSize: 10, fontWeight: 600, marginTop: 5 }}>{draft.witnessName2 || '____________________'}</p>
                  <p style={{ fontSize: 9, color: theme.subtext, marginTop: 3 }}>Date: ____________________</p>
                </td>
              </tr>
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 24, borderTop: `2px solid ${theme.primary}`, paddingTop: 10, textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontStyle: 'italic', color: theme.subtext }}>
            This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter hereof.
          </p>
          <p style={{ fontSize: 8, color: '#aaa', marginTop: 5 }}>
            {draft.companyProfile.companyName}
            {draft.companyProfile.address && ` | ${draft.companyProfile.address}`}
            {draft.companyProfile.email && ` | ${draft.companyProfile.email}`}
            {draft.agreementNumber && ` | Ref: ${draft.agreementNumber}`}
          </p>
          {draft.governingLaw && (
            <p style={{ fontSize: 8, color: '#aaa', marginTop: 2 }}>Governed by: {draft.governingLaw}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AgreementPreview({ draft }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const theme = THEMES[draft.pdfTheme as keyof typeof THEMES] || THEMES.bw;

  const filename = `${(draft.agreementTitle || 'Agreement').replace(/\s+/g, '_')}_${draft.agreementNumber || 'Draft'}.pdf`;

  const handleDownloadPDF = async () => {
    setDownloading(true);
    const toastId = toast.loading('Generating PDF...', { duration: 0 });
    try {
      const pdf = await generateAgreementPdf(draft);
      pdf.save(filename);
      toast.success('PDF downloaded!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF. Please try again.', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    try {
      const pdf = await generateAgreementPdf(draft);
      const blobUrl = pdf.output('bloburl');
      const printWin = window.open(blobUrl as unknown as string, '_blank');
      if (printWin) {
        printWin.addEventListener('load', () => {
          printWin.print();
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare print.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">
            Agreement Preview
            {draft.agreementNumber && <span className="ml-2 text-xs text-gray-500">#{draft.agreementNumber}</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.05] font-medium text-sm transition-all duration-200 disabled:opacity-50"
          >
            {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: theme.primary, color: '#fff', boxShadow: `0 4px 14px ${theme.primary}40` }}
          >
            {downloading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Download className="w-4 h-4" /> Download PDF</>
            )}
          </button>
        </div>
      </div>

      <div className="print:hidden rounded-2xl overflow-hidden border border-white/[0.06] bg-dark-800/50 shadow-2xl">
        <div className="bg-dark-900/80 border-b border-white/[0.06] px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-xs text-gray-500 ml-2 font-mono">{filename}</span>
          <div className="ml-auto flex items-center gap-1 text-xs text-gray-600">
            <span>A4</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[80vh] bg-gray-200/20">
          <div className="py-6 px-4 space-y-4">
            <div
              className="mx-auto shadow-2xl"
              style={{
                width: A4_WIDTH_PX,
                maxWidth: '100%',
                background: '#fff',
                minHeight: A4_HEIGHT_PX,
              }}
            >
              <AgreementDocument draft={draft} />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
