#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CallDirectoryReloader, NSObject)
RCT_EXTERN_METHOD(reload:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
