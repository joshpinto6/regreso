var query = { active: true, currentWindow: true };
function callback(tabs) {
  var currentTab = tabs[0]; // there will be only one in this array
  currentTab.url;
  document.getElementById("url").value = currentTab.url;
}
browser.tabs.query(query, callback);
