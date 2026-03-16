export interface CompanyProfile {
  companyName: string;
  signatoryName: string;
  designation: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  gstin: string;
  pan: string;
  cin: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankBranch: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'Text' | 'Number' | 'Date' | 'Long Text';
}

export interface ClientDetails {
  clientName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  pan: string;
  signatoryName: string;
  designation: string;
  customFieldValues: Record<string, string>;
}

export interface ServiceItem {
  id: string;
  service: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  gstRate: number;
}

export interface PaymentMilestone {
  id: string;
  label: string;
  percentage: number;
  dueOn: string;
  amount: number;
}

export type PdfTheme = 'navy' | 'bw' | 'slate' | 'corporate-green';

export type AgreementType =
  | 'Service Agreement'
  | 'Sales Agreement'
  | 'Consulting Agreement'
  | 'Non-Disclosure Agreement'
  | 'Software Development Agreement'
  | 'Maintenance & Support Agreement'
  | 'Retainer Agreement'
  | 'Partnership Agreement'
  | 'Employment Agreement'
  | 'Freelance Agreement';

export interface AgreementDraft {
  agreementType: AgreementType;
  agreementTitle: string;
  agreementSubtitle: string;
  agreementDate: string;
  agreementNumber: string;
  validityPeriod: string;
  placeOfExecution: string;
  governingLaw: string;
  companyLogo: string;
  companyProfile: CompanyProfile;
  customFields: CustomField[];
  client: ClientDetails;
  scopeOfWork: string;
  deliverables: string;
  paymentTerms: string;
  paymentMilestones: PaymentMilestone[];
  paymentScheduleType: 'split-50-50' | 'split-30-40-30' | 'custom' | 'upfront' | 'monthly';
  specialConditions: string;
  terminationClause: string;
  confidentiality: string;
  intellectualProperty: string;
  limitationOfLiability: string;
  warranty: string;
  disputeResolution: string;
  forcemajeure: string;
  amendment: string;
  services: ServiceItem[];
  includeGst: boolean;
  pdfTheme: PdfTheme;
  providerSignature: string;
  clientSignature: string;
  showBankDetails: boolean;
  witnessName1: string;
  witnessName2: string;
}

export interface SavedAgreement extends AgreementDraft {
  id: string;
  createdAt: string;
  totalAmount: number;
}

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  companyName: '',
  signatoryName: '',
  designation: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  gstin: '',
  pan: '',
  cin: '',
  bankName: '',
  bankAccount: '',
  bankIfsc: '',
  bankBranch: '',
};

export const DEFAULT_TERMINATION = `Either party may terminate this Agreement upon thirty (30) days' prior written notice to the other party. In the event of a material breach by either party that remains uncured for fifteen (15) days following written notice thereof, the non-breaching party may terminate this Agreement immediately. Upon termination:

(a) The Client shall pay for all services rendered and expenses incurred up to the effective date of termination.
(b) The Service Provider shall deliver all completed work product to the Client.
(c) Both parties shall promptly return or destroy all Confidential Information of the other party.
(d) No refund shall be issued on advance payments for services already initiated unless the Service Provider fails to deliver.`;

export const DEFAULT_CONFIDENTIALITY = `Each party ("Receiving Party") agrees to maintain in strict confidence all Confidential Information received from the other party ("Disclosing Party") and shall not disclose such information to any third party without the prior written consent of the Disclosing Party. This obligation shall survive termination of this Agreement for a period of three (3) years. "Confidential Information" means any non-public information disclosed by one party to the other, including business plans, technical data, client lists, financial information, and trade secrets. This obligation shall not apply to information that: (a) is or becomes publicly available through no fault of the Receiving Party; (b) was known to the Receiving Party prior to disclosure; (c) is independently developed by the Receiving Party without use of Confidential Information; or (d) is required to be disclosed by applicable law or court order.`;

export const DEFAULT_INTELLECTUAL_PROPERTY = `All intellectual property rights in any work product, deliverables, materials, software, and inventions created or developed by the Service Provider specifically for the Client under this Agreement ("Work Product") shall, upon receipt of full payment, be assigned to and vest in the Client. Until full payment is received, all Work Product remains the exclusive property of the Service Provider. The Service Provider retains all rights in its pre-existing intellectual property, tools, methodologies, and know-how. The Service Provider is granted a non-exclusive, royalty-free licence to use the Client's name and logo solely for portfolio and marketing purposes, subject to prior written approval.`;

export const DEFAULT_LIMITATION_OF_LIABILITY = `To the maximum extent permitted by applicable law, the Service Provider's total cumulative liability to the Client arising out of or related to this Agreement, whether based on contract, tort, negligence, strict liability, or otherwise, shall not exceed the total fees paid by the Client under this Agreement in the three (3) months preceding the claim. Neither party shall be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, loss of data, or business interruption, even if advised of the possibility of such damages.`;

export const DEFAULT_WARRANTY = `The Service Provider warrants that: (a) it has the full right and authority to enter into this Agreement; (b) the services will be performed in a professional and workmanlike manner consistent with industry standards; (c) the deliverables will conform in all material respects to the agreed specifications. The Client warrants that: (a) it has the full right and authority to enter into this Agreement; (b) all information, data, and materials provided to the Service Provider are accurate and do not infringe any third-party rights. EXCEPT AS EXPRESSLY SET FORTH HEREIN, NEITHER PARTY MAKES ANY OTHER WARRANTIES, EXPRESS OR IMPLIED.`;

export const DEFAULT_DISPUTE_RESOLUTION = `Any dispute, controversy, or claim arising out of or relating to this Agreement, or the breach, termination, or validity thereof, shall be resolved as follows:

(a) Negotiation: The parties shall first attempt to resolve the dispute through good-faith negotiations for a period of thirty (30) days.
(b) Mediation: If the dispute cannot be resolved through negotiation, it shall be submitted to mediation before a mutually agreed mediator.
(c) Arbitration: If mediation fails, the dispute shall be finally resolved by binding arbitration under the Arbitration and Conciliation Act, 1996 (India), before a sole arbitrator mutually agreed upon by the parties. The seat of arbitration shall be as specified in this Agreement.`;

export const DEFAULT_FORCE_MAJEURE = `Neither party shall be liable for any failure or delay in performance of its obligations under this Agreement to the extent such failure or delay is caused by circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, war, terrorism, government actions, civil unrest, pandemics, or failure of third-party infrastructure or services ("Force Majeure Event"). The affected party shall promptly notify the other party in writing and use commercially reasonable efforts to overcome the Force Majeure Event. If such event continues for more than sixty (60) days, either party may terminate this Agreement without liability upon written notice.`;

export const DEFAULT_AMENDMENT = `This Agreement may not be modified, altered, or amended except by a written instrument duly executed by authorised representatives of both parties. No waiver of any term or condition of this Agreement shall be deemed a continuing waiver of such term or any other term. Any notice under this Agreement shall be in writing and delivered by email with read receipt, courier, or registered post to the addresses specified herein.`;

export const DEFAULT_SERVICES: ServiceItem[] = [
  { id: '1', service: 'Consulting Services', description: 'Professional advisory and consulting services', quantity: 1, unit: 'Project', rate: 50000, amount: 50000, gstRate: 18 },
];

export const DEMO_CLIENTS = [
  { clientName: 'Advocate Manjula', companyName: '', phone: '+91 984 4040 704', email: '', address: 'Hassan, Karnataka', gstin: '', pan: '', signatoryName: 'Manjula', designation: 'Advocate', customFieldValues: {}, tag: 'Election Campaign' },
  { clientName: 'Ravi Kumar', companyName: 'Kumar Enterprises', phone: '', email: '', address: 'Mysuru, Karnataka', gstin: '', pan: '', signatoryName: 'Ravi Kumar', designation: 'Director', customFieldValues: {}, tag: 'Web Development' },
  { clientName: 'Dr. Priya Hegde', companyName: 'Hegde Clinic', phone: '', email: '', address: 'Bengaluru, Karnataka', gstin: '', pan: '', signatoryName: 'Dr. Priya Hegde', designation: 'Founder', customFieldValues: {}, tag: 'AI Automation' },
  { clientName: 'Suresh Gowda', companyName: 'Gowda Real Estate', phone: '', email: '', address: 'Hassan, Karnataka', gstin: '', pan: '', signatoryName: 'Suresh Gowda', designation: 'Owner', customFieldValues: {}, tag: 'AI Call Agent' },
];

export interface AgreementTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  agreementType: AgreementType;
  subtitle: string;
  scopeOfWork: string;
  deliverables: string;
  paymentTerms: string;
  specialConditions: string;
  services: Omit<ServiceItem, 'id'>[];
}

export const AGREEMENT_TEMPLATES: AgreementTemplate[] = [
  {
    id: 'election',
    name: 'Election Campaign',
    description: 'AI Call Agent + WhatsApp bulk messaging for political campaigns',
    icon: 'Vote',
    agreementType: 'Service Agreement',
    subtitle: 'Election Campaign AI Services Agreement',
    scopeOfWork: `The Service Provider agrees to deliver the following AI-powered campaign services:\n\n1. AI Call Agent Setup: Platform configuration, voice creation, call script design, testing, and live dashboard.\n\n2. WhatsApp Bulk Messaging: n8n workflow setup, multi-number configuration, contact import, and message templates.\n\n3. Campaign Content: Message scripts and call script writing in English and Kannada.\n\n4. Campaign Management: Daily monitoring, reports, and troubleshooting throughout the campaign period.`,
    deliverables: `AI Call Agent – Setup & Testing Complete: Day 1 to 3 after signing\nWhatsApp Bulk System – Setup & Testing: Day 1 to 2 after signing\nCampaign Go-Live (All Services): Day 4 to 5 after signing\nDaily Reports (Calls + WhatsApp): Every evening during campaign\nFinal Campaign Summary Report: 3 days after campaign ends`,
    paymentTerms: `Advance (50%) – On Agreement Signing\nBalance (50%) – On Go-Live of Services`,
    specialConditions: `• All digital campaigning must comply with Election Commission of India's Model Code of Conduct (MCC)\n• Bulk calling must follow TRAI guidelines – calls permitted only between 9:00 AM and 8:00 PM\n• The Client is solely responsible for ensuring voter contact data is obtained lawfully\n• DND registered numbers will be excluded to avoid TRAI violations\n• The Service Provider does not guarantee vote outcomes – services are limited to communication delivery`,
    services: [
      { service: 'AI Call Agent Setup', description: 'Platform setup, voice creation, call script, testing, dashboard', quantity: 1, unit: 'Project', rate: 13000, amount: 13000, gstRate: 18 },
      { service: 'WhatsApp Bulk Setup', description: 'n8n workflow, multi-number setup, contact import, message template', quantity: 1, unit: 'Project', rate: 10000, amount: 10000, gstRate: 18 },
      { service: 'Campaign Content', description: 'Message scripts, call script writing in English', quantity: 1, unit: 'Project', rate: 3000, amount: 3000, gstRate: 18 },
      { service: 'Campaign Management', description: 'Daily monitoring, reports, troubleshooting', quantity: 1, unit: 'Month', rate: 4000, amount: 4000, gstRate: 18 },
    ],
  },
  {
    id: 'ai-automation',
    name: 'AI Automation',
    description: 'Complete AI workflow automation with RAG, WhatsApp API, and dashboards',
    icon: 'Bot',
    agreementType: 'Software Development Agreement',
    subtitle: 'AI Automation & Web Development Services Agreement',
    scopeOfWork: `The Service Provider will design and deploy a complete AI automation workflow including:\n\n1. n8n Workflow Development: Custom automation pipelines for lead capture and follow-up.\n\n2. RAG System Integration: AI-powered knowledge base and document retrieval system.\n\n3. WhatsApp Business API Integration: Automated customer communication system.\n\n4. Dashboard & Reporting: Real-time analytics and performance monitoring.`,
    deliverables: `Workflow Design & Architecture: Day 1 to 3\nDevelopment & Integration: Day 4 to 14\nTesting & UAT: Day 15 to 18\nGo-Live & Training: Day 19 to 21\nMonitoring & Support: 30 days post go-live`,
    paymentTerms: `Milestone 1 (30%) – On Project Kickoff\nMilestone 2 (40%) – On Design Approval\nMilestone 3 (30%) – On Final Delivery`,
    specialConditions: `• All intellectual property created during this project remains with the Client upon full payment\n• Service Provider retains right to showcase work in portfolio without sensitive data\n• Source code and assets delivered within 7 days of final payment\n• Client must provide timely feedback within 48 hours of each milestone`,
    services: [
      { service: 'n8n Workflow Development', description: 'Custom automation pipelines for lead capture & follow-up', quantity: 1, unit: 'Project', rate: 25000, amount: 25000, gstRate: 18 },
      { service: 'RAG System Integration', description: 'AI knowledge base and document retrieval setup', quantity: 1, unit: 'Project', rate: 35000, amount: 35000, gstRate: 18 },
      { service: 'WhatsApp Business API', description: 'Automated customer communication system', quantity: 1, unit: 'Project', rate: 20000, amount: 20000, gstRate: 18 },
      { service: 'Dashboard & Reporting', description: 'Real-time analytics and monitoring dashboard', quantity: 1, unit: 'Project', rate: 15000, amount: 15000, gstRate: 18 },
    ],
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Full website design, development, SEO and handover',
    icon: 'Globe',
    agreementType: 'Software Development Agreement',
    subtitle: 'Software Development Services Agreement',
    scopeOfWork: `The Service Provider will deliver a fully functional website with:\n\n1. UI/UX Design: Custom design with brand guidelines and responsive layout.\n\n2. Frontend Development: React-based responsive web application.\n\n3. Backend Integration: API connections and database setup.\n\n4. SEO Optimization: On-page SEO and performance tuning.\n\n5. Training & Handover: 2-hour walkthrough session post-launch.`,
    deliverables: `Project Kickoff & Discovery: Day 1 to 2 after signing\nDesign Mockups & Approval: Day 3 to 7 after signing\nDevelopment Phase 1: Week 2 to 3\nTesting & Quality Assurance: Week 4\nLaunch & Go-Live: End of Week 4\nPost-launch Support: 30 days after launch`,
    paymentTerms: `Milestone 1 (30%) – On Project Kickoff\nMilestone 2 (40%) – On Design Approval\nMilestone 3 (30%) – On Final Delivery`,
    specialConditions: `• All intellectual property created during this project remains with the Client upon full payment\n• Service Provider retains right to showcase work in portfolio without sensitive data\n• Source code and assets delivered within 7 days of final payment\n• Client must provide timely feedback within 48 hours of each milestone`,
    services: [
      { service: 'UI/UX Design', description: 'Custom design, wireframes, brand guidelines', quantity: 1, unit: 'Project', rate: 15000, amount: 15000, gstRate: 18 },
      { service: 'Frontend Development', description: 'React-based responsive web application', quantity: 1, unit: 'Project', rate: 25000, amount: 25000, gstRate: 18 },
      { service: 'Backend Integration', description: 'API connections, database, authentication', quantity: 1, unit: 'Project', rate: 20000, amount: 20000, gstRate: 18 },
      { service: 'SEO & Performance', description: 'On-page SEO, speed optimization, meta tags', quantity: 1, unit: 'Project', rate: 8000, amount: 8000, gstRate: 18 },
      { service: 'Training & Handover', description: '2-hour walkthrough session post-launch', quantity: 1, unit: 'Session', rate: 5000, amount: 5000, gstRate: 18 },
    ],
  },
  {
    id: 'ai-call-agent',
    name: 'AI Call Agent',
    description: 'AI voice agent deployment with Twilio/Exotel for India market',
    icon: 'Phone',
    agreementType: 'Service Agreement',
    subtitle: 'AI Call Agent Deployment Agreement',
    scopeOfWork: `The Service Provider agrees to configure and deploy an AI voice call agent:\n\n1. Voice Agent Setup: ElevenLabs voice creation with custom script.\n\n2. Call Flow Design: IVR menu, press-1 transfer, and voicemail handling.\n\n3. Platform Integration: Twilio/Exotel configuration for India market.\n\n4. Compliance: TRAI-compliant calling hours (9 AM – 8 PM).\n\n5. Reporting: Live dashboard with call delivery and response tracking.`,
    deliverables: `AI Voice Agent Configuration: Day 1 to 2\nCall Script Design & Testing: Day 2 to 3\nPlatform Integration & Setup: Day 3 to 5\nUAT & Client Approval: Day 5 to 6\nGo-Live: Day 7\nPost-launch Monitoring: 14 days`,
    paymentTerms: `Advance (50%) – On Agreement Signing\nBalance (50%) – On Go-Live of Services`,
    specialConditions: `• Bulk calling must follow TRAI guidelines – calls only between 9:00 AM and 8:00 PM\n• DND registered numbers will be excluded automatically\n• The Client must provide the contact database in Excel/CSV format\n• Call script changes after go-live will incur additional charges\n• Service Provider does not guarantee response rates – services limited to call delivery`,
    services: [
      { service: 'AI Voice Agent Setup', description: 'ElevenLabs voice creation, script design, testing', quantity: 1, unit: 'Project', rate: 18000, amount: 18000, gstRate: 18 },
      { service: 'Platform Integration', description: 'Twilio/Exotel config for India calling', quantity: 1, unit: 'Project', rate: 12000, amount: 12000, gstRate: 18 },
      { service: 'Call Flow Design', description: 'IVR menu, press-1 transfer, voicemail', quantity: 1, unit: 'Project', rate: 8000, amount: 8000, gstRate: 18 },
      { service: 'Dashboard & Reporting', description: 'Live call tracking and analytics dashboard', quantity: 1, unit: 'Project', rate: 7000, amount: 7000, gstRate: 18 },
    ],
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing & AI',
    description: 'Full digital marketing package with AI-powered campaigns',
    icon: 'Megaphone',
    agreementType: 'Retainer Agreement',
    subtitle: 'Digital Marketing & AI Services Agreement',
    scopeOfWork: `The Service Provider will deliver a comprehensive digital marketing package:\n\n1. Social Media Management: Content calendar, daily posts on Instagram, Facebook & LinkedIn.\n\n2. Google Ads Campaign: Keyword research, ad setup, landing page optimization.\n\n3. AI-Powered Lead Generation: Automated lead capture via WhatsApp and web forms.\n\n4. Analytics & Reporting: Monthly performance reports with ROI analysis.\n\n5. Brand Strategy: Logo refinement, brand voice guidelines, visual identity.`,
    deliverables: `Brand Strategy & Audit: Week 1\nSocial Media Setup & Content Calendar: Week 1 to 2\nGoogle Ads Campaign Launch: Week 2\nAI Lead Gen System Go-Live: Week 3\nFirst Monthly Performance Report: End of Month 1\nOngoing Management: Monthly`,
    paymentTerms: `Setup Fee (40%) – On Agreement Signing\nMonthly Retainer (60% / months) – 1st of each month`,
    specialConditions: `• Confidentiality: Both parties agree to maintain strict confidentiality of all business information\n• Data Security: All client data handled per IT Act 2000 and DPDP Act 2023\n• Ad spend is separate and paid directly by the Client to Google/Meta\n• Content approval required from Client within 24 hours of submission\n• Minimum contract period: 3 months`,
    services: [
      { service: 'Brand Strategy & Audit', description: 'Logo refinement, brand voice, visual identity', quantity: 1, unit: 'Project', rate: 10000, amount: 10000, gstRate: 18 },
      { service: 'Social Media Management', description: 'Content calendar, daily posts, engagement', quantity: 1, unit: 'Month', rate: 15000, amount: 15000, gstRate: 18 },
      { service: 'Google Ads Campaign', description: 'Keyword research, ad setup, optimization', quantity: 1, unit: 'Month', rate: 12000, amount: 12000, gstRate: 18 },
      { service: 'AI Lead Generation', description: 'WhatsApp + web form automated lead capture', quantity: 1, unit: 'Project', rate: 18000, amount: 18000, gstRate: 18 },
      { service: 'Analytics & Reporting', description: 'Monthly ROI reports and performance analysis', quantity: 1, unit: 'Month', rate: 5000, amount: 5000, gstRate: 18 },
    ],
  },
];
