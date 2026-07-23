const SHARED_PUML_CACHE = "shared-puml-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "GET_SHARED_PUML") {
    return;
  }

  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHARED_PUML_CACHE);
      const response = await cache.match("latest.puml");
      const text = response ? await response.text() : null;
      await cache.delete("latest.puml");
      event.ports[0]?.postMessage(text);
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "POST") {
    return;
  }

  const url = new URL(request.url);
  if (!url.pathname.endsWith("/share-target")) {
    return;
  }

  event.respondWith(handleShareTarget(request));
});

async function handleShareTarget(request) {
  let sharedText = "";

  try {
    const formData = await request.formData();
    const file = formData.get("diagram");

    if (file instanceof File) {
      sharedText = await file.text();
    } else {
      const text = formData.get("text");
      if (typeof text === "string" && text.trim()) {
        sharedText = text;
      }
    }
  } catch {
    sharedText = "";
  }

  if (sharedText.trim()) {
    const cache = await caches.open(SHARED_PUML_CACHE);
    await cache.put(
      "latest.puml",
      new Response(sharedText, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }),
    );
  }

  return Response.redirect("./index.html?shared=1", 303);
}
