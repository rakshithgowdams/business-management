import { Image, Film, Pencil, Trash2, UserPlus } from 'lucide-react';
import type { AICharacter } from '../../../../lib/marketing/types';

interface Props {
  characters: AICharacter[];
  onSelect: (char: AICharacter) => void;
  onDelete: (id: string) => void;
  onTrain: () => void;
}

export default function CharacterLibrary({ characters, onSelect, onDelete, onTrain }: Props) {
  if (characters.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#7C3AED]/10 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-8 h-8 text-[#7C3AED]" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Characters Yet</h3>
        <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
          Train your first AI character with reference photos. Your character will be consistent across all generated images and videos.
        </p>
        <button
          onClick={onTrain}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] text-white font-semibold hover:shadow-lg hover:shadow-[#7C3AED]/20 transition-all"
        >
          Train Your First Character
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {characters.map((char) => (
        <div
          key={char.id}
          className="glass-card rounded-xl overflow-hidden group hover:border-[#7C3AED]/30 transition-all"
        >
          <div className="h-32 bg-gradient-to-br from-[#7C3AED]/10 to-[#A855F7]/5 relative flex items-center p-6">
            <div className="w-16 h-16 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-2xl shrink-0">
              {char.character_type === 'brand_mascot' ? '🎭' : char.character_type === 'ai_influencer' ? '🤖' : '👤'}
            </div>
            <div className="ml-4 min-w-0">
              <h4 className="text-lg font-semibold text-white truncate">{char.name}</h4>
              <p className="text-xs text-gray-400 capitalize">{char.character_type.replace('_', ' ')}</p>
              <p className="text-xs text-gray-500 mt-0.5">{char.photos_count} reference photos</p>
            </div>
            <div className="absolute top-3 right-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                char.status === 'ready'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : char.status === 'training'
                  ? 'bg-[#F1C40F]/20 text-[#F1C40F]'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {char.status === 'ready' ? 'Ready' : char.status === 'training' ? 'Training...' : 'Failed'}
              </span>
            </div>
          </div>

          <div className="p-4">
            {char.style_notes && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{char.style_notes}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelect(char)}
                className="flex-1 py-2 rounded-lg bg-[#7C3AED]/10 text-[#A855F7] text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#7C3AED]/20 transition-colors"
              >
                <Image className="w-3.5 h-3.5" /> Generate Image
              </button>
              <button
                onClick={() => onSelect(char)}
                className="flex-1 py-2 rounded-lg bg-[#7C3AED]/10 text-[#A855F7] text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-[#7C3AED]/20 transition-colors"
              >
                <Film className="w-3.5 h-3.5" /> Animate
              </button>
              <button
                onClick={() => onDelete(char.id)}
                className="py-2 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
