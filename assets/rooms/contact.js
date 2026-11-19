/* The contact form behind the carrier pigeon in the hall.
 *
 * A static site can't send email by itself, so there are two ways a message gets to you:
 *   1. If data/profile.json has contact.endpoint (a form service such as Formspree), the form posts there
 *      and the visitor never leaves the page.
 *   2. Otherwise it opens the visitor's own email app with the message filled in, addressed to
 *      contact.email, or to the "mailto:" link in profile.links.
 */
import { $, esc, profile, safeUrl, showPanel } from "./core.js";

function contactEmail() {
  const c = profile.contact || {};
  const link = (profile.links || []).find((l) => /^mailto:/i.test(l.url || ""));
  const addr = c.email ? String(c.email) : link ? link.url.replace(/^mailto:/i, "").split("?")[0] : "";
  // the sample profile's placeholder address counts as not set up
  return /^[^\s@?&<>"]+@[^\s@?&<>"]+$/.test(addr) && !/@example\.com$/i.test(addr) ? addr : "";
}

export function openContact() {
  const c = profile.contact || {};
  const endpoint = c.endpoint ? safeUrl(c.endpoint) : "";
  const email = contactEmail();
  if (!endpoint && !email) {
    showPanel({ title: "Send me a message", html: "<p>The contact form isn't set up yet.</p>" });
    return;
  }

  showPanel({
    title: "Send me a message",
    meta: profile.name ? `Goes straight to ${profile.name}` : "",
    html: `
      <form id="contactForm" class="contact" novalidate>
        <label>Your name<input name="name" type="text" autocomplete="name" maxlength="100" required></label>
        <label>Your email<input name="email" type="email" autocomplete="email" maxlength="200" required></label>
        <label>Message<textarea name="message" rows="6" maxlength="5000" required></textarea></label>
        <input class="contact__trap" name="_gotcha" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
        <p class="contact__status" id="contactStatus" role="status" aria-live="polite"></p>
        <button class="btn" type="submit">${endpoint ? "Send message" : "Open in my email app"}</button>
      </form>`,
  });

  const form = $("contactForm");
  const status = $("contactStatus");
  form.querySelector("input[name=name]").focus();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const from = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || !message || !form.querySelector("input[name=email]").checkValidity() || !from) {
      status.textContent = "Please fill in your name, a valid email and a message.";
      return;
    }
    if (data.get("_gotcha")) return;   // a bot filled the hidden field

    if (!endpoint) {
      const subject = `Message from ${name} via your site`;
      const body = `${message}\n\n${name}\n${from}`;
      location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status.textContent = "Your email app should open with the message ready to send.";
      return;
    }

    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    status.textContent = "Sending…";
    try {
      const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      form.innerHTML = `<p>Thanks, ${esc(name)}. Your message is on its way.</p>`;
    } catch (err) {
      button.disabled = false;
      status.innerHTML = email
        ? `That didn't send. Please try again, or <a href="mailto:${esc(email)}">email me directly</a>.`
        : "That didn't send. Please try again in a moment.";
    }
  });
}
