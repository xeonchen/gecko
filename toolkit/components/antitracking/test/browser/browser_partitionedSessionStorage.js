/* import-globals-from antitracking_head.js */
/* import-globals-from partitionedstorage_head.js */

PartitionedStorageHelper.runTestInNormalAndPrivateMode(
  "Session Storage",
  async (win3rdParty, win1stParty, allowed) => {
    if (!allowed) {
      dump(`[xeon] before setting 3rd value\n`);
      win3rdParty.sessionStorage.setItem("foo", "3rd");
      dump(`[xeon] before setting 1st value\n`);
      win1stParty.sessionStorage.setItem("foo", "1st");
    }

    dump(`[xeon] before getting value3rd\n`);
    let value3rd = win3rdParty.sessionStorage.getItem("foo");
    dump(`[xeon] after getting value3rd: ${value3rd}\n`);
    let value1st = win1stParty.sessionStorage.getItem("foo");
    dump(`[xeon] after getting value1st: ${value1st}\n`);

    is(value1st, "1st", "1st party can always acccess 1st party storage");
    if (allowed) {
      is(value3rd, "1st", "3rd party is allowed to acccess 1st party storage");
    } else {
      is(
        value3rd,
        "3rd",
        "3rd party is not allowed to acccess 1st party storage"
      );
    }
  },
  async _ => {
    await new Promise(resolve => {
      Services.clearData.deleteData(Ci.nsIClearDataService.CLEAR_ALL, value =>
        resolve()
      );
    });
  }
);

PartitionedStorageHelper.runPartitioningTestInNormalAndPrivateMode(
  "Partitioned tabs - sessionStorage",
  "sessionstorage",

  // getDataCallback
  async win => {
    return "foo" in win.sessionStorage ? win.sessionStorage.getItem("foo") : "";
  },

  // addDataCallback
  async (win, value) => {
    win.sessionStorage.setItem("foo", value);
    return true;
  },

  // cleanup
  async _ => {
    await new Promise(resolve => {
      Services.clearData.deleteData(Ci.nsIClearDataService.CLEAR_ALL, value =>
        resolve()
      );
    });
  }
);
