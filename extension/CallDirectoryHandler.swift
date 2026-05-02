import Foundation
import CallKit

class CallDirectoryHandler: CXCallDirectoryProvider {

    private let appGroupID = "group.callshield.blocked"

    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self
        addBlockingNumbers(to: context)
        context.completeRequest()
    }

    private func addBlockingNumbers(to context: CXCallDirectoryExtensionContext) {
        guard
            let defaults = UserDefaults(suiteName: appGroupID),
            let numbers = defaults.array(forKey: "blocked_numbers") as? [String]
        else { return }

        // CXCallDirectoryExtension requires numbers sorted ascending
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
}

extension CallDirectoryHandler: CXCallDirectoryExtensionContextDelegate {
    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext, withError error: Error) {}
}
