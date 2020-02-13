/* -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef mozilla_netwerk_protocol_http_HttpTrafficAnalyzer_h
#define mozilla_netwerk_protocol_http_HttpTrafficAnalyzer_h

#include "nsTArrayForwardDeclare.h"
#include "mozilla/net/NeckoChannelParams.h"

namespace mozilla {
namespace net {

class HttpTrafficInfo final {
 public:
  enum TrackingCategory : uint8_t {
#define DEFINE_CATEGORY(_name, _idx) e##_name = _idx##u,
#include "HttpTrafficAnalyzer.inc"
#undef DEFINE_CATEGORY
    eInvalid,
  };

  struct TrackingComparator {
    bool Equals(const HttpTrafficInfo& aA, const HttpTrafficInfo& aB) const {
      return aA.mTrackingCategory == aB.mTrackingCategory;
    }
  };

  static void SerializeHttpTrafficInfo(const HttpTrafficInfo& aTrafficInfo,
                                       HttpTrafficInfoCloneArgs& aInfoArgs) {
    aInfoArgs.trackingCategory() =
        static_cast<uint8_t>(aTrafficInfo.mTrackingCategory);
  }

  static HttpTrafficInfo DeserializeHttpTrafficInfoCloneArgs(
      const HttpTrafficInfoCloneArgs& aInfoArgs) {
    return HttpTrafficInfo(
        static_cast<TrackingCategory>(aInfoArgs.trackingCategory()));
  }

  static HttpTrafficInfo InvalidTrafficInfo() {
    return HttpTrafficInfo(TrackingCategory::eInvalid);
  }

  explicit HttpTrafficInfo(uint8_t aTrackingCategory)
      : mTrackingCategory(static_cast<TrackingCategory>(aTrackingCategory)) {
    MOZ_ASSERT(aTrackingCategory < TrackingCategory::eInvalid);
  }

  explicit HttpTrafficInfo(TrackingCategory aTrackingCategory)
      : mTrackingCategory(aTrackingCategory) {}

  bool IsValid() const {
    return mTrackingCategory != TrackingCategory::eInvalid;
  }

  bool operator==(const HttpTrafficInfo& aOther) const {
    return mTrackingCategory == aOther.mTrackingCategory;
  }

  TrackingCategory GetTrackingCategory() const { return mTrackingCategory; }

 private:
  TrackingCategory mTrackingCategory;
};

class HttpTrafficAnalyzer final {
 public:
  enum ClassOfService : uint8_t {
    eLeader = 0,
    eBackground = 1,
    eOther = 255,
  };

  enum TrackingClassification : uint8_t {
    eNone = 0,
    eBasic = 1,
    eContent = 2,
    eFingerprinting = 3,
  };

  static HttpTrafficInfo CreateTrafficInfo(
      bool aIsPrivateMode, bool aIsSystemPrincipal, bool aIsThirdParty,
      ClassOfService aClassOfService, TrackingClassification aClassification);

  void IncrementHttpTransaction(HttpTrafficInfo aInfo);
  void IncrementHttpConnection(HttpTrafficInfo aInfo);
  void IncrementHttpConnection(nsTArray<HttpTrafficInfo>&& aCategories);
  void AccumulateHttpTransferredSize(HttpTrafficInfo aInfo, uint64_t aBytesRead,
                                     uint64_t aBytesSent);
};

}  // namespace net
}  // namespace mozilla

#endif  // mozilla_netwerk_protocol_http_HttpTrafficAnalyzer_h
