
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://mvowkqnlgvtmtyqcuyfw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jB6nMk1OfxjrHHHiR6BU_A_GEocUw-j';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function saveScore(name, score) {
    try {
        const { data, error } = await supabase
            .from('scores')
            .insert([
                { name: name, score: score },
            ]);

        if (error) {
            console.error('Error saving score:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Exception saving score:', e);
        return false;
    }
}

export async function getTopScores(limit = 10) {
    try {
        const { data, error } = await supabase
            .from('scores')
            .select('name, score')
            .order('score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching scores:', error);
            return [];
        }
        return data;
    } catch (e) {
        console.error('Exception fetching scores:', e);
        return [];
    }
}

export async function getUserRank(score) {
    try {
        const { count, error } = await supabase
            .from('scores')
            .select('*', { count: 'exact', head: true })
            .gt('score', score);

        if (error) {
            console.error('Error fetching rank:', error);
            return -1;
        }
        return count + 1;
    } catch (e) {
        console.error('Exception fetching rank:', e);
        return -1;
    }
}
