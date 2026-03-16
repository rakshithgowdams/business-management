import { useState, useEffect, useCallback, useRef } from 'react';
import { Globe, Plus, Eye, EyeOff, Settings, GripVertical, Trash2, Palette, Code, Sparkles, ExternalLink, ChevronDown, ChevronUp, Copy, BarChart3, Menu, LayoutGrid as Layout, Monitor, Tablet, Smartphone, X, Pencil, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import type { WebsiteProject, WebsiteSection, SectionType, BrandKit } from '../../../lib/websiteBuilder/types';
import { SECTION_LABELS, SECTION_ICONS, DEFAULT_SECTION_ORDER, getDefaultConfig, DEFAULT_ANIMATION } from '../../../lib/websiteBuilder/defaults';
import SectionEditor from './SectionEditor';
import WebsitePreview from './WebsitePreview';
import ProjectSettings from './ProjectSettings';
import AddSectionModal from './AddSectionModal';
import BrandKitPanel from './BrandKit';
import { getLucideIcon } from './utils';

type ActivePanel = 'sections' | 'settings' | 'brand';

export default function WebsiteBuilder() {
  const { user } = useAuth();
  const [project, setProject] = useState<WebsiteProject | null>(null);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState<ActivePanel>('sections');
  const [editingSection, setEditingSection] = useState<WebsiteSection | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewSections, setPreviewSections] = useState<WebsiteSection[]>([]);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragOverPos, setDragOverPos] = useState<'above' | 'below'>('below');
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [savingLabel, setSavingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ id: string; startY: number; currentY: number } | null>(null);
  const dragOverIdRef = useRef<string | null>(null);
  const dragOverPosRef = useRef<'above' | 'below'>('below');
  const lastPointerMoveRef = useRef<number>(0);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let { data: proj } = await supabase
        .from('website_projects')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!proj) {
        const { data: newProj } = await supabase
          .from('website_projects')
          .insert({ user_id: user.id, name: 'My Business Website' })
          .select()
          .single();
        proj = newProj;

        if (newProj) {
          const defaultSections = DEFAULT_SECTION_ORDER.map((type, idx) => ({
            project_id: newProj.id,
            user_id: user.id,
            section_type: type,
            label: SECTION_LABELS[type],
            enabled: ['header', 'hero', 'services', 'contact', 'footer'].includes(type),
            order_index: idx,
            config: getDefaultConfig(type),
            animation: DEFAULT_ANIMATION,
          }));
          const { data: newSections } = await supabase
            .from('website_sections')
            .insert(defaultSections)
            .select();
          if (newSections) setSections(newSections.sort((a, b) => a.order_index - b.order_index));
        }
      } else {
        const { data: secs } = await supabase
          .from('website_sections')
          .select('*')
          .eq('project_id', proj.id)
          .order('order_index');
        setSections(secs || []);
      }

      setProject(proj);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPreviewSections(sections); }, [sections]);

  const saveSection = async (updated: WebsiteSection) => {
    setSaving(true);
    try {
      await supabase
        .from('website_sections')
        .update({ config: updated.config, label: updated.label, animation: updated.animation, enabled: updated.enabled, updated_at: new Date().toISOString() })
        .eq('id', updated.id);
      setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
      setEditingSection(updated);
      toast.success('Section saved');
    } catch {
      toast.error('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = async (section: WebsiteSection) => {
    const updated = { ...section, enabled: !section.enabled };
    await supabase.from('website_sections').update({ enabled: updated.enabled }).eq('id', section.id);
    setSections(prev => prev.map(s => s.id === section.id ? updated : s));
    if (editingSection?.id === section.id) setEditingSection(updated);
    toast.success(updated.enabled ? 'Section enabled' : 'Section disabled');
  };

  const deleteSection = async (section: WebsiteSection) => {
    if (!confirm(`Delete "${section.label}"? This cannot be undone.`)) return;
    await supabase.from('website_sections').delete().eq('id', section.id);
    setSections(prev => prev.filter(s => s.id !== section.id));
    if (editingSection?.id === section.id) setEditingSection(null);
    toast.success('Section deleted');
  };

  const duplicateSection = async (section: WebsiteSection) => {
    if (!project) return;
    const maxOrder = Math.max(...sections.map(s => s.order_index), 0);
    const { data: dup } = await supabase
      .from('website_sections')
      .insert({
        project_id: project.id,
        user_id: user!.id,
        section_type: section.section_type,
        label: section.label + ' (Copy)',
        enabled: false,
        order_index: maxOrder + 1,
        config: section.config,
        animation: section.animation,
      })
      .select()
      .single();
    if (dup) {
      setSections(prev => [...prev, dup]);
      toast.success('Section duplicated');
    }
  };

  const startLabelEdit = (e: React.MouseEvent, section: WebsiteSection) => {
    e.stopPropagation();
    setEditingLabelId(section.id);
    setLabelDraft(section.label);
    setTimeout(() => labelInputRef.current?.select(), 50);
  };

  const saveLabelEdit = async (sectionId: string) => {
    const trimmed = labelDraft.trim();
    if (!trimmed) { setEditingLabelId(null); return; }
    setSavingLabel(true);
    try {
      await supabase.from('website_sections').update({ label: trimmed, updated_at: new Date().toISOString() }).eq('id', sectionId);
      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, label: trimmed } : s));
      if (editingSection?.id === sectionId) setEditingSection(prev => prev ? { ...prev, label: trimmed } : prev);
      setEditingLabelId(null);
      toast.success('Label saved');
    } catch {
      toast.error('Failed to save label');
    } finally {
      setSavingLabel(false);
    }
  };

  const addSection = async (type: SectionType) => {
    if (!project) return;
    const maxOrder = Math.max(...sections.map(s => s.order_index), -1);
    const { data: newSec } = await supabase
      .from('website_sections')
      .insert({
        project_id: project.id,
        user_id: user!.id,
        section_type: type,
        label: SECTION_LABELS[type],
        enabled: true,
        order_index: maxOrder + 1,
        config: getDefaultConfig(type),
        animation: DEFAULT_ANIMATION,
      })
      .select()
      .single();
    if (newSec) {
      setSections(prev => [...prev, newSec]);
      setEditingSection(newSec);
      toast.success('Section added');
    }
    setShowAddModal(false);
  };

  const createGhost = (label: string, x: number, y: number) => {
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      position: fixed; z-index: 9999; pointer-events: none;
      background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.4);
      border-radius: 12px; padding: 8px 14px; color: #f97316;
      font-size: 12px; font-weight: 600; font-family: inherit;
      backdrop-filter: blur(8px); white-space: nowrap;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      transform: rotate(-1.5deg) scale(1.04);
      transition: none;
    `;
    ghost.textContent = '≡  ' + label;
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;
  };

  const removeGhost = () => {
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
  };

  const handleGripPointerDown = (e: React.PointerEvent, id: string, label: string) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setDraggedId(id);
    dragStateRef.current = { id, startY: e.clientY, currentY: e.clientY };
    createGhost(label, e.clientX + 12, e.clientY - 14);

    const onMove = (ev: PointerEvent) => {
      if (!dragGhostRef.current) return;
      dragGhostRef.current.style.left = (ev.clientX + 12) + 'px';
      dragGhostRef.current.style.top = (ev.clientY - 14) + 'px';

      const now = Date.now();
      if (now - lastPointerMoveRef.current < 40) return;
      lastPointerMoveRef.current = now;

      const list = listRef.current;
      if (!list) return;
      const items = list.querySelectorAll('[data-section-id]');
      let closestId: string | null = null;
      let closestPos: 'above' | 'below' = 'below';
      let minDist = Infinity;

      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const dist = Math.abs(ev.clientY - midY);
        if (dist < minDist) {
          minDist = dist;
          closestId = (item as HTMLElement).dataset.sectionId || null;
          closestPos = ev.clientY < midY ? 'above' : 'below';
        }
      });

      dragOverIdRef.current = closestId;
      dragOverPosRef.current = closestPos;
      setDragOverId(closestId);
      setDragOverPos(closestPos);
    };

    const onUp = async () => {
      target.releasePointerCapture(e.pointerId);
      removeGhost();
      const currentDraggedId = dragStateRef.current?.id ?? null;
      const currentOverId = dragOverIdRef.current;
      const currentOverPos = dragOverPosRef.current;
      dragStateRef.current = null;
      dragOverIdRef.current = null;

      setDraggedId(null);
      setDragOverId(null);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);

      if (currentDraggedId && currentOverId && currentDraggedId !== currentOverId) {
        setSections(prev => {
          const reordered = [...prev];
          const fromIdx = reordered.findIndex(s => s.id === currentDraggedId);
          let toIdx = reordered.findIndex(s => s.id === currentOverId);
          if (fromIdx === -1 || toIdx === -1) return prev;
          const [moved] = reordered.splice(fromIdx, 1);
          toIdx = reordered.findIndex(s => s.id === currentOverId);
          const insertAt = currentOverPos === 'below' ? toIdx + 1 : toIdx;
          reordered.splice(Math.max(0, insertAt), 0, moved);
          const updated = reordered.map((s, i) => ({ ...s, order_index: i }));
          Promise.all(updated.map(s => supabase.from('website_sections').update({ order_index: s.order_index }).eq('id', s.id)));
          toast.success('Order saved');
          return updated;
        });
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const moveSectionUp = async (idx: number) => {
    if (idx === 0) return;
    const reordered = [...sections];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    const updated = reordered.map((s, i) => ({ ...s, order_index: i }));
    setSections(updated);
    await Promise.all(updated.map(s => supabase.from('website_sections').update({ order_index: s.order_index }).eq('id', s.id)));
  };

  const moveSectionDown = async (idx: number) => {
    if (idx === sections.length - 1) return;
    const reordered = [...sections];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    const updated = reordered.map((s, i) => ({ ...s, order_index: i }));
    setSections(updated);
    await Promise.all(updated.map(s => supabase.from('website_sections').update({ order_index: s.order_index }).eq('id', s.id)));
  };

  const handleBrandKitApply = (kit: BrandKit) => {
    if (!project) return;
    setProject(prev => prev ? {
      ...prev,
      theme_color: kit.primary_color,
      secondary_color: kit.secondary_color,
      font_family: kit.body_font,
    } : prev);
  };

  const saveProject = async (updated: WebsiteProject) => {
    setSaving(true);
    try {
      await supabase.from('website_projects').update({ ...updated, updated_at: new Date().toISOString() }).eq('id', updated.id);
      setProject(updated);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading Website Builder...</p>
        </div>
      </div>
    );
  }

  const enabledCount = sections.filter(s => s.enabled).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#080a0f]">
      {/* Left Panel */}
      <div className="w-[320px] flex-shrink-0 border-r border-white/[0.06] flex flex-col bg-[#0d1117] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold text-white truncate">{project?.name || 'My Website'}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`w-1.5 h-1.5 rounded-full ${project?.published ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                <span className="text-[11px] text-gray-500">{project?.published ? 'Published' : 'Draft'} · {enabledCount} sections active</span>
              </div>
            </div>
            <button
              onClick={() => setShowPreviewDrawer(true)}
              title="Preview website"
              className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/40 transition-all shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Panel Tabs */}
          <div className="flex gap-0.5 bg-white/[0.04] rounded-xl p-1">
            {([['sections', Menu, 'Sections'], ['brand', Palette, 'Brand'], ['settings', Settings, 'Settings']] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setActivePanel(id as ActivePanel)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${activePanel === id ? 'bg-orange-500 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activePanel === 'sections' && (
            <div className="p-3 space-y-1" ref={listRef}>
              {sections.map((section, idx) => {
                const IconComp = getLucideIcon(SECTION_ICONS[section.section_type as SectionType] || 'Layout');
                const isEditing = editingSection?.id === section.id;
                const isDragging = draggedId === section.id;
                const isDragOver = dragOverId === section.id && draggedId !== section.id;

                return (
                  <div key={section.id} className="relative">
                    {isDragOver && dragOverPos === 'above' && (
                      <div className="h-0.5 bg-orange-500 rounded-full mb-1 mx-2 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                    )}
                    <div
                      data-section-id={section.id}
                      className={`group rounded-xl border transition-colors duration-150 cursor-pointer select-none ${
                        isEditing
                          ? 'border-orange-500/40 bg-orange-500/[0.06]'
                          : isDragOver
                          ? 'border-orange-500/30 bg-orange-500/[0.04]'
                          : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]'
                      } ${isDragging ? 'opacity-30 scale-[0.98]' : 'opacity-100'}`}
                      style={{ transition: isDragging ? 'opacity 150ms, transform 150ms' : 'border-color 150ms, background-color 150ms, opacity 150ms, transform 150ms' }}
                      onClick={() => { if (!draggedId) { setEditingSection(section); setActivePanel('sections'); } }}
                    >
                      <div className="flex items-center gap-2.5 px-3 py-2.5">
                        <div
                          onPointerDown={e => handleGripPointerDown(e, section.id, section.label)}
                          className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-orange-400 shrink-0 touch-none transition-colors p-0.5 -m-0.5 rounded"
                          title="Drag to reorder"
                        >
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${section.enabled ? 'bg-orange-500/15 text-orange-400' : 'bg-white/[0.04] text-gray-600'}`}>
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingLabelId === section.id ? (
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <input
                                ref={labelInputRef}
                                value={labelDraft}
                                onChange={e => setLabelDraft(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveLabelEdit(section.id);
                                  if (e.key === 'Escape') setEditingLabelId(null);
                                }}
                                className="flex-1 min-w-0 bg-white/[0.06] border border-orange-500/40 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-white focus:outline-none focus:border-orange-500/70"
                                autoFocus
                              />
                              <button
                                onClick={() => saveLabelEdit(section.id)}
                                disabled={savingLabel}
                                className="shrink-0 w-5 h-5 flex items-center justify-center rounded-md bg-orange-500 text-white hover:bg-orange-400 transition-colors disabled:opacity-50"
                                title="Save label"
                              >
                                {savingLabel ? <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group/label">
                              <div className="text-[12px] font-semibold text-white truncate">{section.label}</div>
                              <button
                                onClick={e => startLabelEdit(e, section)}
                                className="opacity-0 group-hover/label:opacity-100 shrink-0 w-4 h-4 flex items-center justify-center rounded text-gray-600 hover:text-orange-400 transition-all"
                                title="Edit label"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                          <div className="text-[10px] text-gray-600 capitalize">{section.section_type.replace('_', ' ')}</div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); moveSectionUp(idx); }}
                            disabled={idx === 0}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.06] text-gray-600 hover:text-white transition-colors disabled:opacity-20"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); moveSectionDown(idx); }}
                            disabled={idx === sections.length - 1}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/[0.06] text-gray-600 hover:text-white transition-colors disabled:opacity-20"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); toggleSection(section); }}
                          className={`shrink-0 transition-colors ${section.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-600 hover:text-gray-400'}`}
                          title={section.enabled ? 'Disable section' : 'Enable section'}
                        >
                          {section.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {isEditing && (
                        <div className="border-t border-white/[0.05] px-3 py-2 flex gap-2">
                          <button onClick={e => { e.stopPropagation(); duplicateSection(section); }} className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-[10px] font-medium text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors">
                            <Copy className="w-3 h-3" /> Duplicate
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteSection(section); }} className="flex-1 flex items-center justify-center gap-1.5 py-1 rounded-lg text-[10px] font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                    {isDragOver && dragOverPos === 'below' && (
                      <div className="h-0.5 bg-orange-500 rounded-full mt-1 mx-2 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => setShowAddModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/[0.1] text-gray-500 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/[0.03] transition-all text-sm font-medium mt-2"
              >
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>
          )}

          {activePanel === 'brand' && (
            <BrandKitPanel project={project} onApplyToWebsite={handleBrandKitApply} />
          )}

          {activePanel === 'settings' && project && (
            <ProjectSettings project={project} onSave={saveProject} saving={saving} onOpenBrandKit={() => setActivePanel('brand')} />
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/[0.06] space-y-2">
          <button
            onClick={() => setShowPreviewDrawer(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-500/25 bg-orange-500/[0.06] text-orange-400 hover:bg-orange-500/[0.12] hover:border-orange-500/40 transition-all text-xs font-semibold"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview Website
          </button>
          <button
            onClick={async () => {
              await saveProject({ ...project!, published: !project?.published });
              if (!project?.published) {
                const previewId = project?.subdomain || project?.id;
                if (previewId) window.open(`/website/preview/${previewId}`, '_blank');
              }
            }}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${project?.published ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'gradient-orange text-white shadow-lg shadow-orange-500/20 hover:opacity-90'}`}
          >
            <Globe className="w-3.5 h-3.5" />
            {project?.published ? 'Unpublish' : 'Publish'}
          </button>
          {saving && (
            <div className="flex items-center justify-center gap-2 text-xs text-orange-400">
              <div className="w-3 h-3 border border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Center: Section Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {editingSection ? (
          <SectionEditor
            section={editingSection}
            project={project!}
            onSave={saveSection}
            onClose={() => { setEditingSection(null); setPreviewSections(sections); }}
            saving={saving}
            onPreviewChange={(updated) => setPreviewSections(prev => prev.map(s => s.id === updated.id ? updated : s))}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-600/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-9 h-9 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Website Builder</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Select a section from the left panel to edit it, or add a new section to get started building your website.
              </p>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: Layout, label: 'Visual Editor', desc: 'Edit sections with a rich UI' },
                  { icon: Eye, label: 'Preview Drawer', desc: 'Slide open full preview anytime' },
                  { icon: Palette, label: 'Themes & Colors', desc: 'Customize look & feel' },
                  { icon: BarChart3, label: 'Animations', desc: 'Add scroll effects' },
                  { icon: Code, label: 'Custom Code', desc: 'Inject HTML/CSS/JS' },
                  { icon: Settings, label: 'SEO Settings', desc: 'Optimize for search' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <item.icon className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-white">{item.label}</div>
                      <div className="text-[10px] text-gray-600">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddSectionModal onAdd={addSection} onClose={() => setShowAddModal(false)} existingTypes={sections.map(s => s.section_type as SectionType)} />
      )}

      {/* Preview Drawer Overlay — always mounted so it receives live updates */}
      <div
        className="fixed inset-0 z-50 flex pointer-events-none"
        style={{ visibility: showPreviewDrawer ? 'visible' : 'hidden' }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: showPreviewDrawer ? 1 : 0, pointerEvents: showPreviewDrawer ? 'auto' : 'none' }}
          onClick={() => setShowPreviewDrawer(false)}
        />

          {/* Drawer */}
          <div
            className="relative ml-auto flex flex-col bg-[#080a0f] border-l border-white/[0.08] shadow-2xl pointer-events-auto"
            style={{
              width: 'min(92vw, 1100px)',
              transform: showPreviewDrawer ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] shrink-0 bg-[#0d1117]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-white">{project?.name || 'My Business Website'}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${project?.published ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                    <span className="text-[10px] text-gray-500">{project?.published ? 'Live' : 'Draft'} · {enabledCount} sections</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Device switcher */}
                <div className="flex gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
                  {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([mode, Icon]) => (
                    <button
                      key={mode}
                      onClick={() => setPreviewMode(mode)}
                      title={mode}
                      className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-[10px] font-semibold capitalize transition-all ${previewMode === mode ? 'bg-orange-500 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{mode}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const previewId = project?.subdomain || project?.id;
                    if (previewId) window.open(`/website/preview/${previewId}`, '_blank');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-gray-400 hover:text-white hover:border-white/[0.18] transition-all text-xs font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </button>

                <button
                  onClick={() => setShowPreviewDrawer(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 overflow-hidden">
              <WebsitePreview sections={previewSections} project={project} mode={previewMode} />
            </div>
          </div>
      </div>
    </div>
  );
}
