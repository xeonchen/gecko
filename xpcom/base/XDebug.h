#ifndef mozilla_xpcom_base_XDebug_h
#define mozilla_xpcom_base_XDebug_h

#include <sstream>
#include "GuardObjects.h"

#ifdef WIN32
#  define XD_SEPARATOR '\\'
#else
#  define XD_SEPARATOR '/'
#endif  // WIN32

#define XD_STRINGIFY(v) #v
#define XD_TOSTRING(v) XD_STRINGIFY(v)

#define XD_BASENAME(path) \
  (strrchr(path, XD_SEPARATOR) ? strrchr(path, XD_SEPARATOR) + 1 : path)

#define __FILENAME__ XD_BASENAME(__FILE__)
#define __FILELINE__ XD_BASENAME(__FILE__ ":" XD_TOSTRING(__LINE__))

#define XD(...) xeon::debug::XDbgPrintHelper(__VA_ARGS__)
#define XDD(...)                                                             \
  xeon::debug::XDbgPrintHelper(xeon::debug::Title(__PRETTY_FUNCTION__), " ", \
                               ##__VA_ARGS__)
#define XDDD(...)                                                 \
  xeon::debug::XDbgPrintHelper(                                   \
      xeon::debug::Title(__FILELINE__, __PRETTY_FUNCTION__), " ", \
      ##__VA_ARGS__)

#define XD_FUNCTION(var)                                       \
  xeon::debug::AutoPrint MOZ_CONCAT2(xdap_, var)(__FILELINE__, \
                                                 __PRETTY_FUNCTION__)

namespace xeon::debug {

extern std::ostream gLog;

void XDbgPrint(const char* msg);

class MOZ_RAII AutoPrint final {
  MOZ_DECL_USE_GUARD_OBJECT_NOTIFIER;
  std::string mFile;
  std::string mFunc;

 public:
  explicit AutoPrint(std::string aFile,
                     std::string aFunc MOZ_GUARD_OBJECT_NOTIFIER_PARAM);
  ~AutoPrint();
};

template <typename... Args>
auto Title(Args&&... args) {
  std::ostringstream oss;
  (void)std::initializer_list<int>{((oss << "[" << args << "]"), 0)...};
  return oss.str();
}

template <typename... Args>
void XDbgPrintHelper(Args&&... args) {
  (void)std::initializer_list<int>{((gLog << args), 0)...};
  gLog << std::flush;
}

}  // namespace xeon::debug

#endif  // mozilla_xpcom_base_XDebug_h
