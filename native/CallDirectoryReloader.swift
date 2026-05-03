import Foundation
import CallKit
import React

@objc(CallDirectoryReloader)
class CallDirectoryReloader: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool { false }

    @objc func reload(_ resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
        let extID = "com.callshield.app.CallShieldExtension"
        CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier: extID) { error in
            if let err = error {
                reject("RELOAD_ERROR", err.localizedDescription, err)
            } else {
                resolve(nil)
            }
        }
    }
}
