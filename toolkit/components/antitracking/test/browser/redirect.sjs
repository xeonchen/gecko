/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

function handleRequest(request, response)
{
  response.setStatusLine(request.httpVersion, 301, "Moved Permanently");
  response.setHeader("Location", request.queryString, false);
}
