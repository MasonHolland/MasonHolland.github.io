/*
 * The contact form, shared by the carrier pigeon in the room (assets/rooms/contact.js) and the
 * Contact page (contact.html).
 *
 * A static site can't send email by itself, so there are two ways a message gets to you:
 *   1. If data/profile.json has contact.endpoint (a form service such as Formspree), the form posts
 *      there and the visitor never leaves the page.
 *   2. Otherwise it opens the visitor's own email app with the message filled in, addressed to
 *      contact.email, or to the "mailto:" link in profile.links.
 */

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const httpsOnly = (u) => (/^https:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "");

/** Where messages go: { endpoint, email }. Both empty means the form isn't set up. */
export function contactSetup(profile) {
  const c = (profile && profile.contact) || {};
  const link = ((profile && profile.links) || []).find((l) => /^mailto:/i.test(l.url || ""));
  const addr = c.email ? String(c.email) : link ? link.url.replace(/^mailto:/i, "").split("?")[0] : "";
  // the sample profile's placeholder address counts as not set up
  const email = /^[^\s@?&<>"]+@[^\s@?&<>"]+$/.test(addr) && !/@example\.com$/i.test(addr) ? addr : "";
  return { endpoint: httpsOnly(c.endpoint), email };
}

/** The form's HTML (fields, a hidden trap field for bots, a status line and the button). */
export function contactFormHtml({ endpoint }) {
  return `
    <form class="contact" novalidate>
      <label>Your name<input name="name" type="text" autocomplete="name" maxlength="100" required></label>
      <label>Your email<input name="email" type="email" autocomplete="email" maxlength="200" required></label>
      <label>Message<textarea name="message" rows="6" maxlength="5000" required></textarea></label>
      <input class="contact__trap" name="_gotcha" type="text" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="contact__status" role="status" aria-live="polite"></p>
      <button class="btn" type="submit">${endpoint ? "Send message" : "Open in my email app"}</button>
    </form>`;
}

/** Make a form from contactFormHtml send: post to the endpoint, or open an email app. */
export function wireContactForm(form, { endpoint, email }) {
  const status = form.querySelector(".contact__status");
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
      form.innerHTML = `<p class="contact__done">Thanks, ${esc(name)}. Your message is on its way.</p>`;
    } catch (err) {
      button.disabled = false;
      status.innerHTML = email
        ? `That didn't send. Please try again, or <a href="mailto:${esc(email)}">email me directly</a>.`
        : "That didn't send. Please try again in a moment.";
    }
  });
}
