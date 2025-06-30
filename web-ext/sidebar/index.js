// event listeners for the sidebar
document.getElementById("login-btn").addEventListener("click", function () {
  const email = prompt(
    "Please enter the email associated with your Regreso account",
  );
  if (!email) return;
  const pw = prompt("Please enter your Regreso password");
  browser.runtime.sendMessage(
    { purpose: "log-in", data: { email, pw } },
    function (res) {
      const { error } = res;
      if (error) {
        alert("An unknown error occurred while authenticating.");
      }
      refresh();
    },
  );
});
document
  .getElementById("refresh-destinations")
  .addEventListener("click", function () {
    refresh();
  });
document.getElementById("logout-btn").addEventListener("click", function () {
  browser.runtime.sendMessage({ purpose: "log-out" }, function (res) {
    if (!res.success) {
      document.getElementById("login-btn").click();
    }
  });
});
document.getElementById("refresh-auth").addEventListener("click", function () {
  refresh();
});

// for when the sidebar needs to be refreshed
function refresh() {
  browser.runtime.sendMessage({ purpose: "get-session" }, function (res) {
    const { error, data } = res;
    document.getElementById("login-status").style.display = "none";

    if (error == "Unauthenticated") {
      document.getElementById("login").style.display = "block";
      document.getElementById("destinations").style.display = "none";
    } else if (error) {
      document.getElementById("login").style.display = "block";
      document.getElementById("destinations").style.display = "none";

      alert("An unknown error occurred while fetching destinations.");
    } else {
      document.getElementById("login").style.display = "none";
      document.getElementById("destinations").style.display = "block";
      document.getElementById("login-status").style.display = "block";

      document.getElementById("user-name").innerText =
      document.getElementById("user-displayName").innerText =
        data.user.displayName;

      browser.runtime.sendMessage(
        { purpose: "get-destinations" },
        function (res1) {
          const { data, error } = res1;
          if (error) {
            return;
          }
          for (let i = 0; i < data.items.length; i++) {
            const destination = data.items[i];
            const destinationElementTemplate = document.getElementById(
              "destination-template",
            );
            let destinationElement =
              destinationElementTemplate.content.cloneNode(true);

            destinationElement.querySelectorAll("p.name")[0].textContent =
              destination.name;
            destinationElement.querySelectorAll("a.location")[0].textContent =
              destination.location;
            destinationElement.querySelectorAll("a.location")[0].href =
              destination.location;

            document
              .getElementById("destinations")
              .appendChild(destinationElement);
          }
        },
      );
    }
  });
}

refresh();
