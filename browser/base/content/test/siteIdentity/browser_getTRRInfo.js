/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const TEST_URL = "https://example.com/";

const PREF_TRR_MODE = "network.trr.mode";
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
  custom: 0,
};

registerCleanupFunction(async function() {
  [
    PREF_TRR_MODE,
    PREF_TRR_CUSTOM_URI,
    PREF_TRR_URI,
    PREF_TRR_RESOLVERS,
  ].forEach(Services.prefs.clearUserPref);
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

  // NOTE: TRR is enabled when PREF_TRR_MODE is 2 or 3.
  switch (mode) {
    case "disabled":
      Services.prefs.setIntPref(PREF_TRR_MODE, 0);
      Services.prefs.setCharPref(PREF_TRR_URI, "");
      break;
    case "default":
      Services.prefs.setIntPref(PREF_TRR_MODE, 2);
      Services.prefs.setCharPref(PREF_TRR_URI, DEFAULT_RESOLVER.url);
      break;
    case "custom":
      Services.prefs.setIntPref(PREF_TRR_MODE, 3);
      gBrowser.selectedBrowser._isFromCache = false;
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

  let rootNode = window.document.querySelector(".identity-popup-dns-content")
    .parentNode;
  let encryptedNode = window.document.querySelector(
    ".identity-popup-dns-encrypted"
  );
  let serverNode = gIdentityHandler._identityPopupDnsServer;

  await callback(rootNode, encryptedNode, serverNode);

  BrowserTestUtils.removeTab(tab);
  gModeCounter[mode] += 1;
}

add_task(async function testDisabled() {
  await runTest("disabled", rootNode => {
    ok(BrowserTestUtils.is_hidden(rootNode), "root node is hidden");
  });
});

add_task(async function testDefault() {
  await runTest("default", (rootNode, encryptedNode, serverNode) => {
    ok(BrowserTestUtils.is_visible(rootNode), "root node is visible");
    ok(BrowserTestUtils.is_visible(encryptedNode), "encrypted node is visible");
    ok(BrowserTestUtils.is_visible(serverNode), "server node is visible");
    is(serverNode.textContent, DEFAULT_RESOLVER.name);
  });
});

add_task(async function testCustom() {
  await runTest("custom", (rootNode, encryptedNode, serverNode) => {
    ok(BrowserTestUtils.is_visible(rootNode), "root node is visible");
    ok(BrowserTestUtils.is_visible(encryptedNode), "encrypted node is visible");
    ok(BrowserTestUtils.is_visible(serverNode), "server node is visible");
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
