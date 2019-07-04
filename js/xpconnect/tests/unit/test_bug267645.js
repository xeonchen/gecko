/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function run_test() {
  let sb = new Cu.Sandbox(this);
  let called = false;

  Cu.exportFunction(function() {
    undefined.foo();
  }, sb, { defineAs: "func" });
  try {
    Cu.evalInSandbox("func();", sb);
  } catch (e) {
    dump("[BUG 267645] fileName = " + e.fileName + "\n");
    Assert.ok(!e.fileName.includes("/unit/"));
    dump("[BUG 267645] stack = " + e.stack + "\n");
    Assert.ok(!e.stack.includes("/unit/"));
    called = true;
  }
  Assert.ok(called);
}
