import { forwardRef } from 'react';
import { formatCurrency, formatDate } from '../lib/format';
import { type InvoiceTheme, getThemeById } from '../lib/invoiceThemes';
import { numberToWords } from '../lib/invoicing/constants';

export interface LineItem {
  description: string;
  hsn_sac?: string;
  qty: number;
  unit?: string;
  rate: number;
  amount: number;
  gst_rate: number;
}

export interface BankDetails {
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
}

export interface InvoicePreviewProps {
  type: 'invoice' | 'quotation';
  themeId?: string;
  customThemeOverrides?: Partial<InvoiceTheme> | null;
  docNumber: string;
  docDate: string;
  dueDate?: string;
  validUntil?: string;
  fromBusinessName: string;
  fromAddress: string;
  fromGstin: string;
  fromEmail: string;
  fromPhone: string;
  fromLogoUrl?: string;
  toClientName: string;
  toAddress: string;
  toGstin: string;
  toEmail: string;
  toPhone?: string;
  items: LineItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  discountType?: string;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  bankDetails?: BankDetails;
  showBankDetails?: boolean;
  signatureUrl?: string;
  signatoryName?: string;
  signatoryDesignation?: string;
  paymentTerms?: string;
  placeOfSupply?: string;
  poNumber?: string;
  scopeOfWork?: string;
  deliveryTimeline?: string;
  additionalNotes?: string;
}

const InvoicePreviewTemplate = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  (props, ref) => {
    const {
      type, themeId, customThemeOverrides, docNumber, docDate, dueDate, validUntil,
      fromBusinessName, fromAddress, fromGstin, fromEmail, fromPhone, fromLogoUrl,
      toClientName, toAddress, toGstin, toEmail, toPhone,
      items, subtotal, taxAmount, discount, discountType, total, currency,
      notes, terms, bankDetails, showBankDetails, signatureUrl, signatoryName, signatoryDesignation,
      paymentTerms, placeOfSupply, poNumber, scopeOfWork, deliveryTimeline,
      additionalNotes,
    } = props;

    const isInvoice = type === 'invoice';
    const baseTheme: InvoiceTheme = getThemeById(themeId || 'classic-bw');
    const t: InvoiceTheme = customThemeOverrides && Object.keys(customThemeOverrides).length > 0
      ? { ...baseTheme, ...customThemeOverrides }
      : baseTheme;
    const hasHsn = items.some(i => i.hsn_sac);
    const hasUnit = items.some(i => i.unit && i.unit !== 'Nos');

    const fromState = fromAddress?.split('\n').pop()?.trim() || '';
    const isInterState = placeOfSupply && fromState && placeOfSupply.toLowerCase() !== fromState.toLowerCase();

    const discountAmount = discountType === 'percentage' && subtotal > 0
      ? (subtotal * discount) / 100
      : discount;

    const taxableAmount = subtotal - discountAmount;

    return (
      <div
        ref={ref}
        style={{
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          width: '210mm',
          minHeight: '297mm',
          background: t.bodyBg,
          color: t.bodyText,
          padding: '0',
          fontSize: '13px',
          lineHeight: '1.5',
        }}
      >
        <div
          style={{
            background: t.headerBg,
            padding: '28px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '700',
                color: t.headerText,
                margin: '0 0 14px 0',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              {isInvoice ? 'Tax Invoice' : 'Quotation'}
            </h1>
            <div style={{ color: t.headerSubText, fontSize: '12px' }}>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>
                    {isInvoice ? 'Invoice No' : 'Quote No'}
                  </span>
                  <div style={{ fontWeight: '600', marginTop: '2px', color: t.headerText, fontSize: '14px' }}>{docNumber}</div>
                </div>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>Date</span>
                  <div style={{ fontWeight: '600', marginTop: '2px', color: t.headerText }}>{formatDate(docDate)}</div>
                </div>
                {dueDate && (
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>Due Date</span>
                    <div style={{ fontWeight: '600', marginTop: '2px', color: t.headerText }}>{formatDate(dueDate)}</div>
                  </div>
                )}
                {validUntil && (
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>Valid Until</span>
                    <div style={{ fontWeight: '600', marginTop: '2px', color: t.headerText }}>{formatDate(validUntil)}</div>
                  </div>
                )}
                {poNumber && (
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>PO Number</span>
                    <div style={{ fontWeight: '600', marginTop: '2px', color: t.headerText }}>{poNumber}</div>
                  </div>
                )}
                {paymentTerms && (
                  <div>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>Payment Terms</span>
                    <div style={{ fontWeight: '600', marginTop: '2px', color: t.headerText }}>{paymentTerms}</div>
                  </div>
                )}
              </div>
              {placeOfSupply && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.7 }}>Place of Supply: </span>
                  <span style={{ fontWeight: '600', color: t.headerText }}>{placeOfSupply}</span>
                </div>
              )}
            </div>
          </div>
          {fromLogoUrl && (
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <img src={fromLogoUrl} alt="Logo" style={{ maxWidth: '90px', maxHeight: '90px', objectFit: 'contain' }} crossOrigin="anonymous" />
            </div>
          )}
        </div>

        <div style={{ padding: '28px 40px' }}>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '28px' }}>
            <div
              style={{
                flex: 1,
                background: t.accentLight,
                border: `1px solid ${t.accentBorder}`,
                borderRadius: '10px',
                padding: '18px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: t.labelColor, marginBottom: '8px' }}>
                From
              </div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: t.bodyText, marginBottom: '4px' }}>{fromBusinessName}</div>
              {fromAddress && <div style={{ color: t.bodySubText, fontSize: '12px', whiteSpace: 'pre-line', marginBottom: '4px' }}>{fromAddress}</div>}
              {fromGstin && <div style={{ color: t.bodySubText, fontSize: '11px', marginBottom: '2px' }}><span style={{ fontWeight: '600' }}>GSTIN:</span> {fromGstin}</div>}
              {fromEmail && <div style={{ color: t.bodySubText, fontSize: '11px' }}><span style={{ fontWeight: '600' }}>Email:</span> {fromEmail}</div>}
              {fromPhone && <div style={{ color: t.bodySubText, fontSize: '11px' }}><span style={{ fontWeight: '600' }}>Phone:</span> {fromPhone}</div>}
            </div>

            <div
              style={{
                flex: 1,
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
                borderRadius: '10px',
                padding: '18px',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: t.bodySubText, marginBottom: '8px' }}>
                To
              </div>
              <div style={{ fontWeight: '700', fontSize: '15px', color: t.bodyText, marginBottom: '4px' }}>{toClientName}</div>
              {toAddress && <div style={{ color: t.bodySubText, fontSize: '12px', whiteSpace: 'pre-line', marginBottom: '4px' }}>{toAddress}</div>}
              {toGstin && <div style={{ color: t.bodySubText, fontSize: '11px', marginBottom: '2px' }}><span style={{ fontWeight: '600' }}>GSTIN:</span> {toGstin}</div>}
              {toEmail && <div style={{ color: t.bodySubText, fontSize: '11px' }}>{toEmail}</div>}
              {toPhone && <div style={{ color: t.bodySubText, fontSize: '11px' }}>Phone: {toPhone}</div>}
            </div>
          </div>

          {scopeOfWork && (
            <div style={{ marginBottom: '20px', background: t.accentLight, border: `1px solid ${t.accentBorder}`, borderRadius: '10px', padding: '16px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: t.labelColor, marginBottom: '6px' }}>Scope of Work</div>
              <div style={{ fontSize: '12px', color: t.bodySubText, whiteSpace: 'pre-line', lineHeight: '1.6' }}>{scopeOfWork}</div>
            </div>
          )}

          {deliveryTimeline && (
            <div style={{ marginBottom: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: t.labelColor }}>Delivery Timeline:</span>
              <span style={{ fontSize: '12px', color: t.bodyText, fontWeight: '600' }}>{deliveryTimeline}</span>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ background: t.tableHeaderBg }}>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: t.tableHeaderText, fontSize: '10px', fontWeight: '600', width: '36px', borderRadius: '8px 0 0 0' }}>#</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: t.tableHeaderText, fontSize: '10px', fontWeight: '600' }}>Description</th>
                {hasHsn && <th style={{ padding: '10px 12px', textAlign: 'left', color: t.tableHeaderText, fontSize: '10px', fontWeight: '600', width: '80px' }}>HSN/SAC</th>}
                <th style={{ padding: '10px 12px', textAlign: 'center', color: t.tableHeaderText, fontSize: '10px', fontWeight: '600', width: '60px' }}>Qty</th>
                {hasUnit && <th style={{ padding: '10px 12px', textAlign: 'center', color: t.tableHeaderText, fontSize: '10px', fontWeight: '600', width: '50px' }}>Unit</th>}
                <th style={{ padding: '10px 12px', textAlign: 'right', color: t.tableHeaderText, fontSize: '10px', fontWeight: '600', width: '100px' }}>Rate</th>
                <th style={{ padding: '10px 12px', textAlign: 'center', color: t.tableHeaderText, fontSize: '10px', fontWeight: '600', width: '60px' }}>GST%</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: t.tableHeaderText, fontSize: '10px', fontWeight: '600', width: '110px', borderRadius: '0 8px 0 0' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? t.tableBg : t.tableAltBg, borderBottom: `1px solid ${t.borderColor}` }}>
                  <td style={{ padding: '12px', textAlign: 'center', color: t.bodySubText, fontSize: '11px' }}>{i + 1}</td>
                  <td style={{ padding: '12px', color: t.bodyText, fontWeight: '500', fontSize: '12px' }}>{item.description}</td>
                  {hasHsn && <td style={{ padding: '12px', color: t.bodySubText, fontSize: '11px' }}>{item.hsn_sac || '-'}</td>}
                  <td style={{ padding: '12px', textAlign: 'center', color: t.bodySubText, fontSize: '12px' }}>{item.qty}</td>
                  {hasUnit && <td style={{ padding: '12px', textAlign: 'center', color: t.bodySubText, fontSize: '11px' }}>{item.unit || 'Nos'}</td>}
                  <td style={{ padding: '12px', textAlign: 'right', color: t.bodySubText, fontSize: '12px' }}>{formatCurrency(item.rate, currency)}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: t.bodySubText, fontSize: '11px' }}>{item.gst_rate}%</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: t.bodyText, fontWeight: '600', fontSize: '12px' }}>{formatCurrency(item.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              {showBankDetails && bankDetails && bankDetails.account_number && (
                <div style={{ background: t.accentLight, border: `1px solid ${t.accentBorder}`, borderRadius: '10px', padding: '18px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: t.labelColor, marginBottom: '10px' }}>Bank Details</div>
                  <table style={{ fontSize: '11px', color: t.bodyText }}>
                    <tbody>
                      {bankDetails.account_holder_name && (
                        <tr>
                          <td style={{ padding: '2px 14px 2px 0', color: t.bodySubText, fontWeight: '500' }}>Account Name</td>
                          <td style={{ padding: '2px 0', fontWeight: '600' }}>{bankDetails.account_holder_name}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ padding: '2px 14px 2px 0', color: t.bodySubText, fontWeight: '500' }}>Account No</td>
                        <td style={{ padding: '2px 0', fontWeight: '600' }}>{bankDetails.account_number}</td>
                      </tr>
                      {bankDetails.ifsc_code && (
                        <tr>
                          <td style={{ padding: '2px 14px 2px 0', color: t.bodySubText, fontWeight: '500' }}>IFSC</td>
                          <td style={{ padding: '2px 0', fontWeight: '600' }}>{bankDetails.ifsc_code}</td>
                        </tr>
                      )}
                      {bankDetails.bank_name && (
                        <tr>
                          <td style={{ padding: '2px 14px 2px 0', color: t.bodySubText, fontWeight: '500' }}>Bank</td>
                          <td style={{ padding: '2px 0', fontWeight: '600' }}>{bankDetails.bank_name}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ width: '300px', flexShrink: 0 }}>
              <div style={{ background: t.cardBg, borderRadius: '10px', padding: '16px 20px', border: `1px solid ${t.cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                  <span style={{ color: t.bodySubText }}>Subtotal</span>
                  <span style={{ fontWeight: '600', color: t.bodyText }}>{formatCurrency(subtotal, currency)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                    <span style={{ color: t.bodySubText }}>
                      Discount{discountType === 'percentage' ? ` (${discount}%)` : ''}
                    </span>
                    <span style={{ fontWeight: '600', color: '#EF4444' }}>-{formatCurrency(discountAmount, currency)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px', borderTop: `1px dashed ${t.borderColor}`, marginTop: '4px', paddingTop: '8px' }}>
                    <span style={{ color: t.bodySubText }}>Taxable Amount</span>
                    <span style={{ fontWeight: '600', color: t.bodyText }}>{formatCurrency(taxableAmount, currency)}</span>
                  </div>
                )}
                {taxAmount > 0 && !isInterState && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                      <span style={{ color: t.bodySubText }}>CGST</span>
                      <span style={{ fontWeight: '600', color: t.bodyText }}>{formatCurrency(taxAmount / 2, currency)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                      <span style={{ color: t.bodySubText }}>SGST</span>
                      <span style={{ fontWeight: '600', color: t.bodyText }}>{formatCurrency(taxAmount / 2, currency)}</span>
                    </div>
                  </>
                )}
                {taxAmount > 0 && isInterState && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                    <span style={{ color: t.bodySubText }}>IGST</span>
                    <span style={{ fontWeight: '600', color: t.bodyText }}>{formatCurrency(taxAmount, currency)}</span>
                  </div>
                )}
                {taxAmount > 0 && !placeOfSupply && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px' }}>
                    <span style={{ color: t.bodySubText }}>GST</span>
                    <span style={{ fontWeight: '600', color: t.bodyText }}>{formatCurrency(taxAmount, currency)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px 0', borderTop: `2px solid ${t.borderColor}`, marginTop: '8px', fontSize: '15px' }}>
                  <span style={{ fontWeight: '700', color: t.bodyText }}>Total ({currency})</span>
                  <span style={{ fontWeight: '800', color: t.totalColor, fontSize: '17px' }}>{formatCurrency(total, currency)}</span>
                </div>
                {total > 0 && currency === 'INR' && (
                  <div style={{ fontSize: '10px', color: t.bodySubText, marginTop: '6px', fontStyle: 'italic', borderTop: `1px dashed ${t.borderColor}`, paddingTop: '8px' }}>
                    {numberToWords(Math.round(total))}
                  </div>
                )}
              </div>

              {(signatureUrl || signatoryName) && (
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  {signatureUrl && (
                    <div style={{ display: 'inline-block', borderBottom: `1px solid ${t.borderColor}`, paddingBottom: '4px' }}>
                      <img src={signatureUrl} alt="Signature" style={{ maxWidth: '160px', maxHeight: '60px', objectFit: 'contain' }} crossOrigin="anonymous" />
                    </div>
                  )}
                  {!signatureUrl && (
                    <div style={{ display: 'inline-block', borderBottom: `1px solid ${t.borderColor}`, paddingBottom: '4px', width: '160px', height: '40px' }} />
                  )}
                  {signatoryName && (
                    <div style={{ fontSize: '12px', color: t.bodyText, marginTop: '4px', fontWeight: '700' }}>{signatoryName}</div>
                  )}
                  {signatoryDesignation && (
                    <div style={{ fontSize: '11px', color: t.bodySubText, marginTop: '1px', fontWeight: '500' }}>{signatoryDesignation}</div>
                  )}
                  <div style={{ fontSize: '10px', color: t.bodySubText, marginTop: signatoryName ? '2px' : '4px', fontWeight: '500' }}>Authorised Signatory</div>
                </div>
              )}
            </div>
          </div>

          {notes && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: t.labelColor, marginBottom: '4px' }}>Notes</div>
              <div style={{ fontSize: '11px', color: t.bodySubText, whiteSpace: 'pre-line', lineHeight: '1.6' }}>{notes}</div>
            </div>
          )}
          {terms && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: t.labelColor, marginBottom: '4px' }}>Terms & Conditions</div>
              <div style={{ fontSize: '11px', color: t.bodySubText, whiteSpace: 'pre-line', lineHeight: '1.6' }}>{terms}</div>
            </div>
          )}
          {additionalNotes && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: t.labelColor, marginBottom: '4px' }}>Additional Notes</div>
              <div style={{ fontSize: '11px', color: t.bodySubText, whiteSpace: 'pre-line', lineHeight: '1.6' }}>{additionalNotes}</div>
            </div>
          )}

          <div style={{ borderTop: `1px solid ${t.footerBorder}`, marginTop: '28px', paddingTop: '12px', textAlign: 'center', fontSize: '10px', color: t.bodySubText, marginBottom: '20px' }}>
            {fromEmail && fromPhone ? (
              <span>
                For any enquiry, reach out via email at{' '}
                <span style={{ color: t.accentColor, fontWeight: '600' }}>{fromEmail}</span>
                {', call on '}
                <span style={{ color: t.accentColor, fontWeight: '600' }}>{fromPhone}</span>
              </span>
            ) : fromEmail ? (
              <span>For any enquiry, reach out via email at <span style={{ color: t.accentColor, fontWeight: '600' }}>{fromEmail}</span></span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreviewTemplate.displayName = 'InvoicePreviewTemplate';

export default InvoicePreviewTemplate;
