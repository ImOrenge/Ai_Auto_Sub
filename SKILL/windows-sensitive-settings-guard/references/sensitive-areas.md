# Sensitive Areas

Use this reference when deciding whether a Windows task is safe to execute.

## Read-Only Is Usually Safe

- `reg query`, `Get-ItemProperty`, `Get-ComputerInfo`, `systeminfo`
- `Get-Service`, `Get-ScheduledTask`, `gpresult`, `whoami`
- `Get-NetFirewallProfile`, `Get-MpComputerStatus`, `manage-bde -status`
- Listing files, logs, event viewer entries, or existing config values without changing them

## Treat As Sensitive And Do Not Execute

### Registry And Policy

- `reg add`, `reg delete`, `Set-ItemProperty`, `New-ItemProperty`, `Remove-ItemProperty`
- `secedit`, `LGPO`, direct edits under `HKLM`, `HKU`, or policy hives

### Security Controls

- `Set-MpPreference`, `Add-MpPreference`, `Remove-MpPreference`
- `netsh advfirewall`, `Set-NetFirewallProfile`
- Changes to UAC, SmartScreen, Credential Guard, Secure Boot, WDAC, AppLocker, BitLocker

### Identity, Privilege, And Secrets

- `net user`, `net localgroup`, `New-LocalUser`, `Add-LocalGroupMember`
- `cmdkey`, credential exports, private key export, permission escalation, `runas /savecred`

### Persistence And Startup

- `schtasks /create`, service creation or startup-type changes, Run/RunOnce edits
- Startup folder injection, shell replacement, remote management enablement

### Boot, Recovery, Update, And Drivers

- `bcdedit`, `reagentc`, `diskpart` on system disks
- `sc config`, `Set-Service` for core OS or security services
- `pnputil`, `DISM`, Windows feature enable/disable, Windows Update policy changes

### Network Trust Boundary Changes

- Static IP, route, DNS, proxy, WinRM, RDP, SMB, firewall rule, or port exposure changes
- Any action that broadens inbound access or remote control

## Safe Fallbacks

- Inspect first and summarize findings.
- Produce a non-executed command draft with a warning label.
- Explain the manual path at a high level when the user needs context.
- Recommend restore point creation and rollback planning before any human-performed change.

## Escalation Rule

If a command requires elevation and changes machine-wide behavior, treat it as blocked unless the task is purely diagnostic.
