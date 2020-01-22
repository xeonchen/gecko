#include "XDebug.h"

#include "mozilla/Logging.h"
#include "nsDebug.h"

#define XDHDR "xeon"

namespace xeon::debug {

class Logger : public std::stringbuf {
 public:
  static Logger& Instance() {
    static Logger sLogger;
    return sLogger;
  }

  virtual int sync() override {
    Logger logger;
    swap(logger);

    XDbgPrint(logger.str().c_str());
    return 0;
  }
};

std::ostream gLog(&Logger::Instance());

void XDbgPrint(const char* msg) {
  static mozilla::LazyLogModule sLog(XDHDR);
  printf_stderr("[" XDHDR "] %s\n", msg);
  MOZ_LOG(sLog, mozilla::LogLevel::Debug, ("%s", msg));
}

AutoPrint::AutoPrint(std::string aFile,
                     std::string aFunc MOZ_GUARD_OBJECT_NOTIFIER_PARAM_IN_IMPL)
    : mFile(aFile), mFunc(aFunc) {
  MOZ_GUARD_OBJECT_NOTIFIER_INIT;
  XD("**************************");
  XD(">>>> Enter ", mFunc, " <<<<");
  XD("**************************");
}

AutoPrint::~AutoPrint() {
  XD("**************************");
  XD(">>>> Leave ", mFunc, " <<<<");
  XD("**************************");
}

}  // namespace xeon::debug
