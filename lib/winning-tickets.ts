import { createAdminClient } from '@/utils/supabase/admin';
import { WinningTicket } from '@/lib/types';

const BUCKET = 'winning-tickets';
const SIGNED_URL_TTL_SECONDS = 60 * 10;

type TicketRow = Omit<WinningTicket, 'image_url' | 'user_email' | 'user_name'> & {
  user_id: string;
  image_path: string;
  moderated_by?: string | null;
  profiles?: { email?: string | null; full_name?: string | null } | null;
};

async function withSignedUrls(rows: TicketRow[], includeUser = false): Promise<WinningTicket[]> {
  const supabase = createAdminClient();
  const tickets = await Promise.all(rows.map(async (row) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(row.image_path, SIGNED_URL_TTL_SECONDS);

    return {
      id: row.id,
      win_date: row.win_date,
      bet_date: row.bet_date,
      caption: row.caption,
      status: row.status,
      moderation_note: row.moderation_note,
      moderated_at: row.moderated_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      image_url: error ? '' : data.signedUrl,
      ...(includeUser ? {
        user_email: row.profiles?.email ?? null,
        user_name: row.profiles?.full_name ?? null,
      } : {}),
    };
  }));

  return tickets.filter((ticket) => ticket.image_url);
}

export async function getApprovedWinningTickets(winDate: string): Promise<WinningTicket[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('winning_tickets')
    .select('id, user_id, image_path, win_date, bet_date, caption, status, moderation_note, moderated_by, moderated_at, created_at, updated_at')
    .eq('win_date', winDate)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return withSignedUrls(data as TicketRow[]);
}

export async function getUserWinningTickets(userId: string): Promise<WinningTicket[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('winning_tickets')
    .select('id, user_id, image_path, win_date, bet_date, caption, status, moderation_note, moderated_by, moderated_at, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return withSignedUrls(data as TicketRow[]);
}

export async function getAdminWinningTickets(): Promise<WinningTicket[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('winning_tickets')
    .select('id, user_id, image_path, win_date, bet_date, caption, status, moderation_note, moderated_by, moderated_at, created_at, updated_at, profiles:profiles!winning_tickets_user_id_fkey(email, full_name)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return withSignedUrls(data as TicketRow[], true);
}