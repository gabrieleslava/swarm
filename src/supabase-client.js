
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://mvowkqnlgvtmtyqcuyfw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jB6nMk1OfxjrHHHiR6BU_A_GEocUw-j';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function saveScore(name, score) {
    try {
        // Check if user already has a higher or equal score
        const { data: existing, error: fetchError } = await supabase
            .from('scores')
            .select('score')
            .eq('name', name)
            .gte('score', score)
            .limit(1);

        if (!fetchError && existing && existing.length > 0) {
            console.log("Existing score is higher or equal, skipping save.");
            return true;
        }

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
        // Fetch more scores to handle duplicates
        const { data, error } = await supabase
            .from('scores')
            .select('name, score')
            .order('score', { ascending: false })
            .limit(limit * 5); // Fetch 5x limit to filter

        if (error) {
            console.error('Error fetching scores:', error);
            return [];
        }

        // Deduplicate in JS (Keep highest score per name)
        const uniqueScores = [];
        const seenNames = new Set();

        for (const entry of data) {
            // Normalize: trim and uppercase to match game input
            const normalizedName = entry.name ? entry.name.trim().toUpperCase() : '';

            if (normalizedName && !seenNames.has(normalizedName)) {
                uniqueScores.push(entry);
                seenNames.add(normalizedName);
                if (uniqueScores.length >= limit) break;
            }
        }

        return uniqueScores;
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
