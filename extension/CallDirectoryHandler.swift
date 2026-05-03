import Foundation
import CallKit

class CallDirectoryHandler: CXCallDirectoryProvider {
    private let cacheKey = "cached_blocked_numbers"
    private let gistURL = "https://gist.githubusercontent.com/satyamcse19/5b6e0adc32ed506f190d82d359ae5c96/raw/blocked_numbers.json"

    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        addBlockingNumbers(to: context)
        context.completeRequest()
    }

    private func addBlockingNumbers(to context: CXCallDirectoryExtensionContext) {
        let numbers = fetchNumbers()

        let sorted: [Int64] = numbers
            .compactMap { raw -> Int64? in
                let digits = raw.filter { $0.isNumber }
                guard digits.count >= 7 else { return nil }
                // CallKit needs E.164 (with country code). 10-digit → assume India (+91).
                let e164 = digits.count == 10 ? "91" + digits : digits
                return Int64(e164)
            }
            .sorted()

        for number in sorted {
            context.addBlockingEntry(withNextSequentialPhoneNumber: number)
        }
    }

    private func fetchNumbers() -> [String] {
        guard let url = URL(string: gistURL) else { return cachedNumbers() }

        let semaphore = DispatchSemaphore(value: 0)
        var fetched: [String]? = nil

        var request = URLRequest(url: url, timeoutInterval: 10)
        request.cachePolicy = .reloadIgnoringLocalCacheData

        URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            defer { semaphore.signal() }
            guard let data = data,
                  let json = try? JSONDecoder().decode(GistPayload.self, from: data) else { return }
            fetched = json.blocked_numbers
            self?.cacheNumbers(json.blocked_numbers)
        }.resume()

        semaphore.wait()
        return fetched ?? cachedNumbers()
    }

    private func cachedNumbers() -> [String] {
        UserDefaults.standard.stringArray(forKey: cacheKey) ?? []
    }

    private func cacheNumbers(_ numbers: [String]) {
        UserDefaults.standard.set(numbers, forKey: cacheKey)
    }
}

private struct GistPayload: Decodable {
    let blocked_numbers: [String]
}
