import { createController, TRANSITION_ALARM } from "./controller.js";

const controller = createController(chrome);
let queue = Promise.resolve();

function enqueue(operation) {
  const result = queue.then(operation);
  queue = result.catch((error) => {
    console.error("Stay Focus:", error);
  });
  return result;
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  void enqueue(() => controller.dispatch(request))
    .then((state) => sendResponse({ ok: true, state }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});

chrome.runtime.onInstalled.addListener(() => {
  void enqueue(() => controller.reconcile());
});

chrome.runtime.onStartup.addListener(() => {
  void enqueue(() => controller.reconcile());
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === TRANSITION_ALARM) void enqueue(() => controller.reconcile());
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void enqueue(async () => {
    const tab = await chrome.tabs.get(tabId);
    await controller.enforceTab(tabId, tab.url);
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) void enqueue(() => controller.enforceTab(tabId, changeInfo.url));
});

void enqueue(() => controller.reconcile());
