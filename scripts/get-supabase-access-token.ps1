# Reads Supabase CLI access token from Windows Credential Manager.
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCred {
  public enum CredType { Generic = 1 }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct Credential {
    public int Flags;
    public int Type;
    public IntPtr TargetName;
    public IntPtr Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize;
    public IntPtr CredentialBlob;
    public int Persist;
    public int AttributeCount;
    public IntPtr Attributes;
    public IntPtr TargetAlias;
    public IntPtr UserName;
  }
  [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, CredType type, int reservedFlag, out IntPtr credentialPtr);
  [DllImport("advapi32.dll", SetLastError = true)]
  public static extern bool CredFree(IntPtr cred);
}
"@

$target = "Supabase CLI:supabase"
$ptr = [IntPtr]::Zero
if (-not [WinCred]::CredRead($target, [WinCred+CredType]::Generic, 0, [ref]$ptr)) {
  Write-Error "Could not read credential: $target"
  exit 1
}
try {
  $cred = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][WinCred+Credential])
  $bytes = New-Object byte[] $cred.CredentialBlobSize
  [Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $bytes, 0, $cred.CredentialBlobSize)
  $token = [Text.Encoding]::UTF8.GetString($bytes).Trim([char]0)
  if (-not $token) { Write-Error "Empty token"; exit 1 }
  $token
}
finally {
  [WinCred]::CredFree($ptr) | Out-Null
}
