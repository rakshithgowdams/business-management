import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { InputField } from './curlParser';

export interface CustomModel {
  id: string;
  name: string;
  model_id: string;
  category: string;
  endpoint: string;
  method: string;
  default_input: Record<string, unknown>;
  input_schema: InputField[];
  has_prompt: boolean;
  has_image_input: boolean;
  has_callback: boolean;
  is_active: boolean;
}

export function useCustomModels(userId: string | undefined, category: string | string[]) {
  const [models, setModels] = useState<CustomModel[]>([]);

  useEffect(() => {
    if (!userId) return;
    const cats = Array.isArray(category) ? category : [category];

    supabase
      .from('kie_custom_models')
      .select('id,name,model_id,category,endpoint,method,default_input,input_schema,has_prompt,has_image_input,has_callback,is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .in('category', cats)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setModels(data as CustomModel[]);
      });
  }, [userId, Array.isArray(category) ? category.join(',') : category]);

  return models;
}
