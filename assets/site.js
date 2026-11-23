/* Small helpers shared by the plain pages (resume, projects, about). */

/** Make an element: attrs ("text" sets the text), then children (nulls are skipped). */
function el(tag, attrs, children) {
  var n = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) {
    if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]);
  });
  (children || []).forEach(function (c) { if (c) n.appendChild(c); });
  return n;
}

/** Fetch a JSON data file, or the fallback if it's missing or broken. */
function loadJSON(url, fallback) {
  return fetch(url).then(function (r) { return r.ok ? r.json() : fallback; }).catch(function () { return fallback; });
}

/** Only http(s) links and site paths go into an href. */
function safeUrl(u) {
  if (!u) return "";
  u = String(u).trim();
  return /^(https?:\/\/|\/|\.\/|[\w-]+\/)/i.test(u) && !/^javascript:/i.test(u) ? u : "";
}

/** A project's screenshots (paths), skipping blanks. */
function screenshotsOf(p) {
  return (p.screenshots || []).filter(Boolean);
}

function tagList(tags) {
  return tags && tags.length ? el("ul", { "class": "tags" }, tags.map(function (t) { return el("li", { text: t }); })) : null;
}

/** Put the name from the profile in the nav and the tab title. */
function fillName(p) {
  if (!p || !p.name) return;
  document.querySelectorAll("[data-name]").forEach(function (n) { n.textContent = p.name; });
  document.title = document.title.indexOf(p.name) === 0 ? document.title : p.name + " – " + document.title;
}
