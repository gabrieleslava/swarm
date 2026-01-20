
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://mvowkqnlgvtmtyqcuyfw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jB6nMk1OfxjrHHHiR6BU_A_GEocUw-j';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Registers a new player.
 * Returns { success: true, id: number, name: string } or { success: false, error: string }
 */
export async function registerPlayer(name) {
    try {
        const { data, error } = await supabase
            .from('scores')
            .insert([{ name: name, score: 0 }])
            .select() // Return the ID
            .single();

        if (error) {
            // Check for unique violation (Postgres error 23505)
            if (error.code === '23505') {
                return { success: false, error: 'NAME_TAKEN' };
            }
            console.error('Error registering player:', error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data.id, name: data.name };
    } catch (e) {
        console.error('Exception registering player:', e);
        return { success: false, error: e.message };
    }
}

/**
 * Gets player data by ID (for restoring session).
 */
export async function getPlayerById(id) {
    try {
        const { data, error } = await supabase
            .from('scores')
            .select('id, name, score')
            .eq('id', id)
            .single();

        if (error) return null;
        return data;
    } catch (e) {
        return null;
    }
}

/**
 * Updates the score for a specific player ID, ONLY if the new score is higher.
 */
export async function updatePlayerScore(id, newScore) {
    try {
        // We use a "filter-based update": Update score = newScore WHERE id = id AND score < newScore
        // This ensures strictly increasing scores.
        const { data, error } = await supabase
            .from('scores')
            .update({ score: newScore })
            .eq('id', id)
            .lt('score', newScore);

        if (error) {
            console.error('Error updating score:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Exception updating score:', e);
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
        return data; // No deduplication needed locally anymore!
    } catch (e) {
        console.error('Exception fetching scores:', e);
        return [];
    }
}

export async function getUserRank(score) {
    try {
        // Count how many people have a higher score
        const { count, error } = await supabase
            .from('scores')
            .select('*', { count: 'exact', head: true })
            .gt('score', score);

        if (error) {
            return -1;
        }
        return count + 1;
    } catch (e) {
        return -1;
    }
}
