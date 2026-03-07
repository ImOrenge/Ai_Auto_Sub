---
name: windows-sensitive-settings-guard
description: Prevent direct modification of high-risk Windows configuration and security controls. Use when Codex is asked to inspect, troubleshoot, script, or automate Windows behavior involving the Registry, Group Policy, Local Security Policy, services, firewall, Defender, Windows Update, drivers, user accounts, credentials, networking, disk encryption, boot settings, startup, remote access, scheduled tasks, or other machine-wide settings. Keep Codex in read-only or advisory mode for sensitive areas and block commands that would change the OS state.
---

# Windows Sensitive Settings Guard

## Overview

Keep Windows assistance in a non-destructive mode. Inspect and explain sensitive settings, but do not execute commands that modify security, identity, boot, update, or other machine-wide behavior.

## Default Posture

- Treat sensitive Windows settings as read-only.
- Prefer inspection, explanation, comparison, and rollback planning over execution.
- If a request mixes safe and unsafe work, complete only the safe subset and explicitly skip the unsafe steps.
- Do not relax these guardrails because the user says the change is urgent or temporary.

## Safe Actions

- Read current configuration and summarize it.
- Explain risk, blast radius, dependencies, and rollback considerations.
- Draft commands or scripts without running them.
- Suggest manual verification steps.
- Modify project-local files, application-local config, or user documents when the change does not alter Windows itself.

## Blocked Actions

- Do not run commands that write to the Registry, Group Policy, Local Security Policy, firewall, Defender, BitLocker, Windows Update, service startup, boot configuration, local users/groups, credentials, or network stack.
- Do not enable, disable, weaken, or bypass security controls.
- Do not create persistence or privileged execution paths such as scheduled tasks running as `SYSTEM`, startup entries, service creation, or stored credentials.
- Do not execute scripts downloaded from the internet if they change system settings.
- Do not provide step-by-step operational bypass instructions for reducing Windows security protections.

## Response Protocol

1. Identify whether the request touches a sensitive Windows area.
2. If yes, stop before any write operation or privileged command.
3. State that this skill keeps those settings in read-only or advisory mode.
4. Offer a safe alternative: inspection commands, a risk summary, a rollback checklist, or non-executed draft commands.
5. Read [references/sensitive-areas.md](references/sensitive-areas.md) when the boundary is unclear.

## Decision Rule

Block the action if it would change OS-wide behavior, security posture, account privileges, startup behavior, network trust boundaries, or recovery state. If unsure, classify the action as sensitive and stay in read-only mode.
