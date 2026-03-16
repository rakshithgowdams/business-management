import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { History, Save, Loader2, Bot, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { callAI, hasApiKey, getModelNameForTask } from '../../../lib/ai/api';
import { buildAnalysisPrompt, buildROIPrompt, buildOutreachPrompt, buildCompetitorPrompt, buildProposalPrompt } from '../../../lib/ai/prompts';
import type { AIFormData, AnalysisResult, ROIResult, OutreachResult, CompetitorResult, ProposalResult } from '../../../lib/ai/types';
import type { TaskType } from '../../../lib/ai/models';
import AIClientForm from './AIClientForm';
import AIResultsDashboard from './AIResultsDashboard';
import AIAnalysisConfig from './AIAnalysisConfig';

interface StepInfo {
  task: TaskType;
  icon: string;
  label: string;
  modelName: string;
  status: 'pending' | 'running' | 'done' | 'error';
}

export default function AIIntelligence() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalTokens, setTotalTokens] = useState(0);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AIFormData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [roi, setRoi] = useState<ROIResult | null>(null);
  const [outreach, setOutreach] = useState<OutreachResult | null>(null);
  const [competitor, setCompetitor] = useState<CompetitorResult | null>(null);
  const [proposal, setProposal] = useState<ProposalResult | null>(null);
  const [initialFormData, setInitialFormData] = useState<Partial<AIFormData> | undefined>();
  const [modelsUsed, setModelsUsed] = useState<Record<string, string>>({});

  const [steps, setSteps] = useState<StepInfo[]>([
    { task: 'business_analysis', icon: '🧠', label: 'Business Analysis', modelName: '', status: 'pending' },
    { task: 'roi_calculation', icon: '💰', label: 'ROI Calculator', modelName: '', status: 'pending' },
    { task: 'cold_messages', icon: '📨', label: 'Cold Messages', modelName: '', status: 'pending' },
    { task: 'competitor_analysis', icon: '⚔️', label: 'Competitor Analysis', modelName: '', status: 'pending' },
    { task: 'proposal_writing', icon: '📄', label: 'Proposal Writer', modelName: '', status: 'pending' },
  ]);

  useEffect(() => {
    const id = searchParams.get('id');
    const regenerateId = searchParams.get('regenerate');
    const clientId = searchParams.get('clientId');

    if (id) loadExistingAnalysis(id);
    else if (regenerateId) loadForRegenerate(regenerateId);
    else if (clientId) loadFromClient(clientId);
  }, [searchParams, user]);

  const loadExistingAnalysis = async (id: string) => {
    const { data } = await supabase.from('ai_analyses').select('*').eq('id', id).maybeSingle();
    if (!data) return;
    setAnalysisId(data.id);
    setFormData(data.form_data as AIFormData);
    setAnalysis(data.analysis_result as AnalysisResult | null);
    setRoi(data.roi_result as ROIResult | null);
    setOutreach(data.outreach_result as OutreachResult | null);
    setCompetitor(data.competitor_result as CompetitorResult | null);
    if (data.proposal_result) {
      const raw = data.proposal_result as Record<string, unknown>;
      const normalized: ProposalResult = raw.proposal
        ? (raw as unknown as ProposalResult)
        : { proposal: raw as unknown as ProposalResult['proposal'] };
      setProposal(normalized);
    }
    setCurrentStep(data.analysis_result ? 5 : 0);
  };

  const loadForRegenerate = async (id: string) => {
    const { data } = await supabase.from('ai_analyses').select('form_data').eq('id', id).maybeSingle();
    if (data) setInitialFormData(data.form_data as AIFormData);
  };

  const loadFromClient = async (clientId: string) => {
    const { data } = await supabase.from('clients').select('*').eq('id', clientId).maybeSingle();
    if (data) {
      setInitialFormData({
        business_name: data.company_name || data.full_name || '',
        owner_name: data.full_name || '',
        business_type: data.industry_type || '',
        city: data.city || '',
        state: data.state || '',
        website_url: data.website || '',
      });
    }
  };

  const updateStep = (index: number, update: Partial<StepInfo>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
  };

  const runAnalysis = useCallback(async (data: AIFormData) => {
    const keyExists = await hasApiKey();
    if (!keyExists) {
      toast.error('Please add your API key in Settings > AI Settings');
      return;
    }

    setAnalyzing(true);
    setFormData(data);
    setAnalysis(null);
    setRoi(null);
    setOutreach(null);
    setCompetitor(null);
    setProposal(null);
    setCurrentStep(0);
    setTotalTokens(0);
    setModelsUsed({});
    let tokens = 0;

    const initialSteps: StepInfo[] = [
      { task: 'business_analysis', icon: '🧠', label: 'Business Analysis', modelName: getModelNameForTask('business_analysis'), status: 'pending' },
      { task: 'roi_calculation', icon: '💰', label: 'ROI Calculator', modelName: getModelNameForTask('roi_calculation'), status: 'pending' },
      { task: 'cold_messages', icon: '📨', label: 'Cold Messages', modelName: getModelNameForTask('cold_messages'), status: 'pending' },
      { task: 'competitor_analysis', icon: '⚔️', label: 'Competitor Analysis', modelName: getModelNameForTask('competitor_analysis'), status: 'pending' },
      { task: 'proposal_writing', icon: '📄', label: 'Proposal Writer', modelName: getModelNameForTask('proposal_writing'), status: 'pending' },
    ];
    setSteps(initialSteps);

    const { data: saved } = await supabase.from('ai_analyses').insert({
      user_id: user!.id,
      business_name: data.business_name,
      business_type: data.business_type,
      owner_name: data.owner_name,
      city: data.city,
      state: data.state,
      form_data: data,
    }).select('id').single();
    const savedId = saved?.id;
    if (savedId) setAnalysisId(savedId);

    updateStep(0, { status: 'running' });
    const r1 = await callAI(buildAnalysisPrompt(data), true, 'business_analysis');
    if (r1.error) {
      updateStep(0, { status: 'error' });
      toast.error(r1.error);
      setAnalyzing(false);
      return;
    }
    const analysisData = r1.data as unknown as AnalysisResult;
    setAnalysis(analysisData);
    setCurrentStep(1);
    tokens += r1.tokens_used;
    setTotalTokens(tokens);
    setModelsUsed((prev) => ({ ...prev, business_analysis: r1.model_used || getModelNameForTask('business_analysis') }));
    updateStep(0, { status: 'done' });
    if (savedId) {
      await supabase.from('ai_analyses').update({
        analysis_result: r1.data,
        deal_potential: analysisData.deal_potential || 'Medium',
        estimated_deal_value: analysisData.estimated_deal_value || '',
      }).eq('id', savedId);
    }

    updateStep(1, { status: 'running' });
    const r2 = await callAI(buildROIPrompt(analysisData), true, 'roi_calculation');
    if (!r2.error && r2.data) {
      const roiData = r2.data as unknown as ROIResult;
      setRoi(roiData);
      tokens += r2.tokens_used;
      setTotalTokens(tokens);
      setModelsUsed((prev) => ({ ...prev, roi_calculation: r2.model_used || getModelNameForTask('roi_calculation') }));
      updateStep(1, { status: 'done' });
      if (savedId) await supabase.from('ai_analyses').update({ roi_result: r2.data }).eq('id', savedId);
    } else {
      updateStep(1, { status: 'error' });
    }
    setCurrentStep(2);

    updateStep(2, { status: 'running' });
    const r3 = await callAI(buildOutreachPrompt(data, analysisData), true, 'cold_messages');
    if (!r3.error && r3.data) {
      setOutreach(r3.data as unknown as OutreachResult);
      tokens += r3.tokens_used;
      setTotalTokens(tokens);
      setModelsUsed((prev) => ({ ...prev, cold_messages: r3.model_used || getModelNameForTask('cold_messages') }));
      updateStep(2, { status: 'done' });
      if (savedId) await supabase.from('ai_analyses').update({ outreach_result: r3.data }).eq('id', savedId);
    } else {
      updateStep(2, { status: 'error' });
    }
    setCurrentStep(3);

    updateStep(3, { status: 'running' });
    const r4 = await callAI(buildCompetitorPrompt(data, analysisData), true, 'competitor_analysis');
    if (!r4.error && r4.data) {
      setCompetitor(r4.data as unknown as CompetitorResult);
      tokens += r4.tokens_used;
      setTotalTokens(tokens);
      setModelsUsed((prev) => ({ ...prev, competitor_analysis: r4.model_used || getModelNameForTask('competitor_analysis') }));
      updateStep(3, { status: 'done' });
      if (savedId) await supabase.from('ai_analyses').update({ competitor_result: r4.data }).eq('id', savedId);
    } else {
      updateStep(3, { status: 'error' });
    }
    setCurrentStep(4);

    updateStep(4, { status: 'running' });
    const roiForProposal = (r2.data as unknown as ROIResult) || { roi_calculations: [], total_opportunity_cost: '', total_investment_needed: '', total_annual_savings: '', breakeven_months: 0 };
    const r5 = await callAI(buildProposalPrompt(data, analysisData, roiForProposal), true, 'proposal_writing');
    if (!r5.error && r5.data) {
      const rawProposal = r5.data as Record<string, unknown>;
      const normalizedProposal: ProposalResult = rawProposal.proposal
        ? (rawProposal as unknown as ProposalResult)
        : { proposal: rawProposal as unknown as ProposalResult['proposal'] };
      setProposal(normalizedProposal);
      tokens += r5.tokens_used;
      setTotalTokens(tokens);
      setModelsUsed((prev) => ({ ...prev, proposal_writing: r5.model_used || getModelNameForTask('proposal_writing') }));
      updateStep(4, { status: 'done' });
      if (savedId) await supabase.from('ai_analyses').update({ proposal_result: normalizedProposal, status: 'completed' }).eq('id', savedId);
    } else {
      updateStep(4, { status: 'error' });
      if (r5.error) toast.error(`Proposal: ${r5.error}`);
      if (savedId) await supabase.from('ai_analyses').update({ status: 'completed' }).eq('id', savedId);
    }
    setCurrentStep(5);

    setAnalyzing(false);
    toast.success('Analysis complete!');
  }, [user]);

  const handleSaveToClient = async () => {
    if (!analysisId || !formData) return;
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user!.id)
      .eq('company_name', formData.business_name)
      .maybeSingle();

    if (existingClient) {
      await supabase.from('ai_analyses').update({ client_id: existingClient.id, status: 'saved' }).eq('id', analysisId);
      toast.success('Linked to existing client');
    } else {
      const { data: newClient } = await supabase.from('clients').insert({
        user_id: user!.id,
        full_name: formData.owner_name,
        company_name: formData.business_name,
        city: formData.city,
        state: formData.state,
        industry_type: formData.business_type,
        website: formData.website_url,
        status: 'lead',
      }).select('id').single();
      if (newClient) {
        await supabase.from('ai_analyses').update({ client_id: newClient.id, status: 'saved' }).eq('id', analysisId);
        toast.success('New client created & analysis linked');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Client Intelligence Engine</h1>
              <p className="text-sm text-gray-500">Analyze any business. Generate sales weapons instantly.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {analysisId && analysis && (
            <button onClick={handleSaveToClient} className="px-4 py-2 rounded-lg border border-brand-500/30 text-brand-400 text-sm font-medium hover:bg-brand-500/5 flex items-center gap-2">
              <Save className="w-4 h-4" /> Save to Client
            </button>
          )}
          <button onClick={() => navigate('/dashboard/ai-intelligence/history')} className="px-4 py-2 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 flex items-center gap-2">
            <History className="w-4 h-4" /> History
          </button>
        </div>
      </div>

      <AIAnalysisConfig disabled={analyzing} />

      {analyzing && (
        <div className="glass-card rounded-xl p-4">
          <div className="space-y-2">
            {steps.map((step) => (
              <div key={step.task} className="flex items-center gap-3">
                <div className="w-6 text-center">
                  {step.status === 'running' && <Loader2 className="w-4 h-4 text-brand-400 animate-spin mx-auto" />}
                  {step.status === 'done' && <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />}
                  {step.status === 'pending' && <div className="w-2 h-2 rounded-full bg-dark-500 mx-auto" />}
                  {step.status === 'error' && <span className="text-red-400 text-xs">!</span>}
                </div>
                <span className="text-sm">{step.icon}</span>
                <span className={`text-sm flex-1 ${step.status === 'running' ? 'text-white font-medium' : step.status === 'done' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {step.modelName && step.status !== 'pending' ? (
                    <>
                      <span className="text-brand-400">{step.modelName}</span>{' '}
                      {step.status === 'running' ? `running ${step.label.toLowerCase()}...` : step.label.toLowerCase()}
                    </>
                  ) : (
                    step.label
                  )}
                </span>
                {step.status === 'running' && <span className="text-[10px] text-gray-600 animate-pulse">processing</span>}
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  step.status === 'done' ? 'bg-green-500' : step.status === 'running' ? 'bg-brand-500 animate-pulse' : 'bg-dark-600'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2">
          <AIClientForm
            initialData={initialFormData}
            onSubmit={runAnalysis}
            loading={analyzing}
          />
        </div>
        <div className="xl:col-span-3">
          <AIResultsDashboard
            analysis={analysis}
            roi={roi}
            outreach={outreach}
            competitor={competitor}
            proposal={proposal}
            businessName={formData?.business_name || ''}
            currentStep={currentStep}
            totalTokens={totalTokens}
            modelsUsed={modelsUsed}
          />
        </div>
      </div>
    </div>
  );
}
