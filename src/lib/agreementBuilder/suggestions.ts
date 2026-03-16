export interface SuggestionOption {
  label: string;
  text: string;
}

export const SUBTITLE_SUGGESTIONS = [
  'Election Campaign AI Services Agreement',
  'AI Automation & Web Development Services Agreement',
  'AI Call Agent Deployment Agreement',
  'WhatsApp Bulk Campaign Services Agreement',
  'Digital Marketing & AI Services Agreement',
  'Software Development Services Agreement',
];

export const SCOPE_SUGGESTIONS: SuggestionOption[] = [
  {
    label: 'Election Campaign',
    text: `The Service Provider agrees to deliver the following AI-powered campaign services:\n\n1. AI Call Agent Setup: Platform configuration, voice creation, call script design, testing, and live dashboard.\n\n2. WhatsApp Bulk Messaging: n8n workflow setup, multi-number configuration, contact import, and message templates.\n\n3. Campaign Content: Message scripts and call script writing in English and Kannada.\n\n4. Campaign Management: Daily monitoring, reports, and troubleshooting throughout the campaign period.`,
  },
  {
    label: 'AI Automation',
    text: `The Service Provider will design and deploy a complete AI automation workflow including:\n\n1. n8n Workflow Development: Custom automation pipelines for lead capture and follow-up.\n\n2. RAG System Integration: AI-powered knowledge base and document retrieval system.\n\n3. WhatsApp Business API Integration: Automated customer communication system.\n\n4. Dashboard & Reporting: Real-time analytics and performance monitoring.`,
  },
  {
    label: 'Web Development',
    text: `The Service Provider will deliver a fully functional website with:\n\n1. UI/UX Design: Custom design with brand guidelines and responsive layout.\n\n2. Frontend Development: React-based responsive web application.\n\n3. Backend Integration: API connections and database setup.\n\n4. SEO Optimization: On-page SEO and performance tuning.\n\n5. Training & Handover: 2-hour walkthrough session post-launch.`,
  },
  {
    label: 'AI Call Agent',
    text: `The Service Provider agrees to configure and deploy an AI voice call agent:\n\n1. Voice Agent Setup: ElevenLabs voice creation with custom script.\n\n2. Call Flow Design: IVR menu, press-1 transfer, and voicemail handling.\n\n3. Platform Integration: Twilio/Exotel configuration for India market.\n\n4. Compliance: TRAI-compliant calling hours (9 AM – 8 PM).\n\n5. Reporting: Live dashboard with call delivery and response tracking.`,
  },
];

export const DELIVERABLES_SUGGESTIONS: SuggestionOption[] = [
  {
    label: 'Campaign Timeline',
    text: `AI Call Agent – Setup & Testing Complete: Day 1 to 3 after signing\nWhatsApp Bulk System – Setup & Testing: Day 1 to 2 after signing\nCampaign Go-Live (All Services): Day 4 to 5 after signing\nDaily Reports (Calls + WhatsApp): Every evening during campaign\nFinal Campaign Summary Report: 3 days after campaign ends`,
  },
  {
    label: 'Project Timeline',
    text: `Project Kickoff & Discovery: Day 1 to 2 after signing\nDesign Mockups & Approval: Day 3 to 7 after signing\nDevelopment Phase 1: Week 2 to 3\nTesting & Quality Assurance: Week 4\nLaunch & Go-Live: End of Week 4\nPost-launch Support: 30 days after launch`,
  },
  {
    label: 'Automation Timeline',
    text: `Workflow Design & Architecture: Day 1 to 3\nDevelopment & Integration: Day 4 to 14\nTesting & UAT: Day 15 to 18\nGo-Live & Training: Day 19 to 21\nMonitoring & Support: 30 days post go-live`,
  },
];

export const PAYMENT_SUGGESTIONS: SuggestionOption[] = [
  {
    label: '50-50 Split',
    text: `Advance (50%) – On Agreement Signing\nBalance (50%) – On Go-Live of Services`,
  },
  {
    label: '30-40-30 Milestones',
    text: `Milestone 1 (30%) – On Project Kickoff\nMilestone 2 (40%) – On Design Approval\nMilestone 3 (30%) – On Final Delivery`,
  },
  {
    label: 'Full Upfront',
    text: `Full Payment – Due within 7 days of signing\nLate Payment: 2% per month on outstanding amount`,
  },
];

export const SPECIAL_CONDITIONS_SUGGESTIONS: SuggestionOption[] = [
  {
    label: 'Election Compliance',
    text: `• All digital campaigning must comply with Election Commission of India's Model Code of Conduct (MCC)\n• Bulk calling must follow TRAI guidelines – calls permitted only between 9:00 AM and 8:00 PM\n• The Client is solely responsible for ensuring voter contact data is obtained lawfully\n• DND registered numbers will be excluded to avoid TRAI violations\n• The Service Provider does not guarantee vote outcomes – services are limited to communication delivery`,
  },
  {
    label: 'General IP & Feedback',
    text: `• All intellectual property created during this project remains with the Client upon full payment\n• Service Provider retains right to showcase work in portfolio without sensitive data\n• Source code and assets delivered within 7 days of final payment\n• Client must provide timely feedback within 48 hours of each milestone`,
  },
  {
    label: 'Data & Confidentiality',
    text: `• Confidentiality: Both parties agree to maintain strict confidentiality of all business information\n• Data Security: All client data handled per IT Act 2000 and DPDP Act 2023\n• Non-compete: Service Provider will not work with direct competitors for 6 months\n• Dispute Resolution: Disputes to be resolved via arbitration in Hassan, Karnataka`,
  },
];
