import { extractKycDocumentPath, kycErrorMessage } from '../kyc-storage';

describe('extractKycDocumentPath', () => {
  it('keeps a storage object path', () => {
    expect(extractKycDocumentPath('user-1/front-1.png')).toBe('user-1/front-1.png');
  });

  it('strips a public object URL', () => {
    expect(
      extractKycDocumentPath(
        'https://example.supabase.co/storage/v1/object/public/kyc-documents/user-1/front-1.png'
      )
    ).toBe('user-1/front-1.png');
  });

  it('returns null for unrelated http URLs', () => {
    expect(extractKycDocumentPath('https://cdn.example.com/id.png')).toBeNull();
  });
});

describe('kycErrorMessage', () => {
  it('reads a PostgREST-style message object', () => {
    expect(
      kycErrorMessage(
        {
          message: "Could not find the 'full_name' column of 'kyc_submissions' in the schema cache",
        },
        'fallback'
      )
    ).toContain('full_name');
  });
});
