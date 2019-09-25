/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_URL = "https://example.com/";

const PREF_TRR_CUSTOM_URI = "network.trr.custom_uri";
const PREF_TRR_URI = "network.trr.uri";
const PREF_TRR_RESOLVERS = "network.trr.resolvers";

const DEFAULT_RESOLVER = {
  name: "Example",
  url: "https://dns.example.com/dns-query",
};

const CUSTOM_RESOLVER = {
  name: "Custom DNS",
  url: "https://custom.example.com/dns-query",
};

const gModeCounter = {
  disabled: 0,
  default: 0,
  cachedDefault: 0,
  custom: 0,
  cachedCustom: 0,
};

registerCleanupFunction(async function() {
  [PREF_TRR_CUSTOM_URI, PREF_TRR_URI, PREF_TRR_RESOLVERS].forEach(
    Services.prefs.clearUserPref
  );
});

add_task(function setup() {
  Services.prefs.setCharPref(PREF_TRR_CUSTOM_URI, CUSTOM_RESOLVER.url);
  Services.prefs.setCharPref(
    PREF_TRR_RESOLVERS,
    JSON.stringify([DEFAULT_RESOLVER])
  );
});

async function setupTRR(mode) {
  ok(gBrowser);
  ok(gIdentityHandler);

  switch (mode) {
    case "disabled":
      gBrowser.selectedBrowser._isDoH = false;
      gBrowser.selectedBrowser._isFromCache = false;
      Services.prefs.setCharPref(PREF_TRR_URI, "");
      break;
    case "default":
      gBrowser.selectedBrowser._isDoH = true;
      gBrowser.selectedBrowser._isFromCache = false;
      Services.prefs.setCharPref(PREF_TRR_URI, DEFAULT_RESOLVER.url);
      break;
    case "cachedDefault":
      gBrowser.selectedBrowser._isDoH = false;
      gBrowser.selectedBrowser._isFromCache = true;
      Services.prefs.setCharPref(PREF_TRR_URI, DEFAULT_RESOLVER.url);
      break;
    case "custom":
      gBrowser.selectedBrowser._isDoH = true;
      gBrowser.selectedBrowser._isFromCache = false;
      Services.prefs.setCharPref(PREF_TRR_URI, CUSTOM_RESOLVER.url);
      break;
    case "cachedCustom":
      gBrowser.selectedBrowser._isDoH = false;
      gBrowser.selectedBrowser._isFromCache = true;
      Services.prefs.setCharPref(PREF_TRR_URI, CUSTOM_RESOLVER.url);
      break;
    default:
      throw new Error("Unexpected mode");
  }
}

async function runTest(mode, callback) {
  let tab = await BrowserTestUtils.openNewForegroundTab(gBrowser, TEST_URL);
  await setupTRR(mode);

  let identityView = window.document.getElementById("identity-popup");
  let viewShown = BrowserTestUtils.waitForEvent(identityView, "ViewShown");
  window.document.getElementById("identity-box").click();
  await viewShown;

  let rootNode = window.document.querySelector(".identity-popup-dns-content").parentNode;
  let encryptedNode = window.document.querySelector(".identity-popup-dns-encrypted");
  let cachedNode = window.document.querySelector(".identity-popup-dns-cached");
  let serverNode = gIdentityHandler._identityPopupDnsServer;

  await callback(rootNode, encryptedNode, cachedNode, serverNode);

  BrowserTestUtils.removeTab(tab);
  gModeCounter[mode] += 1;
}

add_task(async function testDisabled() {
  await runTest("disabled", rootNode => {
    ok(BrowserTestUtils.is_hidden(rootNode), "root node is hidden");
  });
});

add_task(async function testDefault() {
  await runTest("default", (rootNode, encryptedNode, cachedNode, serverNode) => {
    ok(BrowserTestUtils.is_visible(rootNode), "root node is visible");
    ok(BrowserTestUtils.is_visible(encryptedNode), "encrypted node is visible");
    ok(BrowserTestUtils.is_hidden(cachedNode), "cached node is hidden");
    ok(BrowserTestUtils.is_visible(serverNode), "server node is visible");
    is(serverNode.textContent, DEFAULT_RESOLVER.name);
  });
});

add_task(async function testCachedDefault() {
  await runTest("cachedDefault", (rootNode, encryptedNode, cachedNode, serverNode) => {
    ok(BrowserTestUtils.is_visible(rootNode), "root node is visible");
    ok(BrowserTestUtils.is_hidden(encryptedNode), "encrypted node is hidden");
    ok(BrowserTestUtils.is_visible(cachedNode), "cached node is visible");
    ok(BrowserTestUtils.is_hidden(serverNode), "server node is hidden");
    is(serverNode.textContent, DEFAULT_RESOLVER.name);
  });
});

add_task(async function testCustom() {
  await runTest("custom", (rootNode, encryptedNode, cachedNode, serverNode) => {
    ok(BrowserTestUtils.is_visible(rootNode), "root node is visible");
    ok(BrowserTestUtils.is_visible(encryptedNode), "encrypted node is visible");
    ok(BrowserTestUtils.is_hidden(cachedNode), "cached node is hidden");
    ok(BrowserTestUtils.is_visible(serverNode), "server node is visible");
    is(serverNode.textContent, CUSTOM_RESOLVER.name);
  });
});

add_task(async function testCachedCustom() {
  await runTest("cachedCustom", (rootNode, encryptedNode, cachedNode, serverNode) => {
    ok(BrowserTestUtils.is_visible(rootNode), "root node is visible");
    ok(BrowserTestUtils.is_hidden(encryptedNode), "encrypted node is hidden");
    ok(BrowserTestUtils.is_visible(cachedNode), "cached node is visible");
    ok(BrowserTestUtils.is_hidden(serverNode), "server node is hidden");
    is(serverNode.textContent, CUSTOM_RESOLVER.name);
  });
});

add_task(function finalize() {
  is(
    Object.values(gModeCounter).filter(v => v != 1).length,
    0,
    "no mode is untested"
  );
});
