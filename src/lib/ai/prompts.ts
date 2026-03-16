import type { AIFormData, AnalysisResult, ROIResult } from './types';

export function buildAnalysisPrompt(formData: AIFormData): string {
  return `You are a senior business analyst at MyDesignNexus, Karnataka, India.

Services: AI Automation (₹15K-1.5L), AI Call Agent (₹20K-2L), Web Development (₹8K-80K).

Analyze this business:
${JSON.stringify(formData)}

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no text before/after. Keep each text field concise (1-2 sentences). Limit arrays to max 3-4 items.

Return this EXACT JSON structure:
{
  "business_summary": "2-3 sentence overview of their business",
  "digital_maturity_score": 1-10,
  "digital_maturity_label": "Beginner/Developing/Moderate/Advanced",
  "urgency_score": 1-10,
  "deal_potential": "Low/Medium/High/Very High",
  "estimated_deal_value": "₹X,XXX – ₹X,XXX",
  "top_pain_points": [
    {
      "pain": "pain point title",
      "impact": "how this hurts their business daily",
      "cost_estimate": "estimated annual cost/loss in ₹",
      "urgency": "Critical/High/Medium/Low"
    }
  ],
  "service_recommendations": [
    {
      "service": "AI Automation / AI Call Agent / Web Development",
      "priority": 1,
      "why_they_need_it": "specific reason based on their business",
      "specific_solution": "exact solution to build for them",
      "estimated_price": "₹X,XXX – ₹X,XXX",
      "implementation_time": "X weeks",
      "roi_timeline": "They will recover investment in X months"
    }
  ],
  "personal_pain_points": [
    "Owner is likely stressed about...",
    "They probably worry about...",
    "Their daily frustration is..."
  ],
  "professional_pain_points": [
    "Their team struggles with...",
    "Their workflow bottleneck is...",
    "Their biggest operational challenge is..."
  ],
  "business_pain_points": [
    "Their revenue is limited because...",
    "Their growth is blocked by...",
    "Their competitive disadvantage is..."
  ],
  "buying_psychology": {
    "primary_motivation": "what will make them say yes",
    "main_objection": "what will make them hesitate",
    "objection_handler": "how to overcome their objection",
    "best_closing_angle": "emotional trigger to close the deal",
    "trust_builders": ["what builds trust with this type of client"]
  },
  "competitor_weaknesses": [
    "weakness 1 to exploit",
    "weakness 2 to exploit"
  ],
  "quick_wins": [
    "Something we can show them in first 7 days",
    "Another quick win to build confidence"
  ]
}`;
}

export function buildROIPrompt(analysis: AnalysisResult): string {
  const compact = {
    business_summary: analysis.business_summary,
    service_recommendations: analysis.service_recommendations.slice(0, 3).map(r => ({
      service: r.service, estimated_price: r.estimated_price, implementation_time: r.implementation_time,
    })),
    top_pain_points: analysis.top_pain_points.slice(0, 3).map(p => ({ pain: p.pain, cost_estimate: p.cost_estimate })),
  };

  return `Calculate ROI for these recommended services:
${JSON.stringify(compact)}

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no text before/after. Keep roi_proof_example to 1 sentence. Limit roi_calculations to max 3 items.

Return this exact structure:
{"roi_calculations":[{"service":"string","current_cost_annually":"string","time_saved_weekly":"string","money_saved_monthly":"string","revenue_increase_monthly":"string","total_annual_benefit":"string","service_cost":"string","payback_period":"string","three_year_roi":"string","roi_percentage":"string","roi_proof_example":"string"}],"total_opportunity_cost":"string","total_investment_needed":"string","total_annual_savings":"string","breakeven_months":3}`;
}

export function buildOutreachPrompt(formData: AIFormData, analysis: AnalysisResult): string {
  const topPain = analysis.top_pain_points[0]?.pain || 'operational inefficiency';
  const topService = analysis.service_recommendations[0]?.service || 'AI Automation';

  return `You are Rakshith, founder of MyDesignNexus, Karnataka. Write cold outreach for:

Business: ${formData.business_name} (${formData.business_type}), Owner: ${formData.owner_name}, City: ${formData.city}
Pain: ${topPain}, Service: ${topService}

Warm, advisory tone. Reference their specific situation.

CRITICAL: Return ONLY valid JSON. No markdown, no code fences. Keep messages concise. Limit follow_up_sequence to 4 items.

Return this exact structure:
{"whatsapp_message_1":{"tone":"string","message":"string","length":"string","best_time_to_send":"string"},"whatsapp_message_2":{"tone":"string","message":"string","length":"string"},"whatsapp_message_3":{"tone":"string","message":"string","length":"string"},"email_subject_1":"string","email_body_1":"string","email_subject_2":"string","email_body_2":"string","linkedin_message":"string","instagram_dm":"string","follow_up_sequence":[{"day":1,"channel":"string","message":"string"}]}`;
}

export function buildCompetitorPrompt(formData: AIFormData, analysis: AnalysisResult): string {
  const topService = analysis.service_recommendations[0]?.service || 'AI Automation';

  return `Compare MyDesignNexus vs alternatives for: ${formData.business_type} in ${formData.city}.
Competitors: ${formData.competitor_1_name || 'None'} ${formData.competitor_2_name || ''}
Service: ${topService}

MyDesignNexus: Karnataka-based, Kannada support, AI automation specialist, affordable, 5+ years experience.

CRITICAL: Return ONLY valid JSON. No markdown, no code fences. Limit comparison_table to 5 rows, our_unfair_advantages to 3. Keep text concise (1-2 sentences per field).

Return this exact structure:
{"comparison_table":[{"criteria":"string","mydesignnexus":"string","typical_agency":"string","freelancer":"string","doing_nothing":"string","winner":"string"}],"our_unfair_advantages":[{"advantage":"string","explanation":"string"}],"why_not_cheap_freelancer":"string","why_not_big_agency":"string","why_not_diy":"string","our_guarantee":"string","risk_reversal":"string"}`;
}

export function buildProposalPrompt(formData: AIFormData, analysis: AnalysisResult, roi: ROIResult): string {
  const compactForm = {
    business_name: formData.business_name,
    owner_name: formData.owner_name,
    business_type: formData.business_type,
    city: formData.city,
    team_size: formData.team_size,
    monthly_revenue: formData.monthly_revenue,
    pain_points: formData.pain_points,
    budget: formData.budget,
    urgency: formData.urgency,
  };

  const compactAnalysis = {
    business_summary: analysis.business_summary,
    deal_potential: analysis.deal_potential,
    estimated_deal_value: analysis.estimated_deal_value,
    top_pain_points: analysis.top_pain_points.slice(0, 3).map(p => ({ pain: p.pain, impact: p.impact })),
    service_recommendations: analysis.service_recommendations.slice(0, 3).map(r => ({
      service: r.service, specific_solution: r.specific_solution,
      estimated_price: r.estimated_price, implementation_time: r.implementation_time,
    })),
    quick_wins: analysis.quick_wins,
  };

  const compactROI = {
    roi_calculations: roi.roi_calculations.slice(0, 3).map(r => ({
      service: r.service, money_saved_monthly: r.money_saved_monthly,
      roi_percentage: r.roi_percentage, payback_period: r.payback_period,
    })),
    total_investment_needed: roi.total_investment_needed,
    total_annual_savings: roi.total_annual_savings,
  };

  return `Create a personalized business proposal for ${formData.business_name}.

BUSINESS: ${JSON.stringify(compactForm)}
ANALYSIS: ${JSON.stringify(compactAnalysis)}
ROI: ${JSON.stringify(compactROI)}

CRITICAL RULES:
- Return ONLY valid JSON. No markdown, no code fences, no text before/after the JSON
- Keep each text field concise (1-3 sentences max)
- Limit services_proposed to max 3 items, whats_included to max 4 items each
- Limit implementation_plan to max 4 steps, faq to max 3 items, next_steps to max 3 items
- All prices in ₹ (INR)
- Use business name "${formData.business_name}" throughout

Return this exact JSON structure:
{"proposal":{"title":"string","executive_summary":"string","current_situation":{"heading":"string","content":"string"},"vision":{"heading":"string","content":"string"},"services_proposed":[{"service_name":"string","what_we_will_build":"string","how_it_solves_their_pain":"string","timeline":"string","investment":"string","whats_included":["string"],"success_metric":"string"}],"implementation_plan":[{"week":"string","activities":"string"}],"investment_summary":{"total_investment":"string","payment_terms":"string","what_happens_if_they_wait":"string"},"social_proof":{"relevant_case_study":"string","testimonial_style":"string","results_achieved":"string"},"faq":[{"question":"string","answer":"string"}],"next_steps":["string"],"closing_message":"string"}}`;
}
