import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'GrowthDialer';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: 'white',
              }}
            >
              ⚡
            </div>
            <h1
              style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: 'white',
                margin: 0,
              }}
            >
              Growth<span style={{ color: '#16a34a' }}>Dialer</span>
            </h1>
          </div>

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

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '60px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '40px',
                  fontWeight: 'bold',
                  color: '#16a34a',
                  marginBottom: '8px',
                }}
              >
                2,400+
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#9ca3af',
                }}
              >
                Sales Teams
              </div>
            </div>

            <div
              style={{
                width: '2px',
                height: '80px',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '40px',
                  fontWeight: 'bold',
                  color: '#16a34a',
                  marginBottom: '8px',
                }}
              >
                4.9/5
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#9ca3af',
                }}
              >
                Customer Rating
              </div>
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
            background: 'linear-gradient(to right, transparent, #16a34a, transparent)',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}