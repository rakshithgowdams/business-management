import { useEffect, useState } from 'react';
import { Plus, Dna, Loader2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import type { AICharacter } from '../../../../lib/marketing/types';
import CharacterLibrary from './CharacterLibrary';
import CharacterTrainer from './CharacterTrainer';
import CharacterGenerator from './CharacterGenerator';

export default function CharacterAI() {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'library' | 'train' | 'generate'>('library');
  const [selectedCharacter, setSelectedCharacter] = useState<AICharacter | null>(null);

  useEffect(() => {
    if (user) loadCharacters();
  }, [user]);

  const loadCharacters = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ai_characters')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setCharacters((data as AICharacter[]) || []);
    setLoading(false);
  };

  const handleSelect = (char: AICharacter) => {
    setSelectedCharacter(char);
    setView('generate');
  };

  const handleTrained = () => {
    loadCharacters();
    setView('library');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('ai_characters').delete().eq('id', id);
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null);
      setView('library');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
            <Dna className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Character AI</h2>
            <p className="text-xs text-gray-400">Train & generate consistent characters across all your content</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('library')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'library' ? 'bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30' : 'text-gray-400 hover:text-white'
            }`}
          >
            Library
          </button>
          <button
            onClick={() => setView('train')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white flex items-center gap-1.5 hover:shadow-lg hover:shadow-[#7C3AED]/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Train New
          </button>
        </div>
      </div>

      {view === 'library' && (
        <CharacterLibrary
          characters={characters}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onTrain={() => setView('train')}
        />
      )}
      {view === 'train' && (
        <CharacterTrainer onComplete={handleTrained} onCancel={() => setView('library')} />
      )}
      {view === 'generate' && selectedCharacter && (
        <CharacterGenerator character={selectedCharacter} onBack={() => setView('library')} />
      )}
    </div>
  );
}
