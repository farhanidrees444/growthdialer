import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhone } from '@/lib/phone';
import { type CountryCode } from 'libphonenumber-js';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    const userId = authUser?.id;

    if (authError || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const access = await requireWorkspaceFromRequest(request, supabase, userId, {
      permission: 'CREATE_LEADS',
      body,
    });
    if (isWorkspaceError(access)) return access;

    const csv = typeof body.csv === 'string' ? body.csv.trim() : '';
    const defaultCountry = (body.defaultCountry as CountryCode | undefined) ?? 'US';

    if (!csv) {
      return NextResponse.json({ error: 'Missing CSV body' }, { status: 400 });
    }

    const lines = csv.split(/\r?\n/).filter((line: string) => line.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must contain a header row and at least one lead row' }, { status: 400 });
    }

    const header = parseCsvLine(lines[0]).map((column) => column.toLowerCase());
    const rows = lines.slice(1).map((line: string) => {
      const values = parseCsvLine(line);
      const record: Record<string, string> = {};
      header.forEach((key, index) => {
        record[key] = values[index] ?? '';
      });
      return record;
    });

    const existingPhones = new Set<string>();
    const { data: existing } = await supabase
      .from('leads')
      .select('phone')
      .eq('user_id', userId)
      .is('deleted_at', null);

    (existing ?? []).forEach((lead) => {
      if (lead.phone) existingPhones.add(lead.phone.trim());
    });

    let invalidPhones = 0;
    const prepared = rows.reduce((acc: Array<Record<string, unknown>>, row: Record<string, string>) => {
      const rawPhone = row.phone || row.mobile || row['phone number'] || '';
      const rowCountryRaw = (row.country || row['country code'] || row.country_code || '').trim();
      const rowCountry = /^[A-Za-z]{2}$/.test(rowCountryRaw)
        ? (rowCountryRaw.toUpperCase() as CountryCode)
        : defaultCountry;
      const phone = normalizePhone(rawPhone, rowCountry);

      const firstName = row.first_name || row.firstname || row.name?.split(' ').slice(0, 1).join('') || '';
      const lastName = row.last_name || row.lastname || row.name?.split(' ').slice(1).join('') || '';
      const fullName = row.name || `${firstName} ${lastName}`.trim() || row.company || 'Unknown Lead';

      if (!phone) {
        // Save with original raw phone so the row isn't silently dropped
        if (rawPhone && !existingPhones.has(rawPhone)) {
          invalidPhones += 1;
          acc.push({
            user_id: userId,
            name: fullName,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            email: row.email || undefined,
            phone: rawPhone, // keep raw; user can fix
            company: row.company || undefined,
            title: row.title || undefined,
            source: row.source || 'import',
            notes: row.notes || undefined,
            ai_score: Number(row.ai_score) || 0,
            status: 'invalid_phone',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          existingPhones.add(rawPhone);
        }
        return acc;
      }

      if (existingPhones.has(phone)) return acc;

      acc.push({
        user_id: userId,
        name: fullName,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        email: row.email || undefined,
        phone,
        company: row.company || undefined,
        title: row.title || undefined,
        source: row.source || 'import',
        notes: row.notes || undefined,
        ai_score: Number(row.ai_score) || 0,
        status: 'queued',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      existingPhones.add(phone);
      return acc;
    }, []);

    const skipped = rows.length - prepared.length;

    if (prepared.length === 0) {
      return NextResponse.json({ success: true, inserted: 0, skipped, invalidPhones: 0, message: 'No new valid leads were found in the CSV.' });
    }

    const { error: insertError } = await supabase.from('leads').insert(prepared);
    if (insertError) {
      console.error('Lead import failed:', insertError);
      return NextResponse.json({ error: 'Failed to import leads' }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: prepared.length, skipped, invalidPhones });
  } catch (error) {
    console.error('Lead import error:', error);
    return NextResponse.json({ error: 'Unable to import leads' }, { status: 500 });
  }
}
