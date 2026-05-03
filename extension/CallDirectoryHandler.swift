import Foundation
import CallKit

class CallDirectoryHandler: CXCallDirectoryProvider {
    private let cacheKey = "cached_blocked_numbers"
    // Gist API URL - works for public gists, no auth needed, filename-agnostic
    private let gistAPIURL = "https://api.github.com/gists/5b6e0adc32ed506f190d82d359ae5c96"

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
                // CallKit needs E.164 with country code. 10-digit → assume India (+91).
                let e164 = digits.count == 10 ? "91" + digits : digits
                return Int64(e164)
            }
            .sorted()

        for number in sorted {
            context.addBlockingEntry(withNextSequentialPhoneNumber: number)
        }
    }

    private func fetchNumbers() -> [String] {
        guard let url = URL(string: gistAPIURL) else { return cachedNumbers() }

        let semaphore = DispatchSemaphore(value: 0)
        var fetched: [String]? = nil

        var request = URLRequest(url: url, timeoutInterval: 10)
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")
        request.cachePolicy = .reloadIgnoringLocalCacheData

        URLSession.shared.dataTask(with: request) { [weak self] data, _, _ in
            defer { semaphore.signal() }
            guard let data = data,
                  let gist = try? JSONDecoder().decode(GistResponse.self, from: data),
                  let firstFile = gist.files.values.first,
                  let content = firstFile.content,
                  let payload = try? JSONDecoder().decode(GistPayload.self, from: Data(content.utf8))
            else { return }
            fetched = payload.blocked_numbers
            self?.cacheNumbers(payload.blocked_numbers)
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

private struct GistResponse: Decodable {
    let files: [String: GistFile]
}

private struct GistFile: Decodable {
    let content: String?
}

private struct GistPayload: Decodable {
    let blocked_numbers: [String]
}
