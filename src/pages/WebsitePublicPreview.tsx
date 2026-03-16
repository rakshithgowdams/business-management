import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { WebsiteSection, WebsiteProject } from '../lib/websiteBuilder/types';
import PublicWebsiteRenderer from './websitepreview/PublicWebsiteRenderer';

export default function WebsitePublicPreview() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [project, setProject] = useState<WebsiteProject | null>(null);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!subdomain) return;
    (async () => {
      const { data: proj } = await supabase
        .from('website_projects')
        .select('*')
        .eq('subdomain', subdomain)
        .maybeSingle();

      if (!proj) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const { data: secs } = await supabase
        .from('website_sections')
        .select('*')
        .eq('project_id', proj.id)
        .eq('enabled', true)
        .order('order_index');

      setProject(proj);
      setSections(secs || []);
      setLoading(false);
    })();
  }, [subdomain]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading website...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-black text-white/5 mb-4">404</div>
          <h1 className="text-xl font-bold text-white mb-2">Website Not Found</h1>
          <p className="text-gray-500 text-sm">The website you're looking for doesn't exist or hasn't been published yet.</p>
        </div>
      </div>
    );
  }

  return <PublicWebsiteRenderer sections={sections} project={project} />;
}
