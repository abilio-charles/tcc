import { supabase } from '../config/supabase';

export async function getProcesses(userId) {
  const { data, error } = await supabase
    .from('processes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function createProcess(process) {
  const { data, error } = await supabase
    .from('processes')
    .insert([process])
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function updateProcess(id, process) {
  const { data, error } = await supabase
    .from('processes')
    .update(process)
    .eq('id', id)
    .select();

  if (error) {
    throw error;
  }

  return data[0];
}

export async function deleteProcess(id) {
  const { error } = await supabase
    .from('processes')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
}