/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

const TEST_URI = Services.io.newURI("http://example.com");
const TEST_PERMISSION = "test/oastrip";
const TEST_PERMISSION2 = "test/oastrip2";
const TEST_PERMISSION3 = "test/oastrip3";
const TEST_PERMISSION4 = "test/oastrip4";

// List of permissions which are not isolated by private browsing or user context
// as per array kStripOAPermissions in nsPermissionManager.cpp
const STRIPPED_PERMS = ["cookie"];

let principal = Services.scriptSecurityManager.createContentPrincipal(
  TEST_URI,
  {}
);
let principalFirstPartyDomain = Services.scriptSecurityManager.createContentPrincipal(
  TEST_URI,
  { firstPartyDomain: "example.org" }
);
let principalPrivateBrowsing = Services.scriptSecurityManager.createContentPrincipal(
  TEST_URI,
  { privateBrowsingId: 1 }
);
let principalUserContext1 = Services.scriptSecurityManager.createContentPrincipal(
  TEST_URI,
  { userContextId: 1 }
);
let principalUserContext2 = Services.scriptSecurityManager.createContentPrincipal(
  TEST_URI,
  { userContextId: 2 }
);

function testOAIsolation(
  permIsolateFirstPartyDomain,
  permIsolateUserContext,
  permIsolatePrivateBrowsing
) {
  info(
    `testOAIsolation: permIsolateFirstPartyDomain: ${permIsolateFirstPartyDomain}; permIsolateUserContext: ${permIsolateUserContext}; permIsolatePrivateBrowsing: ${permIsolatePrivateBrowsing}`
  );

  let pm = Services.perms;

  Services.prefs.setBoolPref(
    "permissions.isolateBy.firstPartyDomain",
    permIsolateFirstPartyDomain
  );
  Services.prefs.setBoolPref(
    "permissions.isolateBy.userContext",
    permIsolateUserContext
  );
  Services.prefs.setBoolPref(
    "permissions.isolateBy.privateBrowsing",
    permIsolatePrivateBrowsing
  );

  // Set test permission for normal browsing
  pm.addFromPrincipal(principal, TEST_PERMISSION, pm.ALLOW_ACTION);

  // Check normal browsing permission
  Assert.equal(
    Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principal, TEST_PERMISSION)
  );
  // normal browsing => user context 1
  Assert.equal(
    permIsolateUserContext
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principalUserContext1, TEST_PERMISSION)
  );
  // normal browsing => user context 2
  Assert.equal(
    permIsolateUserContext
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principalUserContext2, TEST_PERMISSION)
  );
  // normal browsing => private browsing
  Assert.equal(
    permIsolatePrivateBrowsing
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principalPrivateBrowsing, TEST_PERMISSION)
  );
  // normal browsing => first-party domain
  Assert.equal(
    permIsolateFirstPartyDomain
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principalFirstPartyDomain, TEST_PERMISSION)
  );

  // Set permission for private browsing
  pm.addFromPrincipal(
    principalPrivateBrowsing,
    TEST_PERMISSION2,
    pm.DENY_ACTION
  );

  // Check private browsing permission
  Assert.equal(
    Ci.nsIPermissionManager.DENY_ACTION,
    pm.testPermissionFromPrincipal(principalPrivateBrowsing, TEST_PERMISSION2)
  );
  // private browsing => normal browsing
  Assert.equal(
    permIsolatePrivateBrowsing
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.DENY_ACTION,
    pm.testPermissionFromPrincipal(principal, TEST_PERMISSION2)
  );
  // private browsing => user context 1
  Assert.equal(
    permIsolatePrivateBrowsing || permIsolateUserContext
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.DENY_ACTION,
    pm.testPermissionFromPrincipal(principalUserContext1, TEST_PERMISSION2)
  );
  // private browsing => user context 2
  Assert.equal(
    permIsolatePrivateBrowsing || permIsolateUserContext
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.DENY_ACTION,
    pm.testPermissionFromPrincipal(principalUserContext2, TEST_PERMISSION2)
  );
  // private browsing => first-party domain
  Assert.equal(
    permIsolateFirstPartyDomain || permIsolatePrivateBrowsing
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.DENY_ACTION,
    pm.testPermissionFromPrincipal(principalFirstPartyDomain, TEST_PERMISSION2)
  );

  // Set permission for user context 1
  pm.addFromPrincipal(
    principalUserContext1,
    TEST_PERMISSION3,
    pm.PROMPT_ACTION
  );

  // Check user context 1 permission
  Assert.equal(
    Ci.nsIPermissionManager.PROMPT_ACTION,
    pm.testPermissionFromPrincipal(principalUserContext1, TEST_PERMISSION3)
  );

  // user context 1 => normal browsing
  Assert.equal(
    permIsolateUserContext
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.PROMPT_ACTION,
    pm.testPermissionFromPrincipal(principal, TEST_PERMISSION3)
  );
  // user context 1 => user context 2
  Assert.equal(
    permIsolateUserContext
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.PROMPT_ACTION,
    pm.testPermissionFromPrincipal(principalUserContext2, TEST_PERMISSION3)
  );
  // user context 1 => private browsing
  Assert.equal(
    permIsolatePrivateBrowsing || permIsolateUserContext
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.PROMPT_ACTION,
    pm.testPermissionFromPrincipal(principalPrivateBrowsing, TEST_PERMISSION3)
  );
  // private browsing => first-party domain
  Assert.equal(
    permIsolateFirstPartyDomain || permIsolateUserContext
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.PROMPT_ACTION,
    pm.testPermissionFromPrincipal(principalFirstPartyDomain, TEST_PERMISSION3)
  );

  // Set permission for first-party domain
  pm.addFromPrincipal(
    principalFirstPartyDomain,
    TEST_PERMISSION4,
    pm.ALLOW_ACTION
  );

  // Check first-party domain permission
  Assert.equal(
    Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principalFirstPartyDomain, TEST_PERMISSION4)
  );
  // user first-party domain => normal browsing
  Assert.equal(
    permIsolateFirstPartyDomain
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principal, TEST_PERMISSION4)
  );
  // user first-party domain => user context 1
  Assert.equal(
    permIsolateUserContext || permIsolateFirstPartyDomain
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principalUserContext1, TEST_PERMISSION4)
  );
  // user first-party domain => user context 2
  Assert.equal(
    permIsolateUserContext || permIsolateFirstPartyDomain
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principalUserContext2, TEST_PERMISSION4)
  );
  // user first-party domain => private browsing
  Assert.equal(
    permIsolatePrivateBrowsing || permIsolateFirstPartyDomain
      ? Ci.nsIPermissionManager.UNKNOWN_ACTION
      : Ci.nsIPermissionManager.ALLOW_ACTION,
    pm.testPermissionFromPrincipal(principalPrivateBrowsing, TEST_PERMISSION4)
  );

  pm.removeAll();

  // Modifying an non-isolated/stripped permission should affect all browsing contexts,
  // independently of permission isolation pref state
  STRIPPED_PERMS.forEach(perm => {
    info("Testing stripped permission " + perm);

    // Add a permission for the normal window
    pm.addFromPrincipal(principal, perm, pm.ALLOW_ACTION);
    Assert.equal(
      pm.testPermissionFromPrincipal(principalFirstPartyDomain, perm),
      Ci.nsIPermissionManager.ALLOW_ACTION
    );
    Assert.equal(
      pm.testPermissionFromPrincipal(principalPrivateBrowsing, perm),
      Ci.nsIPermissionManager.ALLOW_ACTION
    );
    Assert.equal(
      pm.testPermissionFromPrincipal(principalUserContext1, perm),
      Ci.nsIPermissionManager.ALLOW_ACTION
    );
    Assert.equal(
      pm.testPermissionFromPrincipal(principalUserContext2, perm),
      Ci.nsIPermissionManager.ALLOW_ACTION
    );

    // Remove the permission from private window
    pm.removeFromPrincipal(principalPrivateBrowsing, perm);
    Assert.equal(
      pm.testPermissionFromPrincipal(principalFirstPartyDomain, perm),
      Ci.nsIPermissionManager.UNKNOWN_ACTION
    );
    Assert.equal(
      pm.testPermissionFromPrincipal(principal, perm),
      Ci.nsIPermissionManager.UNKNOWN_ACTION
    );
    Assert.equal(
      pm.testPermissionFromPrincipal(principalUserContext1, perm),
      Ci.nsIPermissionManager.UNKNOWN_ACTION
    );
    Assert.equal(
      pm.testPermissionFromPrincipal(principalUserContext2, perm),
      Ci.nsIPermissionManager.UNKNOWN_ACTION
    );

    // Set a permission for a normal window and then override it by adding it to container 2 again
    pm.addFromPrincipal(principal, perm, pm.PROMPT_ACTION);
    pm.addFromPrincipal(principal, TEST_PERMISSION, pm.ALLOW_ACTION);
    pm.addFromPrincipal(principalUserContext2, perm, pm.DENY_ACTION);

    let principalPerms = pm.getAllForPrincipal(principalPrivateBrowsing, perm);

    Assert.ok(
      principalPerms.some(p => p.type == perm && p.capability == pm.DENY_ACTION)
    );
    if (permIsolatePrivateBrowsing) {
      Assert.equal(principalPerms.length, 1);
      Assert.ok(
        principalPerms.some(
          p => p.type == perm && p.capability == pm.DENY_ACTION
        )
      );
    } else {
      Assert.equal(principalPerms.length, 2);
      Assert.ok(
        principalPerms.some(
          p => p.type == TEST_PERMISSION && p.capability == pm.ALLOW_ACTION
        )
      );
    }
  });

  // Cleanup
  pm.removeAll();
}

add_task(async function do_test() {
  // Test all pref combinations and check if principals with different origin attributes
  // are isolated.
  testOAIsolation(true, true, true);
  testOAIsolation(true, true, false);
  testOAIsolation(true, false, true);
  testOAIsolation(true, false, false);
  testOAIsolation(false, true, true);
  testOAIsolation(false, true, false);
  testOAIsolation(false, false, true);
  testOAIsolation(false, false, false);
});
