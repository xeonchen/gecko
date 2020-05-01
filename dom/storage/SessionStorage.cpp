/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "SessionStorage.h"
#include "SessionStorageCache.h"
#include "SessionStorageManager.h"

#include "mozilla/dom/StorageBinding.h"
#include "mozilla/Preferences.h"
#include "nsContentUtils.h"
#include "nsIPrincipal.h"
#include "nsPIDOMWindow.h"

#define DATASET                                          \
  IsSessionOnly() ? SessionStorageCache::eSessionSetType \
                  : SessionStorageCache::eDefaultSetType

namespace mozilla {
namespace dom {

NS_IMPL_CYCLE_COLLECTION_INHERITED(SessionStorage, Storage, mManager);

NS_INTERFACE_MAP_BEGIN_CYCLE_COLLECTION(SessionStorage)
NS_INTERFACE_MAP_END_INHERITING(Storage)

NS_IMPL_ADDREF_INHERITED(SessionStorage, Storage)
NS_IMPL_RELEASE_INHERITED(SessionStorage, Storage)

SessionStorage::SessionStorage(nsPIDOMWindowInner* aWindow,
                               nsIPrincipal* aPrincipal,
                               nsIPrincipal* aStoragePrincipal,
                               SessionStorageCache* aCache,
                               SessionStorageManager* aManager,
                               const nsAString& aDocumentURI, bool aIsPrivate)
    : Storage(aWindow, aPrincipal, aStoragePrincipal),
      mCache(aCache),
      mManager(aManager),
      mDocumentURI(aDocumentURI),
      mIsPrivate(aIsPrivate) {
  MOZ_ASSERT(aCache);
}

SessionStorage::~SessionStorage() = default;

int64_t SessionStorage::GetOriginQuotaUsage() const {
  return mCache->GetOriginQuotaUsage(DATASET);
}

uint32_t SessionStorage::GetLength(nsIPrincipal& aSubjectPrincipal,
                                   ErrorResult& aRv) {
  if (NS_WARN_IF(!CanUseStorage(aSubjectPrincipal))) {
    aRv.Throw(NS_ERROR_DOM_SECURITY_ERR);
    return 0;
  }

  uint32_t length = mCache->Length(DATASET);
  nsAutoCString origin;
  aSubjectPrincipal.GetOrigin(origin);
  printf_stderr("[xeon] GetLength(%s, %p, %d) %08x\n", origin.get(),
                mCache.get(), DATASET, length);

  return length;
}

void SessionStorage::Key(uint32_t aIndex, nsAString& aResult,
                         nsIPrincipal& aSubjectPrincipal, ErrorResult& aRv) {
  if (!CanUseStorage(aSubjectPrincipal)) {
    aRv.Throw(NS_ERROR_DOM_SECURITY_ERR);
    return;
  }

  mCache->Key(DATASET, aIndex, aResult);
}

void SessionStorage::GetItem(const nsAString& aKey, nsAString& aResult,
                             nsIPrincipal& aSubjectPrincipal,
                             ErrorResult& aRv) {
  if (!CanUseStorage(aSubjectPrincipal)) {
    aRv.Throw(NS_ERROR_DOM_SECURITY_ERR);
    return;
  }

  mCache->GetItem(DATASET, aKey, aResult);
}

void SessionStorage::GetSupportedNames(nsTArray<nsString>& aKeys) {
  if (!CanUseStorage(*nsContentUtils::SubjectPrincipal())) {
    // return just an empty array
    aKeys.Clear();
    return;
  }

  mCache->GetKeys(DATASET, aKeys);
}

void SessionStorage::SetItem(const nsAString& aKey, const nsAString& aValue,
                             nsIPrincipal& aSubjectPrincipal,
                             ErrorResult& aRv) {
  nsAutoCString origin;
  aSubjectPrincipal.GetOrigin(origin);
  printf_stderr("[xeon] SetItem(%s, %p, %d) k=%s, v=%s\n", origin.get(),
                mCache.get(), DATASET, NS_ConvertUTF16toUTF8(aKey).get(),
                NS_ConvertUTF16toUTF8(aValue).get());
  if (NS_WARN_IF(!CanUseStorage(aSubjectPrincipal))) {
    aRv.Throw(NS_ERROR_DOM_SECURITY_ERR);
    return;
  }

  nsString oldValue;
  nsresult rv = mCache->SetItem(DATASET, aKey, aValue, oldValue);
  if (NS_WARN_IF(NS_FAILED(rv))) {
    aRv.Throw(rv);
    return;
  }

  GetLength(aSubjectPrincipal, aRv);

  if (rv == NS_SUCCESS_DOM_NO_OPERATION) {
    return;
  }

  BroadcastChangeNotification(aKey, oldValue, aValue);
}

void SessionStorage::RemoveItem(const nsAString& aKey,
                                nsIPrincipal& aSubjectPrincipal,
                                ErrorResult& aRv) {
  if (NS_WARN_IF(!CanUseStorage(aSubjectPrincipal))) {
    aRv.Throw(NS_ERROR_DOM_SECURITY_ERR);
    return;
  }

  nsAutoCString origin;
  aSubjectPrincipal.GetOrigin(origin);
  printf_stderr("[xeon] RemoveItem(%s, %p) %s\n", origin.get(), mCache.get(),
                NS_ConvertUTF16toUTF8(aKey).get());

  nsString oldValue;
  nsresult rv = mCache->RemoveItem(DATASET, aKey, oldValue);
  MOZ_ASSERT(NS_SUCCEEDED(rv));

  if (rv == NS_SUCCESS_DOM_NO_OPERATION) {
    return;
  }

  BroadcastChangeNotification(aKey, oldValue, VoidString());
}

void SessionStorage::Clear(nsIPrincipal& aSubjectPrincipal, ErrorResult& aRv) {
  uint32_t length = GetLength(aSubjectPrincipal, aRv);

  nsAutoCString origin;
  aSubjectPrincipal.GetOrigin(origin);
  printf_stderr("[xeon] Clear(%s, %p) %08x\n", origin.get(), mCache.get(),
                length);

  if (!length) {
    return;
  }

  mCache->Clear(DATASET);
  BroadcastChangeNotification(VoidString(), VoidString(), VoidString());
}

void SessionStorage::BroadcastChangeNotification(const nsAString& aKey,
                                                 const nsAString& aOldValue,
                                                 const nsAString& aNewValue) {
  NotifyChange(this, StoragePrincipal(), aKey, aOldValue, aNewValue,
               u"sessionStorage", mDocumentURI, mIsPrivate, false);
}

bool SessionStorage::IsForkOf(const Storage* aOther) const {
  MOZ_ASSERT(aOther);
  if (aOther->Type() != eSessionStorage) {
    return false;
  }

  return mCache == static_cast<const SessionStorage*>(aOther)->mCache;
}

}  // namespace dom
}  // namespace mozilla
