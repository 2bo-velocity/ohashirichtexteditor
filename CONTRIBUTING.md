# Contributing

**This project does not accept code contributions.** Pull requests are closed,
not merged. Bug reports and feature requests, however, are genuinely welcome —
please open an [issue](../../issues).

## Why pull requests are not accepted

OhashiRichTextEditor is **dual-licensed**: AGPL-3.0-or-later, or a commercial
license for organisations that cannot take on the AGPL's source-disclosure
obligation (contact support@2bo-velocity.com for one). That arrangement only
works while one person holds the copyright to all of it.

If someone else's code enters the project — even a few lines — the copyright to
those lines belongs to its author, and selling a commercial license covering
them would need that author's permission. Keeping the codebase 100% first-party
avoids the problem entirely. It is not a judgement about the quality of anyone's
patch.

## What is welcome

**Security vulnerabilities are the exception: do not open a public issue.**
Report them privately as described in [SECURITY.md](SECURITY.md).

**Bug reports.** A report is easiest to act on when it includes:

- the package version (`OhashiEditor\Version::VERSION`), your PHP version,
  your framework (Laravel version, or plain PHP), and the browser;
- your stack (plain Blade, Livewire, Inertia + Vue / React) and any other
  JavaScript on the page (jQuery, Bootstrap, …);
- for input problems, the IME and OS you were typing with;
- the HTML you started with and the HTML you got back.

**Feature requests.** Describe the problem you are trying to solve rather than
the implementation you have in mind.

Fixes are written by the author from the report, not copied from submitted code.
