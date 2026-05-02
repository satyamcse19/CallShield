import Foundation
import CallKit

class CallDirectoryHandler: CXCallDirectoryProvider {

    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self

        // Read blocked numbers from UserDefaults (no App Groups needed)
        let defaults = UserDefaults.standard
        if let numbers = defaults.array(forKey: "callshield_blocked") as? [String] {
            let sorted: [Int64] = numbers
                .compactMap { raw -> Int64? in
                    let digits = raw.filter { $0.isNumber }
                    guard digits.count >= 7 else { return nil }
                    return Int64(digits)
                }
                .sorted()
            for number in sorted {
                context.addBlockingEntry(withNextSequentialPhoneNumber: number)
            }
        }

        context.completeRequest()
    }
}

extension CallDirectoryHandler: CXCallDirectoryExtensionContextDelegate {
    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext, withError error: Error) {}
}
