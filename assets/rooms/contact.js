/* The contact form behind the carrier pigeon in the hall. The form itself, and how messages are
 * sent, live in assets/contact-form.js, shared with the Contact page. */
import { profile, showPanel } from "./core.js";
import { contactFormHtml, contactSetup, wireContactForm } from "../contact-form.js";

export function openContact() {
  const setup = contactSetup(profile);
  if (!setup.endpoint && !setup.email) {
    showPanel({ title: "Send me a message", html: "<p>The contact form isn't set up yet.</p>" });
    return;
  }
  showPanel({
    title: "Send me a message",
    meta: profile.name ? `Goes straight to ${profile.name}` : "",
    html: contactFormHtml(setup),
  });
  const form = document.querySelector("#panel form.contact");
  form.querySelector("input[name=name]").focus();
  wireContactForm(form, setup);
}
