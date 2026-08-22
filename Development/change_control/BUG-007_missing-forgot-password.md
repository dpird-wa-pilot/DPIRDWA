# BUG-007: "Forgot Password" Link Not Implemented on Login Page

**Severity:** 🟢 **LOW**  
**Status:** 🔴 **OPEN**  
**Component:** CC-005 — ConsultantLogin.jsx  
**Assigned to:** Antigravity Development Lead  
**Created:** August 21, 2026  
**Reported by:** Eleven June Consulting QA  
**Related CC:** CC-005

---

## Summary

The consultant login page (`/login`) does not include a "Forgot password?" recovery link. If a consultant loses access to their credentials, there is no self-service recovery path — they must contact an admin. Supabase Auth provides built-in password reset via email, making this straightforward to implement.

---

## Reproduction Steps

1. Navigate to `http://localhost:5173/login`
2. Inspect the login form for a password recovery option
3. **No "Forgot password?" link exists**

---

## Expected vs Actual

| State | Expected | Actual |
|-------|----------|--------|
| Login form | "Forgot password?" link below password field | No recovery link present |
| Forgot password flow | Email sent with reset link via Supabase Auth | Not implemented |

---

## Fix

**Step 1 — Add a link below the password input:**
```jsx
<div className="forgot-password">
  <button
    type="button"
    className="link-button"
    onClick={() => setShowForgotPassword(true)}
  >
    ¿Olvidaste tu contraseña?
  </button>
</div>
```

**Step 2 — Implement the reset email via Supabase Auth:**
```javascript
const handleForgotPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/consultant/reset-password`,
  });

  if (error) {
    setError('No se pudo enviar el correo de recuperación.');
  } else {
    setMessage('Revisa tu correo para el enlace de recuperación.');
  }
};
```

**Step 3 — Create a `/consultant/reset-password` route** to handle the password update after the user clicks the email link (Supabase handles the token).

---

## Scope Note

This is a **low priority** quality-of-life improvement. The platform is consultant-facing (internal users) and admins can manually reset passwords through Supabase dashboard if needed. However, implementing this is low-effort given Supabase's built-in support.

---

## Acceptance Criteria

- [ ] "¿Olvidaste tu contraseña?" link visible below password field
- [ ] Clicking the link prompts for email address
- [ ] Supabase sends password reset email to the entered address
- [ ] User lands on a reset-password page after clicking the email link
- [ ] Success/error states shown clearly
