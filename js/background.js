chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.windows.create({
      url: "html/report_snr.html",
      type: "normal"
    });
  });
