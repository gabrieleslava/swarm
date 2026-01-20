
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://mvowkqnlgvtmtyqcuyfw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jB6nMk1OfxjrHHHiR6BU_A_GEocUw-j';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Auth Functions ---

export async function signInWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) throw error;
        return { success: true, data };
    } catch (e) {
        console.error('Login error:', e);
        return { success: false, error: e.message };
    }
}

export async function signOut() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // Clear local storage on sign out
        localStorage.removeItem('dinoRogueName');
        return { success: true };
    } catch (e) {
        console.error('Logout error:', e);
        return { success: false, error: e.message };
    }
}

export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    return data.session;
}

// --- Player Profile Functions ---

/**
 * Gets the profile for the *authenticated* user.
 */
export async function getMyProfile() {
    try {
        const session = await getSession();
        if (!session) return null;

        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (error) return null; // Details likely missing
        return data; // { user_id, name, score }
    } catch (e) {
        console.error(e);
        return null;
    }
}

/**
 * Creates a unique name for the authenticated user.
 */
export async function createProfile(name) {
    try {
        const session = await getSession();
        if (!session) return { success: false, error: "Not authenticated" };

        const { data, error } = await supabase
            .from('players')
            .insert([{
                user_id: session.user.id,
                name: name,
                score: 0
            }]);

        if (error) {
            if (error.code === '23505') return { success: false, error: 'NAME_TAKEN' }; // Unique violation
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Updates the score if the new one is higher.
 */
export async function updateBestScore(newScore) {
    try {
        const session = await getSession();
        if (!session) return false;

        // Filter: update only if score < newScore
        const { data, error } = await supabase
            .from('players')
            .update({ score: newScore, updated_at: new Date() })
            .eq('user_id', session.user.id)
            .lt('score', newScore);

        if (error) {
            // It might not be an error, just that score wasn't higher.
            // But we can log just in case.
            return false;
        }
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

// --- Public Data ---

export async function getTopScores(limit = 10) {
    try {
        const { data, error } = await supabase
            .from('players')
            .select('name, score')
            .order('score', { ascending: false })
            .limit(limit);

        if (error) {
            console.error(error);
            return [];
        }
        return data;
    } catch (e) {
        return [];
    }
}

export async function getUserRank(score) {
    try {
        const { count, error } = await supabase
            .from('players')
            .select('*', { count: 'exact', head: true })
            .gt('score', score);

        if (error) return -1;
        return count + 1;
    } catch (e) {
        return -1;
    }
}
