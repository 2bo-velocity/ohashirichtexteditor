# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public issues.**

Report them privately, by either:

- GitHub's private vulnerability reporting: the **Security** tab of this
  repository → **Report a vulnerability**; or
- email to **support@2bo-velocity.com** with "Security" in the subject.

Please include the package version (`OhashiEditor\Version::VERSION`), the
browser, and a minimal reproduction — for an XSS issue, the HTML payload and
where it was entered (pasted, typed in source mode, stored in the database,
uploaded).

You will receive an acknowledgement within a few business days. Fixes are
released as a new patch version, and the report is credited in the release
notes unless you prefer otherwise.

## Supported versions

Security fixes are made for the latest minor release only.

## Scope

In scope: the editor (the `<ohashi-rich-text-editor>` element and its
adapters), the server-side HTML sanitiser, the image upload handling and the
Laravel integration shipped in this package.

Out of scope: vulnerabilities in your application's own handling of the saved
HTML — for example, outputting it without passing it through the package's
sanitiser.
