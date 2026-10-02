import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getAdminWinningTickets, getApprovedWinningTickets, getRecentApprovedWinningTickets, getUserWinningTickets } from '@/lib/winning-tickets';

const BUCKET = 'winning-tickets';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function isValidDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function isAdmin(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).single();
  return data?.role === 'admin';
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const user = await getAuthenticatedUser();

  if (params.get('mine') === 'true') {
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    return NextResponse.json({ data: await getUserWinningTickets(user.id) }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (params.get('admin') === 'true') {
    if (!user || !(await isAdmin(user.id))) {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }
    return NextResponse.json({ data: await getAdminWinningTickets() }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (params.get('recent') === 'true') {
    return NextResponse.json(
      { data: await getRecentApprovedWinningTickets() },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const winDate = params.get('date');
  if (!isValidDate(winDate)) {
    return NextResponse.json({ error: 'A valid date is required.' }, { status: 400 });
  }

  return NextResponse.json(
    { data: await getApprovedWinningTickets(winDate) },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Sign in to upload a ticket.' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload request.' }, { status: 400 });
  }

  const file = formData.get('file');
  const winDate = formData.get('win_date');
  const betDate = formData.get('bet_date');
  const captionValue = formData.get('caption');
  const consent = formData.get('public_consent') === 'true';

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Choose a ticket image to upload.' }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Images must be 5 MB or smaller.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ error: 'Use a PNG, JPG, or WebP image.' }, { status: 400 });
  }
  if (typeof winDate !== 'string' || !isValidDate(winDate) || winDate > new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: 'Enter a valid date the bet was won.' }, { status: 400 });
  }
  if (betDate && (typeof betDate !== 'string' || !isValidDate(betDate) || betDate > winDate)) {
    return NextResponse.json({ error: 'Bet date must be valid and no later than the win date.' }, { status: 400 });
  }
  if (typeof captionValue === 'string' && captionValue.length > 240) {
    return NextResponse.json({ error: 'Caption must be 240 characters or fewer.' }, { status: 400 });
  }
  if (!consent) {
    return NextResponse.json({ error: 'Confirm that approved images may be shown publicly.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ticketId = crypto.randomUUID();
  const imagePath = `${user.id}/${ticketId}.${ALLOWED_TYPES[file.type]}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(imagePath, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Winning ticket image upload failed:', uploadError.message);
    return NextResponse.json({ error: 'Ticket image could not be uploaded.' }, { status: 500 });
  }

  const { data, error: insertError } = await supabase
    .from('winning_tickets')
    .insert({
      id: ticketId,
      user_id: user.id,
      image_path: imagePath,
      win_date: winDate,
      bet_date: betDate || null,
      caption: typeof captionValue === 'string' ? captionValue.trim() : '',
      status: 'pending',
    })
    .select('id, win_date, bet_date, caption, status')
    .single();

  if (insertError || !data) {
    await supabase.storage.from(BUCKET).remove([imagePath]);
    console.error('Winning ticket record creation failed:', insertError?.message);
    return NextResponse.json({ error: 'Ticket submission could not be saved.' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  let body: { id?: unknown; status?: unknown; moderation_note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: 'A valid ticket ID is required.' }, { status: 400 });
  }
  if (body.status !== 'approved' && body.status !== 'rejected') {
    return NextResponse.json({ error: 'Choose approved or rejected.' }, { status: 400 });
  }
  if (body.moderation_note !== undefined && (typeof body.moderation_note !== 'string' || body.moderation_note.length > 500)) {
    return NextResponse.json({ error: 'Moderation note must be 500 characters or fewer.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('winning_tickets')
    .update({
      status: body.status,
      moderation_note: typeof body.moderation_note === 'string' ? body.moderation_note.trim() : null,
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select('id, status, moderation_note, moderated_at')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Ticket was not found or could not be updated.' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get('id');
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'A valid ticket ID is required.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: ticket } = await supabase.from('winning_tickets').select('image_path').eq('id', id).single();
  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

  const { error } = await supabase.from('winning_tickets').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Ticket could not be removed.' }, { status: 500 });

  await supabase.storage.from(BUCKET).remove([ticket.image_path]);
  return NextResponse.json({ success: true });
}