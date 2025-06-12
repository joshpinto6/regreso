browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  request;
  if (request.purpose === "get-session") {
    sendResponse(
      new Promise((resolve) => {
        const storageResult = browser.storage.local.get("session");
        if (!storageResult || !storageResult.session) {
          browser.cookies.get(
            { url: "https://regreso.netlify.app", name: "session" },
            function (cookie) {
              if (cookie) {
                const sessionCookie = cookie.value;
                if (!sessionCookie || sessionCookie === "") {
                  resolve({
                    error: "Unauthenticated",
                    data: null,
                  });
                } else {

                  fetch("https://regreso.netlify.app/api/v1/session", {
                    method: "GET",
                    headers: { Authorization: `${sessionCookie}` },
                  })
                    .then((response) => response.json())
                    .then(async (data) => {
                      const result = await browser.storage.local.set({
                        session: cookie.value,
                      });


                      const result1 =
                        await browser.storage.local.get("session");

                      resolve({ error: null, data });
                    })
                    .catch((err) => {
                      err + "while authenticating";
                      resolve({ error: "Unauthenticated", data: null });
                    });
                }
              } else {

                resolve({
                  error: "Unauthenticated",
                  data: null,
                });
              }
            },
          );
        } else {
          const session = storageResult.session;
          fetch("https://regreso.netlify.app/api/v1/session", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${session}`,
            },
          })
            .then((response) => response.json())
            .then((data) => {

              resolve({ error: null, data });
            })
            .catch((error) => resolve({ error: error.message }));
        }
      }),
    );
  } else if (request.purpose == "log-in") {
    const { email, password } = request.data;
    JSON.stringify({ email, password });
    sendResponse(
      new Promise((resolve) => {
        fetch("https://regreso.netlify.app/api/v1/session", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        })
          .then((response) => response.json())
          .then((data) => {
            browser.storage.local.set({ session: data.sessionToken });

            resolve({ error: null, data });
          })
          .catch((error) => {
            resolve({ error: error.message });
          });
      }),
    );
  } else if (request.purpose == "log-out") {
    sendResponse(
      new Promise((resolve) => {
        const storageResult = browser.storage.local.get("session");
        if (!storageResult || !storageResult.session) {
          browser.storage.local.remove("session");
          resolve({ success: false });
          return;
        }
        const session = storageResult.session;
        if (!session) {
          browser.storage.local.remove("session");

          resolve({ success: false });
          return;
        }
        result.session;
        fetch("https://regreso.netlify.app/api/v1/session", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${session}`,
          },
        })
          .then((response) => response.json())
          .then((data) => {
            data;
            browser.storage.local.remove("session");
            resolve({ success: data.success });
          })
          .catch((error) => {
            resolve({ success: false });
          });
      }),
    );
  } else if (request.purpose == "get-destinations") {
    sendResponse(
      new Promise(async (resolve) => {

        const storageResult = await browser.storage.local.get("session");
        storageResult;
        if (
          !storageResult ||
          !storageResult.session ||
          storageResult == undefined
        ) {
          await browser.storage.local.remove("session");
          resolve({ data: null, error: "Unauthenticated" });
          return;
        }
        const session = storageResult.session;

        fetch("https://regreso.netlify.app/api/v1/destinations", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${session}`,
          },
        })
          .then((response) => response.json())
          .then((data) => resolve({ data, error: null }))
          .catch((error) => resolve({ data: null, error: error.message }));
      }),
    );
  }
});
