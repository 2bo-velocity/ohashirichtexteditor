// Under a strict CSP the editor must still be styled, with no violations.
window.violations = [];
window.addEventListener('securitypolicyviolation', (e) => window.violations.push(e.violatedDirective));
customElements.whenDefined('ohashi-rich-text-editor').then(() =>
  setTimeout(() => {
    const el = document.querySelector('ohashi-rich-text-editor');
    const cs = getComputedStyle(el.shadowRoot.querySelector('.orte-container'));
    const failures = [];
    if (cs.borderTopStyle !== 'solid') failures.push(`editor unstyled (border: ${cs.borderTopStyle})`);
    if (window.violations.length) failures.push(`CSP violations: ${window.violations.join(', ')}`);
    document.title = failures.length ? `FAIL ${failures.join('; ')}` : 'PASS';
  }, 300),
);
