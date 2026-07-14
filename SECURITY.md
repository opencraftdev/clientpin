# Security Policy

We take the security of ClientPin seriously. Thank you for helping keep it and
its users safe.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues,
pull requests, or Discord.**

Instead, report them privately using one of:

- GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)
  (Security tab → "Report a vulnerability"), or
- Email **opencraft.dev@gmail.com** with the subject line `SECURITY: ClientPin`.

Please include, as far as you can:

- A description of the issue and its potential impact
- Steps to reproduce, or a proof of concept
- Affected component (web app, extension, database) and version/commit
- Any suggested remediation

## What to expect

- We aim to acknowledge your report within **72 hours**.
- We will keep you informed as we investigate and work on a fix.
- We ask that you give us a reasonable window to release a fix before any public
  disclosure, and we will credit you in the advisory unless you prefer to remain
  anonymous.

## Scope

Because ClientPin handles project data, screenshots, and view passwords, we are
especially interested in reports involving:

- Authentication and authorization (owner vs. viewer access, RLS bypass)
- Access to another project's pins, screenshots, or dashboard
- Leakage of view tokens, connect codes, or Supabase credentials
- The browser extension reading or exfiltrating data beyond its stated purpose

Thank you for practicing responsible disclosure.
