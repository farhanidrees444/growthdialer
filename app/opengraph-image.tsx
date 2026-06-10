import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'GrowthDialer';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  const wordmarkBuffer = await readFile(join(process.cwd(), 'public/brand/wordmark.png'));
  const wordmarkSrc = `data:image/png;base64,${wordmarkBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}
      >
        {/* Background gradient elements */}
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'radial-gradient(circle at 30% 60%, rgba(22, 163, 74, 0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'radial-gradient(circle at 70% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <img
            src={wordmarkSrc}
            alt="GrowthDialer"
            width={360}
            height={90}
            style={{ objectFit: 'contain', marginBottom: 24 }}
          />

          {/* Tagline */}
          <p
            style={{
              fontSize: '32px',
              color: '#d1d5db',
              textAlign: 'center',
              marginBottom: '48px',
              margin: '0 0 48px 0',
              fontWeight: '500',
            }}
          >
            The Sales Platform That Never Stops Closing
          </p>

          {/* Stats — honest capability facts */}
          <div
            style={{
              display: 'flex',
              gap: '48px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#A78BFA', marginBottom: '8px' }}>
                AI Dialer
              </div>
              <div style={{ fontSize: '16px', color: '#9ca3af' }}>Record · Transcribe · Analyze</div>
            </div>
            <div style={{ width: '2px', height: '60px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#A78BFA', marginBottom: '8px' }}>
                Start Free
              </div>
              <div style={{ fontSize: '16px', color: '#9ca3af' }}>No credit card required</div>
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '2px',
            background: 'linear-gradient(to right, transparent, #8B5CF6, transparent)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}