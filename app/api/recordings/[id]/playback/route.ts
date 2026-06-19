import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { isWorkspaceError, requireWorkspaceFromRequest } from '@/lib/auth/workspace-access';
import { isCallAccessError, requireCallAccess } from '@/lib/auth/call-access';
import { hasPermission } from '@/lib/auth/permissions';
import {
  createCallRecordingSignedUrl,
  mirrorCallRecordingToStorage,
} from '@/lib/recordings/storage';
import { isPlayableRecordingDuration } from '@/lib/recordings/eligibility';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await requireWorkspaceFromRequest(request, supabase, user.id);
    if (isWorkspaceError(access)) return access;

    if (
      !hasPermission(access.role, 'VIEW_ALL_RECORDINGS')
      && !hasPermission(access.role, 'VIEW_OWN_RECORDINGS')
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const call = await requireCallAccess(
      supabase,
      { id },
      access,
      user.id,
      hasPermission(access.role, 'VIEW_ALL_RECORDINGS') ? 'read' : 'control',
    );
    if (isCallAccessError(call)) return call;

    const { data: row } = await supabase
      .from('calls')
      .select('recording_url, recording_supabase_path, recording_duration_seconds, duration_seconds')
      .eq('id', id)
      .maybeSingle();

    if (!row?.recording_url && !row?.recording_supabase_path) {
      return NextResponse.json({ error: 'No recording' }, { status: 404 });
    }

    const duration = row.recording_duration_seconds ?? row.duration_seconds;
    if (!isPlayableRecordingDuration(duration)) {
      return NextResponse.json({ error: 'Recording unavailable' }, { status: 404 });
    }

    let playback_url: string | null = null;
    let source: 'storage' | 'voice_service' = 'voice_service';
    const service = createServiceClient();

    if (row.recording_supabase_path) {
      if (service) {
        const signed = await createCallRecordingSignedUrl(
          service,
          row.recording_supabase_path as string,
        );
        if (signed) {
          playback_url = signed;
          source = 'storage';
        }
      }
    }

    if (!playback_url && row.recording_url && service) {
      const mirrored = await mirrorCallRecordingToStorage(service, {
        callId: id,
        userId: user.id,
        recordingUrl: row.recording_url as string,
      });
      if (mirrored.ok) {
        const signed = await createCallRecordingSignedUrl(service, mirrored.path);
        if (signed) {
          playback_url = signed;
          source = 'storage';
        }
      }
    }

    if (!playback_url) {
      playback_url = row.recording_url as string | null;
    }

    if (!playback_url) {
      return NextResponse.json({ error: 'Playback URL unavailable' }, { status: 404 });
    }

    return NextResponse.json({
      playback_url,
      source,
      expires_in: source === 'storage' ? 3600 : null,
    });
  } catch (err) {
    console.error('[RECORDINGS-PLAYBACK]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
